import re
import time
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models import AgentExecution
from .connector_service import ConnectorService
from .metrics_service import build_dashboard, fetch_all, format_inr
from .stock import LOW_STOCK_THRESHOLD, STOCK_LOW, STOCK_OUT, classify_stock, order_total
import uuid


class AgentService:
    """Service for agent query processing and tool execution"""

    SUPPORTED_INTENTS = {
        # More specific intents must come before general ones
        "high_value_pending_orders": {
            "patterns": [
                r"pending\s+orders?\s+above\s+[\$₹]?\s*([\d,]+)",
                r"find.*pending.*orders?.*[\$₹]?\s*([\d,]+)",
                r"orders?\s+above\s+[\$₹]?\s*([\d,]+).*pending",
                r"[\$₹]?\s*([\d,]+).*pending\s+orders?",
            ],
            "tool": "search_orders_filtered",
            "params_pattern": True,
        },
        "pending_orders": {
            "patterns": [
                r"pending\s+orders",
                r"find.*pending.*orders",
                r"show.*pending.*orders",
            ],
            "tool": "search_orders",
            "params": {"status": "pending"},
        },
        "low_stock_products": {
            "patterns": [
                r"low[\s-]+stock",
                r"low\s+inventory",
                r"approaching\s+low\s+stock",
            ],
            "tool": "list_products",
            "params": {"stock_level": "low"},
        },
        "out_of_stock": {
            "patterns": [
                r"out\s+of\s+stock",
                r"out\-of\-stock",
                r"unavailable\s+products?",
            ],
            "tool": "list_products",
            "params": {"stock_level": "out"},
        },
        "recent_customers": {
            "patterns": [
                r"recent\s+customers",
                r"new\s+customers",
                r"latest\s+customers",
            ],
            "tool": "list_customers",
        },
        "search_order_by_number": {
            "patterns": [
                r"order\s+#?(\d+)",
                r"find\s+order\s+#?(\d+)",
                r"get\s+order\s+#?(\d+)",
            ],
            "tool": "get_order",
            "params_pattern": True,
        },
        "search_product": {
            "patterns": [
                r"show\s+product\s+(.+)",
                r"find\s+product\s+(.+)",
                r"product\s+(.+)",
            ],
            "tool": "search_products",
            "params_pattern": True,
        },
        "search_customer": {
            "patterns": [
                r"customer\s+(.+)",
                r"find\s+customer\s+(.+)",
                r"show\s+customer\s+(.+)",
            ],
            "tool": "search_customers",
            "params_pattern": True,
        },
        "todays_sales": {
            "patterns": [
                r"today['’]?s?\s+sales",
                r"sales\s+today",
            ],
            "tool": "list_orders",
        },
    }

    @staticmethod
    def _extract_intent(query: str) -> tuple:
        """Extract intent and any parameters from query"""
        query_lower = query.lower()

        for intent_name, intent_config in AgentService.SUPPORTED_INTENTS.items():
            for pattern in intent_config.get("patterns", []):
                match = re.search(pattern, query_lower)
                if match:
                    params = intent_config.get("params", {})

                    # Extract parameters if pattern-based
                    if intent_config.get("params_pattern") and match.groups():
                        param_value = match.group(1)

                        if intent_name == "high_value_pending_orders":
                            try:
                                # Remove commas from number (e.g., "2,000" -> "2000")
                                amount = int(param_value.replace(",", ""))
                                return intent_name, {"status": "pending", "amount_threshold": amount}
                            except:
                                pass
                        elif intent_name == "search_order_by_number":
                            return intent_name, {"order_id": int(param_value)}
                        elif intent_name in ["search_product", "search_customer"]:
                            return intent_name, {"query": param_value.strip()}

                    return intent_name, params

        return None, None

    @staticmethod
    def _store_uuid(store_id: str):
        try:
            return uuid.UUID(str(store_id))
        except (TypeError, ValueError):
            return store_id

    @staticmethod
    def _record(db: Session, store_id: str, query: str, result_text: str, tools_count: int, started: float) -> None:
        execution = AgentExecution(
            id=uuid.uuid4(),
            store_id=AgentService._store_uuid(store_id),
            query=query,
            status="completed",
            output_json={"result": result_text, "tools_count": tools_count},
            duration_ms=int((time.time() - started) * 1000),
        )
        db.add(execution)
        db.commit()

    @staticmethod
    async def process_query(db: Session, store_id: str, query: str) -> Dict[str, Any]:
        """Process an agent query and return results.

        The response names the matched intent and its parameters so a client can
        render the same records the tools read.
        """
        start_time = time.time()
        tools_executed: List[Dict[str, Any]] = []

        intent, params = AgentService._extract_intent(query)

        def tool(name: str, tool_input: Dict[str, Any], output: Dict[str, Any], started: float) -> None:
            tools_executed.append({
                "name": name,
                "input": tool_input,
                "output": output,
                "duration_ms": int((time.time() - started) * 1000),
            })

        if not intent:
            result_text = "I can help with orders, products, inventory and customers. Try asking about pending orders, low stock, or specific products."
        else:
            try:
                connector = ConnectorService.get_connector(db, store_id)
                result_text = await AgentService._run(connector, intent, params or {}, tool)
            except Exception as e:
                result_text = f"Error processing request: {str(e)}"

        AgentService._record(db, store_id, query, result_text, len(tools_executed), start_time)

        return {
            "query": query,
            "intent": intent,
            "params": params or {},
            "result": result_text,
            "tools": tools_executed,
            "total_duration_ms": int((time.time() - start_time) * 1000),
        }

    @staticmethod
    async def _run(connector, intent: str, params: Dict[str, Any], tool) -> str:
        """Execute one intent against the connector and describe the outcome."""
        if intent in ("pending_orders", "high_value_pending_orders"):
            started = time.time()
            orders, _ = await fetch_all(connector.list_orders, "orders", status="pending")
            tool("search_orders", {"status": "pending"}, {"count": len(orders)}, started)

            if intent == "pending_orders":
                value = sum(order_total(o) for o in orders)
                return f"Found {len(orders)} pending orders worth {format_inr(value)}."

            threshold = params.get("amount_threshold", 0)
            started = time.time()
            filtered = [o for o in orders if order_total(o) >= threshold]
            tool("filter_orders", {"amount_threshold": threshold}, {"count": len(filtered)}, started)
            value = sum(order_total(o) for o in filtered)
            return (
                f"Found {len(filtered)} pending orders of {format_inr(threshold)} or more, "
                f"worth {format_inr(value)}."
            )

        if intent in ("low_stock_products", "out_of_stock"):
            level = STOCK_LOW if intent == "low_stock_products" else STOCK_OUT
            started = time.time()
            products, _ = await fetch_all(connector.list_products, "products")
            matching = [p for p in products if classify_stock(p) == level]
            tool("list_products", {"stock_level": level}, {"count": len(matching)}, started)
            if level == STOCK_LOW:
                return f"Found {len(matching)} products below the stock threshold of {LOW_STOCK_THRESHOLD}."
            return f"Found {len(matching)} out of stock products."

        if intent == "recent_customers":
            started = time.time()
            customers, _ = await fetch_all(connector.list_customers, "customers")
            dated = [c for c in customers if c.get("date_created")]
            shown = min(len(dated), 10)
            tool("list_customers", {"sort": "newest", "limit": 10}, {"count": shown}, started)
            if not dated:
                return "Customer join dates are not available from this store."
            return f"Showing the {shown} customers who joined most recently."

        if intent == "search_order_by_number":
            order_id = params.get("order_id")
            started = time.time()
            try:
                order = await connector.get_order(order_id)
            except Exception:
                order = None
            tool("get_order", {"order_id": order_id}, {"found": bool(order)}, started)
            if order:
                return (
                    f"Order #{order.get('number', order_id)} is {order.get('status')}, "
                    f"{format_inr(order_total(order))}."
                )
            return f"Order {order_id} not found."

        if intent == "search_product":
            search_query = params.get("query", "")
            started = time.time()
            response = await connector.search_products(search_query, per_page=20)
            count = len(response.get("products", []))
            tool("search_products", {"query": search_query}, {"count": count}, started)
            if count:
                return f"Found {count} products matching '{search_query}'."
            return f"No products found matching '{search_query}'."

        if intent == "search_customer":
            search_query = params.get("query", "")
            started = time.time()
            response = await connector.list_customers(search=search_query, per_page=20)
            count = len(response.get("customers", []))
            tool("search_customers", {"query": search_query}, {"count": count}, started)
            if count:
                return f"Found {count} customers matching '{search_query}'."
            return f"No customers found matching '{search_query}'."

        if intent == "todays_sales":
            started = time.time()
            orders, _ = await fetch_all(connector.list_orders, "orders")
            summary = build_dashboard(orders, [], "today")["period"]["current"]
            tool("list_orders", {"period": "today"}, {"count": summary["orders"]}, started)
            return (
                f"{format_inr(summary['net_revenue'])} from {summary['paid_orders']} paid orders today "
                f"({summary['orders']} placed in total)."
            )

        return "I can help with orders, products, inventory and customers."

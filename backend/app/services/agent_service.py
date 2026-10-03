import re
import time
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models import AgentExecution
from .connector_service import ConnectorService
import uuid


class AgentService:
    """Service for agent query processing and tool execution"""

    SUPPORTED_INTENTS = {
        "pending_orders": {
            "patterns": [
                r"pending\s+orders",
                r"find.*pending.*orders",
                r"show.*pending.*orders",
            ],
            "tool": "search_orders",
            "params": {"status": "pending"},
        },
        "high_value_pending_orders": {
            "patterns": [
                r"pending\s+orders?\s+above\s+[₹\$]?(\d+)",
                r"find.*pending.*orders?.*[₹\$]?(\d+)",
                r"orders?\s+above\s+[₹\$]?(\d+).*pending",
            ],
            "tool": "search_orders_filtered",
            "params_pattern": True,
        },
        "low_stock_products": {
            "patterns": [
                r"low\s+stock",
                r"low\s+inventory",
                r"products?\s+low\s+stock",
                r"approaching\s+low\s+stock",
            ],
            "tool": "list_products",
            "params": {"stock_status": "lowstock"},
        },
        "out_of_stock": {
            "patterns": [
                r"out\s+of\s+stock",
                r"out\-of\-stock",
                r"unavailable\s+products?",
            ],
            "tool": "list_products",
            "params": {"stock_status": "outofstock"},
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
                r"today\'s\s+sales",
                r"today\s+sales",
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
                                amount = int(param_value)
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
    async def process_query(db: Session, store_id: str, query: str) -> Dict[str, Any]:
        """Process an agent query and return results"""
        start_time = time.time()
        tools_executed: List[Dict[str, Any]] = []
        result_text = ""

        intent, params = AgentService._extract_intent(query)

        if not intent:
            result_text = "I can help with orders, products, inventory and customers. Try asking about pending orders, low stock, or specific products."

            execution = AgentExecution(
                id=uuid.uuid4(),
                store_id=store_id,
                query=query,
                status="completed",
                output_json={"result": result_text},
                duration_ms=int((time.time() - start_time) * 1000),
            )
            db.add(execution)
            db.commit()

            return {
                "query": query,
                "result": result_text,
                "tools": tools_executed,
                "total_duration_ms": int((time.time() - start_time) * 1000),
            }

        try:
            connector = ConnectorService.get_connector(db, store_id)

            # Execute based on intent
            if intent == "pending_orders":
                tool_start = time.time()
                response = await connector.list_orders(status="pending")
                tools_executed.append({
                    "name": "search_orders",
                    "input": {"status": "pending"},
                    "output": {"count": len(response.get("orders", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                count = len(response.get("orders", []))
                result_text = f"Found {count} pending orders."

            elif intent == "high_value_pending_orders":
                tool_start = time.time()
                response = await connector.list_orders(status="pending")
                tools_executed.append({
                    "name": "search_orders",
                    "input": {"status": "pending"},
                    "output": {"count": len(response.get("orders", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                # Filter by amount
                amount_threshold = params.get("amount_threshold", 0)
                filtered = [
                    o for o in response.get("orders", [])
                    if float(o.get("total", 0)) >= amount_threshold
                ]

                tools_executed.append({
                    "name": "filter_orders",
                    "input": {"amount_threshold": amount_threshold},
                    "output": {"count": len(filtered)},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                result_text = f"Found {len(filtered)} pending orders above ₹{amount_threshold}."

            elif intent == "low_stock_products":
                tool_start = time.time()
                response = await connector.list_products(stock_status="lowstock")
                tools_executed.append({
                    "name": "list_products",
                    "input": {"stock_status": "lowstock"},
                    "output": {"count": len(response.get("products", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                count = len(response.get("products", []))
                result_text = f"Found {count} products with low stock."

            elif intent == "out_of_stock":
                tool_start = time.time()
                response = await connector.list_products(stock_status="outofstock")
                tools_executed.append({
                    "name": "list_products",
                    "input": {"stock_status": "outofstock"},
                    "output": {"count": len(response.get("products", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                count = len(response.get("products", []))
                result_text = f"Found {count} out of stock products."

            elif intent == "recent_customers":
                tool_start = time.time()
                response = await connector.list_customers(per_page=10)
                tools_executed.append({
                    "name": "list_customers",
                    "input": {"per_page": 10},
                    "output": {"count": len(response.get("customers", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                count = len(response.get("customers", []))
                result_text = f"Retrieved {count} recent customers."

            elif intent == "search_order_by_number":
                order_id = params.get("order_id")
                tool_start = time.time()
                try:
                    order = await connector.get_order(order_id)
                    tools_executed.append({
                        "name": "get_order",
                        "input": {"order_id": order_id},
                        "output": {"found": bool(order)},
                        "duration_ms": int((time.time() - tool_start) * 1000),
                    })

                    if order:
                        result_text = f"Found order #{order.get('number', order_id)}: Status {order.get('status')} - ₹{order.get('total')}"
                    else:
                        result_text = f"Order {order_id} not found."
                except:
                    result_text = f"Could not retrieve order {order_id}."

            elif intent == "search_product":
                search_query = params.get("query", "")
                tool_start = time.time()
                response = await connector.search_products(search_query, per_page=5)
                tools_executed.append({
                    "name": "search_products",
                    "input": {"query": search_query},
                    "output": {"count": len(response.get("products", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                products = response.get("products", [])
                if products:
                    result_text = f"Found {len(products)} products matching '{search_query}'."
                else:
                    result_text = f"No products found matching '{search_query}'."

            elif intent == "search_customer":
                search_query = params.get("query", "")
                tool_start = time.time()
                response = await connector.list_customers(search=search_query, per_page=5)
                tools_executed.append({
                    "name": "search_customers",
                    "input": {"query": search_query},
                    "output": {"count": len(response.get("customers", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                customers = response.get("customers", [])
                if customers:
                    result_text = f"Found {len(customers)} customers matching '{search_query}'."
                else:
                    result_text = f"No customers found matching '{search_query}'."

            elif intent == "todays_sales":
                tool_start = time.time()
                response = await connector.list_orders(per_page=50)
                tools_executed.append({
                    "name": "list_orders",
                    "input": {"per_page": 50},
                    "output": {"count": len(response.get("orders", []))},
                    "duration_ms": int((time.time() - tool_start) * 1000),
                })

                orders = response.get("orders", [])
                result_text = f"Retrieved sales data: {len(orders)} orders found."

        except Exception as e:
            result_text = f"Error processing request: {str(e)}"

        # Save execution
        execution = AgentExecution(
            id=uuid.uuid4(),
            store_id=store_id,
            query=query,
            status="completed",
            output_json={"result": result_text, "tools_count": len(tools_executed)},
            duration_ms=int((time.time() - start_time) * 1000),
        )
        db.add(execution)
        db.commit()

        return {
            "query": query,
            "result": result_text,
            "tools": tools_executed,
            "total_duration_ms": int((time.time() - start_time) * 1000),
        }

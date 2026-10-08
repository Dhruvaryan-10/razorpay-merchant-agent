"""Regression tests for the P0 data, consistency and security fixes."""
from datetime import datetime, timedelta

import pytest

from app.connectors import DemoConnector
from app.services.agent_service import AgentService
from app.services.metrics_service import build_dashboard, format_inr
from app.services.stock import classify_stock, LOW_STOCK_THRESHOLD


class TestStockDefinition:
    def test_out_when_flagged_or_zero(self):
        assert classify_stock({"stock_status": "outofstock", "stock_quantity": None}) == "out"
        assert classify_stock({"stock_status": "instock", "stock_quantity": 0}) == "out"

    def test_low_below_threshold(self):
        assert classify_stock({"stock_status": "instock", "stock_quantity": LOW_STOCK_THRESHOLD - 1}) == "low"

    def test_healthy_at_threshold(self):
        assert classify_stock({"stock_status": "instock", "stock_quantity": LOW_STOCK_THRESHOLD}) == "healthy"

    def test_untracked_without_quantity(self):
        assert classify_stock({"stock_status": "instock", "stock_quantity": None}) == "untracked"


class TestRevenue:
    def _order(self, status, total, days_ago=1, items=1):
        return {
            "id": total, "status": status, "total": str(total), "customer_id": 1,
            "date_created": (datetime(2026, 10, 8, 12) - timedelta(days=days_ago)).isoformat(),
            "line_items": [{"product_id": 1, "quantity": items}],
        }

    def test_net_revenue_excludes_unpaid_and_cancelled(self):
        orders = [
            self._order("completed", 1000),
            self._order("processing", 500),
            self._order("pending", 700),
            self._order("cancelled", 9000),
            self._order("failed", 300),
        ]
        current = build_dashboard(orders, [], "30d", now=datetime(2026, 10, 8, 12))["period"]["current"]
        assert current["net_revenue"] == 1500
        assert current["paid_orders"] == 2
        assert current["orders"] == 5
        assert current["average_order"] == 750

    def test_period_window_and_previous_period(self):
        orders = [self._order("completed", 100, days_ago=3), self._order("completed", 40, days_ago=10)]
        period = build_dashboard(orders, [], "7d", now=datetime(2026, 10, 8, 12))["period"]
        assert period["current"]["net_revenue"] == 100
        assert period["previous"]["net_revenue"] == 40
        assert sum(b["revenue"] for b in period["series"]) == 100
        assert sum(b["prev_revenue"] for b in period["series"]) == 40

    def test_pending_is_reported_across_all_time(self):
        orders = [self._order("pending", 700, days_ago=80)]
        data = build_dashboard(orders, [], "7d", now=datetime(2026, 10, 8, 12))
        assert data["pending"]["count"] == 1
        assert data["pending"]["value"] == 700


class TestFormatting:
    def test_indian_grouping(self):
        assert format_inr(48210) == "₹48,210"
        assert format_inr(384210) == "₹3,84,210"
        assert format_inr(999) == "₹999"


class TestDemoDeterminism:
    def test_same_records_across_instances(self):
        a, b = DemoConnector(), DemoConnector()
        assert [(o["id"], o["total"], o["status"]) for o in a.orders_data] == \
               [(o["id"], o["total"], o["status"]) for o in b.orders_data]

    def test_order_totals_match_line_items(self):
        for order in DemoConnector().orders_data:
            items = sum(i["price"] * i["quantity"] for i in order["line_items"])
            assert float(order["total"]) == items

    @pytest.mark.asyncio
    async def test_customer_filter(self):
        connector = DemoConnector()
        customer_id = connector.orders_data[0]["customer_id"]
        result = await connector.list_orders(customer_id=customer_id, per_page=100)
        assert result["orders"]
        assert all(o["customer_id"] == customer_id for o in result["orders"])


class TestAgentIntents:
    @pytest.mark.parametrize("query,intent", [
        ("Show low-stock products", "low_stock_products"),
        ("Today’s sales", "todays_sales"),
        ("Today's sales", "todays_sales"),
        ("Pending orders above ₹2,000", "high_value_pending_orders"),
        ("Out of stock items", "out_of_stock"),
        ("Recent customers", "recent_customers"),
        ("Order #1048", "search_order_by_number"),
        ("Product Air Max", "search_product"),
        ("Customer Rahul", "search_customer"),
    ])
    def test_spec_queries_resolve(self, query, intent):
        assert AgentService._extract_intent(query)[0] == intent

    @pytest.mark.asyncio
    async def test_low_stock_uses_shared_definition(self):
        from unittest.mock import MagicMock, patch
        from sqlalchemy.orm import Session

        with patch("app.services.agent_service.ConnectorService.get_connector", return_value=DemoConnector()):
            result = await AgentService.process_query(MagicMock(spec=Session), "s", "Show low-stock products")

        expected = sum(1 for p in DemoConnector().products_data if classify_stock(p) == "low")
        assert result["intent"] == "low_stock_products"
        assert result["tools"][0]["output"]["count"] == expected


class TestConnectSecretHandling:
    def test_connect_rejects_query_string_credentials(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.post(
            "/api/stores/connect?store_url=https://x.test&consumer_key=ck&consumer_secret=cs"
        )
        assert response.status_code == 422


class TestOrderAmountFilter:
    def test_min_total_filters_and_paginates(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        store_id = client.post("/api/stores/demo").json()["store_id"]
        try:
            everything = client.get("/api/orders", params={"store_id": store_id, "per_page": 100}).json()
            expected = [o for o in everything["orders"] if o["total"] >= 5000]
            page = client.get(
                "/api/orders", params={"store_id": store_id, "min_total": 5000, "per_page": 5}
            ).json()
            assert page["total"] == len(expected)
            assert all(o["total"] >= 5000 for o in page["orders"])
            assert len(page["orders"]) == min(5, len(expected))
        finally:
            client.delete(f"/api/stores/{store_id}")

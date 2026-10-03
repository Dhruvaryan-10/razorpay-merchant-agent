"""Test agent service and intent matching."""
import pytest
import asyncio
from app.services.agent_service import AgentService
from app.connectors import DemoConnector


class TestAgentIntentExtraction:
    """Test intent extraction from queries."""

    def test_extract_pending_orders_intent(self):
        """Test extraction of pending orders intent."""
        intent, params = AgentService._extract_intent("Find pending orders")
        assert intent == "pending_orders"

    def test_extract_pending_orders_intent_variant(self):
        """Test alternate phrasing."""
        intent, params = AgentService._extract_intent("Show pending orders")
        assert intent == "pending_orders"

    def test_extract_high_value_pending_orders_intent(self):
        """Test extraction of high-value pending orders intent."""
        intent, params = AgentService._extract_intent("Find pending orders above ₹2000")
        assert intent == "high_value_pending_orders"
        assert params.get("amount_threshold") == 2000

    def test_extract_low_stock_intent(self):
        """Test extraction of low stock intent."""
        intent, params = AgentService._extract_intent("Show low stock products")
        assert intent == "low_stock_products"

    def test_extract_low_stock_inventory_intent(self):
        """Test alternate phrasing for low stock."""
        intent, params = AgentService._extract_intent("Low inventory alert")
        assert intent == "low_stock_products"

    def test_extract_out_of_stock_intent(self):
        """Test extraction of out of stock intent."""
        intent, params = AgentService._extract_intent("Show out of stock items")
        assert intent == "out_of_stock"

    def test_extract_recent_customers_intent(self):
        """Test extraction of recent customers intent."""
        intent, params = AgentService._extract_intent("Show recent customers")
        assert intent == "recent_customers"

    def test_extract_search_order_intent(self):
        """Test extraction of order search intent."""
        intent, params = AgentService._extract_intent("Order 1048")
        assert intent == "search_order_by_number"
        assert params.get("order_id") == 1048

    def test_extract_unsupported_intent(self):
        """Test extraction returns None for unsupported intent."""
        intent, params = AgentService._extract_intent("Delete all my orders")
        assert intent is None


class TestAgentProcessQuery:
    """Test agent query processing."""

    @pytest.mark.asyncio
    async def test_process_pending_orders_query(self):
        """Test processing of pending orders query."""
        from app.models import Store, Merchant
        from app.database import SessionLocal
        from unittest.mock import MagicMock
        from sqlalchemy.orm import Session

        # Create a mock database session
        db = MagicMock(spec=Session)
        store_id = "test-store-id"

        # Mock the store and connector
        result = await AgentService.process_query(db, store_id, "Find pending orders")

        # Should return a result with tools executed
        assert "query" in result
        assert "result" in result
        assert "tools" in result
        assert "total_duration_ms" in result
        assert result["query"] == "Find pending orders"

    @pytest.mark.asyncio
    async def test_process_unsupported_query(self):
        """Test processing of unsupported query."""
        from unittest.mock import MagicMock
        from sqlalchemy.orm import Session

        db = MagicMock(spec=Session)
        store_id = "test-store-id"

        result = await AgentService.process_query(
            db, store_id, "Give me admin access to your system"
        )

        # Should return helpful message about supported operations
        assert "I can help with orders, products, inventory and customers" in result["result"]
        assert len(result["tools"]) == 0  # No tools called


def test_agent_has_supported_intents():
    """Test that agent has the required supported intents."""
    required_intents = [
        "pending_orders",
        "high_value_pending_orders",
        "low_stock_products",
        "out_of_stock",
        "recent_customers",
        "search_order_by_number",
        "search_product",
        "search_customer",
        "todays_sales",
    ]

    for intent in required_intents:
        assert intent in AgentService.SUPPORTED_INTENTS

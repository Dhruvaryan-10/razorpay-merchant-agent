"""Test database models can be imported and instantiated."""
import pytest
from app.models import (
    Merchant,
    Store,
    WooCommerceConnection,
    Order,
    Product,
    Customer,
    SyncRun,
    AgentExecution,
)
from app.database import Base
import uuid


def test_all_models_imported():
    """Test that all models can be imported."""
    assert Merchant is not None
    assert Store is not None
    assert WooCommerceConnection is not None
    assert Order is not None
    assert Product is not None
    assert Customer is not None
    assert SyncRun is not None
    assert AgentExecution is not None


def test_base_metadata_has_all_tables():
    """Test that Base.metadata contains all expected tables."""
    table_names = {table.name for table in Base.metadata.tables.values()}

    expected_tables = {
        "merchants",
        "stores",
        "woocommerce_connections",
        "orders",
        "products",
        "customers",
        "sync_runs",
        "agent_executions",
    }

    assert expected_tables == table_names


def test_merchant_table_structure():
    """Test Merchant model has expected columns."""
    merchant = Merchant.__table__
    column_names = {col.name for col in merchant.columns}

    assert "id" in column_names
    assert "name" in column_names
    assert "created_at" in column_names
    assert "updated_at" in column_names


def test_store_table_structure():
    """Test Store model has expected columns."""
    store = Store.__table__
    column_names = {col.name for col in store.columns}

    assert "id" in column_names
    assert "merchant_id" in column_names
    assert "name" in column_names
    assert "store_url" in column_names
    assert "provider" in column_names
    assert "mode" in column_names
    assert "status" in column_names


def test_woocommerce_connection_table_structure():
    """Test WooCommerceConnection model has expected columns."""
    connection = WooCommerceConnection.__table__
    column_names = {col.name for col in connection.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "consumer_key" in column_names
    assert "encrypted_consumer_secret" in column_names


def test_order_table_structure():
    """Test Order model has expected columns."""
    order = Order.__table__
    column_names = {col.name for col in order.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "external_id" in column_names
    assert "order_number" in column_names
    assert "status" in column_names
    assert "total" in column_names
    assert "currency" in column_names


def test_product_table_structure():
    """Test Product model has expected columns."""
    product = Product.__table__
    column_names = {col.name for col in product.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "external_id" in column_names
    assert "name" in column_names
    assert "sku" in column_names
    assert "price" in column_names
    assert "stock_quantity" in column_names
    assert "stock_status" in column_names


def test_customer_table_structure():
    """Test Customer model has expected columns."""
    customer = Customer.__table__
    column_names = {col.name for col in customer.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "external_id" in column_names
    assert "name" in column_names
    assert "email" in column_names


def test_sync_run_table_structure():
    """Test SyncRun model has expected columns."""
    sync_run = SyncRun.__table__
    column_names = {col.name for col in sync_run.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "entity_type" in column_names
    assert "status" in column_names


def test_agent_execution_table_structure():
    """Test AgentExecution model has expected columns."""
    execution = AgentExecution.__table__
    column_names = {col.name for col in execution.columns}

    assert "id" in column_names
    assert "store_id" in column_names
    assert "query" in column_names
    assert "tool_name" in column_names
    assert "status" in column_names

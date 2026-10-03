"""Test connectors (Demo and WooCommerce)."""
import pytest
import asyncio
from app.connectors import DemoConnector, WooCommerceConnector, BaseMerchantConnector


def test_demo_connector_initialization():
    """Test DemoConnector initializes correctly."""
    connector = DemoConnector()
    assert connector.store_name == "Pranav Store"
    assert len(connector.products_data) == 15
    assert len(connector.orders_data) == 30
    assert len(connector.customers_data) == 12


def test_demo_connector_is_base_connector():
    """Test DemoConnector implements BaseMerchantConnector."""
    connector = DemoConnector()
    assert isinstance(connector, BaseMerchantConnector)


@pytest.mark.asyncio
async def test_demo_connector_verify_connection():
    """Test DemoConnector can verify connection."""
    connector = DemoConnector()
    result = await connector.verify_connection()
    assert result is True


@pytest.mark.asyncio
async def test_demo_connector_list_orders():
    """Test DemoConnector can list orders."""
    connector = DemoConnector()
    result = await connector.list_orders()
    assert "orders" in result
    assert result["total"] == 30
    assert len(result["orders"]) <= 20  # Default per_page


@pytest.mark.asyncio
async def test_demo_connector_get_order():
    """Test DemoConnector can get a single order."""
    connector = DemoConnector()
    # Get first order ID
    orders = await connector.list_orders()
    if orders["orders"]:
        order_id = orders["orders"][0]["id"]
        result = await connector.get_order(order_id)
        assert result["id"] == order_id


@pytest.mark.asyncio
async def test_demo_connector_search_orders():
    """Test DemoConnector can search orders."""
    connector = DemoConnector()
    result = await connector.search_orders("1001")
    assert "orders" in result


@pytest.mark.asyncio
async def test_demo_connector_list_products():
    """Test DemoConnector can list products."""
    connector = DemoConnector()
    result = await connector.list_products()
    assert "products" in result
    assert result["total"] == 15
    assert len(result["products"]) <= 20


@pytest.mark.asyncio
async def test_demo_connector_get_product():
    """Test DemoConnector can get a single product."""
    connector = DemoConnector()
    products = await connector.list_products()
    if products["products"]:
        product_id = products["products"][0]["id"]
        result = await connector.get_product(product_id)
        assert result["id"] == product_id


@pytest.mark.asyncio
async def test_demo_connector_search_products():
    """Test DemoConnector can search products."""
    connector = DemoConnector()
    result = await connector.search_products("Headphones")
    assert "products" in result


@pytest.mark.asyncio
async def test_demo_connector_list_customers():
    """Test DemoConnector can list customers."""
    connector = DemoConnector()
    result = await connector.list_customers()
    assert "customers" in result
    assert result["total"] == 12


@pytest.mark.asyncio
async def test_demo_connector_get_customer():
    """Test DemoConnector can get a single customer."""
    connector = DemoConnector()
    customers = await connector.list_customers()
    if customers["customers"]:
        customer_id = customers["customers"][0]["id"]
        result = await connector.get_customer(customer_id)
        assert result["id"] == customer_id


@pytest.mark.asyncio
async def test_demo_connector_get_store_info():
    """Test DemoConnector can get store info."""
    connector = DemoConnector()
    result = await connector.get_store_info()
    assert "name" in result
    assert result["name"] == "Pranav Store"


def test_woocommerce_connector_initialization():
    """Test WooCommerceConnector can be initialized."""
    connector = WooCommerceConnector(
        store_url="https://example.com",
        consumer_key="test_key",
        consumer_secret="test_secret",
    )
    assert connector.store_url == "https://example.com"
    assert connector.consumer_key == "test_key"
    # Consumer secret should be stored as private attribute only
    assert hasattr(connector, "_consumer_secret")
    # Should not be exposed as public attribute
    assert not hasattr(connector, "consumer_secret")


def test_woocommerce_connector_url_normalization():
    """Test WooCommerceConnector normalizes URLs correctly."""
    connector = WooCommerceConnector(
        store_url="https://example.com/",
        consumer_key="test_key",
        consumer_secret="test_secret",
    )
    # Should strip trailing slash
    assert connector.store_url == "https://example.com"


def test_demo_connector_pagination():
    """Test DemoConnector handles pagination correctly."""
    connector = DemoConnector()
    # Test first page
    result = asyncio.run(connector.list_orders(page=1, per_page=5))
    assert len(result["orders"]) == 5
    assert result["page"] == 1


def test_demo_connector_status_filtering():
    """Test DemoConnector filters by status."""
    connector = DemoConnector()
    result = asyncio.run(connector.list_orders(status="pending"))
    # Should only have pending orders
    for order in result["orders"]:
        assert order["status"] == "pending"


def test_demo_connector_stock_filtering():
    """Test DemoConnector filters products by stock status."""
    connector = DemoConnector()
    result = asyncio.run(connector.list_products(stock_status="lowstock"))
    # Should only have low stock products
    for product in result["products"]:
        assert product["stock_status"] == "lowstock"

#!/usr/bin/env python3
"""
Simple WooCommerce integration test script.
Test basic connectivity and API operations with real WooCommerce credentials.
"""

import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.connectors import WooCommerceConnector


async def test_woocommerce():
    """Test WooCommerce API integration"""

    # Get credentials from environment
    store_url = os.getenv("WC_STORE_URL")
    consumer_key = os.getenv("WC_CONSUMER_KEY")
    consumer_secret = os.getenv("WC_CONSUMER_SECRET")

    if not store_url or not consumer_key or not consumer_secret:
        print("ERROR: Missing WooCommerce credentials")
        print("\nPlease set environment variables:")
        print("  export WC_STORE_URL=https://your-store.com")
        print("  export WC_CONSUMER_KEY=your_key")
        print("  export WC_CONSUMER_SECRET=your_secret")
        print("\nThen run:")
        print("  python scripts/test_woocommerce.py")
        return False

    try:
        print("🔌 Initializing WooCommerce connector...")
        connector = WooCommerceConnector(
            store_url=store_url,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
        )

        print(f"📍 Store URL: {store_url}")
        print(f"🔑 Consumer Key: {consumer_key[:10]}...")

        print("\n✓ Testing connection...")
        if not await connector.verify_connection():
            print("❌ Connection failed. Check credentials and API permissions.")
            return False
        print("✓ Connection successful")

        print("\n✓ Getting store info...")
        store_info = await connector.get_store_info()
        print(f"  Store: {store_info.get('name', 'Unknown')}")

        print("\n✓ Fetching orders...")
        orders = await connector.list_orders(per_page=1)
        order_count = orders.get("total", 0)
        print(f"  Orders found: {order_count}")
        if orders.get("orders"):
            order = orders["orders"][0]
            print(f"  Sample order: #{order.get('number', 'N/A')} - {order.get('status')}")

        print("\n✓ Fetching products...")
        products = await connector.list_products(per_page=1)
        product_count = products.get("total", 0)
        print(f"  Products found: {product_count}")
        if products.get("products"):
            product = products["products"][0]
            print(f"  Sample product: {product.get('name', 'N/A')} - Stock: {product.get('stock_quantity', 0)}")

        print("\n✓ Fetching customers...")
        customers = await connector.list_customers(per_page=1)
        customer_count = customers.get("total", 0)
        print(f"  Customers found: {customer_count}")

        print("\n✅ All tests passed! WooCommerce integration is working.\n")
        return True

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_woocommerce())
    sys.exit(0 if success else 1)

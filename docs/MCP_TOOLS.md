# MCP-Style Tool Definitions

Merchant Agent exposes connector tools following an MCP-inspired interface. These tools are the foundation of the agent system.

## Tool Interface

All tools follow this pattern:

```python
{
  "name": "tool_name",
  "description": "Human-readable description",
  "input_schema": {
    "type": "object",
    "properties": {
      "param1": {"type": "string", "description": "..."},
      "param2": {"type": "integer", "description": "..."}
    },
    "required": ["param1"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {"type": "array"},
      "total": {"type": "integer"}
    }
  },
  "permissions": ["READ_ONLY"]
}
```

## Core Tools

### Orders

#### list_orders
List orders from the merchant store.

**Input:**
```json
{
  "page": 1,
  "per_page": 20,
  "status": "pending|processing|completed|cancelled|failed",
  "search": "optional_search_query"
}
```

**Output:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "1048",
      "status": "pending",
      "total": 2499.99,
      "currency": "INR",
      "customer_name": "Rahul Sharma",
      "created_at": "2026-10-03T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

**Permissions:** `READ_ONLY`

#### get_order
Get detailed information about a specific order.

**Input:**
```json
{
  "order_id": 1048
}
```

**Output:**
```json
{
  "id": "uuid",
  "order_number": "1048",
  "status": "pending",
  "total": 2499.99,
  "currency": "INR",
  "customer_id": "uuid",
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "payment_method": "credit_card",
  "line_items": [
    {
      "product_id": 123,
      "name": "Product Name",
      "quantity": 2,
      "price": 1249.99
    }
  ],
  "billing_address": {...},
  "shipping_address": {...},
  "created_at": "2026-10-03T10:30:00Z"
}
```

**Permissions:** `READ_ONLY`

#### search_orders
Search orders by number or customer name.

**Input:**
```json
{
  "query": "1048",
  "page": 1,
  "per_page": 20
}
```

**Output:** Same as `list_orders`

**Permissions:** `READ_ONLY`

### Products

#### list_products
List products from the store.

**Input:**
```json
{
  "page": 1,
  "per_page": 20,
  "stock_status": "instock|lowstock|outofstock",
  "search": "optional_search_query"
}
```

**Output:**
```json
{
  "products": [
    {
      "id": "uuid",
      "external_id": 456,
      "name": "Product Name",
      "sku": "SKU-001",
      "price": 1299.99,
      "stock_quantity": 15,
      "stock_status": "instock",
      "description": "Product description",
      "created_at": "2026-09-01T00:00:00Z"
    }
  ],
  "total": 127,
  "page": 1,
  "per_page": 20,
  "total_pages": 7
}
```

**Permissions:** `READ_ONLY`

#### get_product
Get detailed product information.

**Input:**
```json
{
  "product_id": 456
}
```

**Output:**
```json
{
  "id": "uuid",
  "external_id": 456,
  "name": "Wireless Headphones",
  "sku": "WH-001",
  "price": 4999.99,
  "stock_quantity": 25,
  "stock_status": "instock",
  "description": "Premium wireless headphones",
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "created_at": "2026-09-01T00:00:00Z"
}
```

**Permissions:** `READ_ONLY`

#### search_products
Search products by name or SKU.

**Input:**
```json
{
  "query": "headphones",
  "page": 1,
  "per_page": 20
}
```

**Output:** Same as `list_products`

**Permissions:** `READ_ONLY`

### Inventory

#### get_inventory
Get store inventory status and insights.

**Input:** (none required)
```json
{}
```

**Output:**
```json
{
  "summary": {
    "total_products": 127,
    "healthy_stock": 98,
    "low_stock": 18,
    "out_of_stock": 11
  },
  "by_status": {
    "healthy": [...],
    "low_stock": [...],
    "out_of_stock": [...]
  },
  "low_stock_threshold": 10
}
```

**Permissions:** `READ_ONLY`

### Customers

#### list_customers
List store customers.

**Input:**
```json
{
  "page": 1,
  "per_page": 20,
  "search": "optional_name_or_email"
}
```

**Output:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "external_id": 789,
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "total_spent": 18500.00,
      "order_count": 5,
      "created_at": "2026-08-15T00:00:00Z"
    }
  ],
  "total": 47,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

**Permissions:** `READ_ONLY`

#### get_customer
Get customer details.

**Input:**
```json
{
  "customer_id": 789
}
```

**Output:**
```json
{
  "id": "uuid",
  "external_id": 789,
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+91-9876543210",
  "address": {...},
  "total_spent": 18500.00,
  "order_count": 5,
  "created_at": "2026-08-15T00:00:00Z"
}
```

**Permissions:** `READ_ONLY`

## Tool Execution

### In Agent Context
Tools are executed automatically based on intent matching:

```
User Query: "Find pending orders above ₹2,000"
  ↓
Intent Detection: high_value_pending_orders
  ↓
Tool Execution:
  1. list_orders(status="pending")
  2. filter_orders(amount_threshold=2000)
  ↓
Result: "Found 6 pending orders above ₹2,000"
```

### Direct API Access
Tools can also be called directly via REST API:

```bash
curl -X GET http://localhost:8000/api/orders?status=pending&page=1&per_page=20
```

## Permissions

All tools are `READ_ONLY`:
- No order modifications
- No product updates
- No customer data changes
- No inventory modifications
- No system changes

Write operations are intentionally not implemented for security and simplicity.

## Error Handling

Tools return structured errors:

```json
{
  "error": {
    "code": "WOOCOMMERCE_AUTH_FAILED",
    "message": "WooCommerce credentials were rejected.",
    "request_id": "abc123def456"
  }
}
```

Common error codes:
- `WOOCOMMERCE_AUTH_FAILED` - Authentication error
- `WOOCOMMERCE_TIMEOUT` - Request timeout
- `INVALID_STORE` - Store not found
- `CONNECTOR_ERROR` - Connector operation failed
- `RATE_LIMITED` - Too many requests

## Tool Discovery

List available tools:

```python
from app.connectors import BaseMerchantConnector

# Tools available on any connector
tools = [
  "list_orders",
  "get_order",
  "search_orders",
  "list_products",
  "get_product",
  "search_products",
  "list_customers",
  "get_customer",
  "get_inventory",
]
```

## Implementation

### Backend Implementation
Tools are implemented in `app/connectors/base.py` (interface) and provider-specific files (WooCommerce, Demo).

### Adding New Tools
1. Define method in `BaseMerchantConnector`
2. Implement in `WooCommerceConnector`
3. Add to `DemoConnector`
4. Add intent routing in `AgentService`

## Rate Limiting

Tool execution respects WooCommerce rate limits:
- Automatic retry on 429
- Exponential backoff (2s, 4s, 8s, etc.)
- Max 3 retries by default
- Respects `Retry-After` header

## Caching

Currently no caching. For production:
1. Add Redis caching
2. Cache product list (1 hour)
3. Cache customer list (30 minutes)
4. No caching for orders (real-time data)

## Monitoring

Tool execution is logged:
```json
{
  "tool_name": "list_orders",
  "input": {"status": "pending", "page": 1},
  "output": {"orders": [...], "total": 42},
  "duration_ms": 234,
  "timestamp": "2026-10-03T10:30:00Z"
}
```

Access via `/api/agent/executions`

## Extending Tools

### Add New Tool
```python
# 1. Add to base connector
async def new_tool(self, param: str):
    pass

# 2. Implement in WooCommerce
async def new_tool(self, param: str):
    response = await self._request("GET", "/endpoint", {"param": param})
    return response

# 3. Implement in Demo
async def new_tool(self, param: str):
    return {"result": "demo data"}

# 4. Update agent routing
if intent == "my_intent":
    response = await connector.new_tool(param)
```

## Future Tools

Potential tools for future implementation:
- `update_product` - Modify product details
- `create_order` - Create new order
- `update_inventory` - Adjust stock
- `send_email` - Email customer
- `generate_report` - Analytics reports

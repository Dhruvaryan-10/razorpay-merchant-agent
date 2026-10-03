from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import uuid

from app.database import get_db
from app.models import Store, Order, Product, Customer, AgentExecution
from app.schemas import (
    StoreResponse, OrderResponse, ProductResponse, CustomerResponse,
    AgentQuery, AgentResponse, ToolExecution
)
from app.services import StoreService, ConnectorService, AgentService
from app.connectors import WooCommerceConnector

router = APIRouter(prefix="/api", tags=["merchant"])

# ===== Store Management =====

@router.post("/stores/demo")
async def create_demo_store(db: Session = Depends(get_db)):
    """Create a demo store with synthetic data"""
    try:
        merchant = StoreService.get_or_create_merchant(db)
        store = StoreService.create_demo_store(db, str(merchant.id))

        return {
            "store_id": str(store.id),
            "name": store.name,
            "mode": store.mode,
            "status": store.status,
            "message": "Demo store created successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stores/connect")
async def connect_woocommerce_store(
    store_url: str = Query(...),
    consumer_key: str = Query(...),
    consumer_secret: str = Query(...),
    db: Session = Depends(get_db),
):
    """Connect a real WooCommerce store"""
    try:
        # Validate inputs
        if not store_url or not consumer_key or not consumer_secret:
            raise Exception("Missing required fields")

        # Create connector to test connection
        connector = WooCommerceConnector(
            store_url=store_url,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
        )

        # Verify the connection
        if not await connector.verify_connection():
            raise Exception("Could not connect to WooCommerce. Check your credentials.")

        # Get store info
        store_info = await connector.get_store_info()

        # Create merchant and store
        merchant = StoreService.get_or_create_merchant(db)

        store = StoreService.create_live_store(
            db=db,
            merchant_id=str(merchant.id),
            store_url=store_url,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
        )

        return {
            "store_id": str(store.id),
            "name": store_info.get("name", "WooCommerce Store"),
            "store_url": store_url,
            "mode": "live",
            "status": "connected",
            "message": "WooCommerce store connected successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stores")
async def list_stores(db: Session = Depends(get_db)):
    """List all stores for the merchant"""
    try:
        merchant = StoreService.get_or_create_merchant(db)
        stores = StoreService.get_stores(db, str(merchant.id))

        result = []
        for store in stores:
            result.append({
                "id": str(store.id),
                "name": store.name,
                "store_url": store.store_url,
                "provider": store.provider,
                "mode": store.mode,
                "status": store.status,
                "last_synced_at": store.last_synced_at,
                "created_at": store.created_at,
            })

        return {"stores": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stores/{store_id}")
async def get_store(store_id: str, db: Session = Depends(get_db)):
    """Get store details"""
    try:
        store = StoreService.get_store(db, store_id)
        if not store:
            raise Exception("Store not found")

        return {
            "id": str(store.id),
            "name": store.name,
            "store_url": store.store_url,
            "provider": store.provider,
            "mode": store.mode,
            "status": store.status,
            "last_synced_at": store.last_synced_at,
            "created_at": store.created_at,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/stores/{store_id}")
async def disconnect_store(store_id: str, db: Session = Depends(get_db)):
    """Disconnect and delete a store"""
    try:
        StoreService.delete_store(db, store_id)
        return {"message": "Store disconnected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Dashboard =====

@router.get("/dashboard")
async def get_dashboard(store_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Get dashboard metrics and insights"""
    try:
        # Get first store if not specified
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        store = StoreService.get_store(db, store_id)
        if not store:
            raise Exception("Store not found")

        connector = ConnectorService.get_connector(db, store_id)

        # Get metrics
        orders_response = await connector.list_orders(per_page=100)
        products_response = await connector.list_products(per_page=100)
        customers_response = await connector.list_customers(per_page=100)

        orders = orders_response.get("orders", [])
        products = products_response.get("products", [])
        customers = customers_response.get("customers", [])

        # Calculate metrics
        total_orders = len(orders)
        pending_orders = len([o for o in orders if o.get("status") == "pending"])
        total_revenue = sum(float(o.get("total", 0)) for o in orders)
        pending_value = sum(float(o.get("total", 0)) for o in orders if o.get("status") == "pending")

        low_stock = len([p for p in products if p.get("stock_status") in ["lowstock", "outofstock"]])
        out_of_stock = len([p for p in products if p.get("stock_status") == "outofstock"])

        # Recent orders - normalize before returning
        recent_orders_raw = sorted(orders, key=lambda x: x.get("date_created", ""), reverse=True)[:5]
        recent_orders = []
        for order in recent_orders_raw:
            recent_orders.append({
                "id": str(order.get("id", "")),
                "order_number": str(order.get("number", order.get("id", ""))),
                "external_id": order.get("id", 0),
                "status": order.get("status", ""),
                "total": float(order.get("total", 0)),
                "currency": order.get("currency", "INR"),
                "customer_id": order.get("customer_id"),
                "customer_name": order.get("billing", {}).get("first_name", ""),
                "customer_email": order.get("billing", {}).get("email", ""),
                "payment_method": order.get("payment_method", ""),
                "created_at": order.get("date_created", datetime.now().isoformat()),
            })

        return {
            "store": {
                "id": str(store.id),
                "name": store.name,
                "mode": store.mode,
                "status": store.status,
            },
            "metrics": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "pending_value": pending_value,
                "low_stock_count": low_stock,
                "out_of_stock_count": out_of_stock,
                "total_products": len(products),
                "total_customers": len(customers),
            },
            "recent_orders": recent_orders,
            "insights": [
                f"{low_stock} products approaching low stock" if low_stock > 0 else None,
                f"₹{pending_value:.0f} tied up in {pending_orders} pending orders" if pending_orders > 0 else None,
                f"{out_of_stock} products out of stock" if out_of_stock > 0 else None,
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Orders =====

@router.get("/orders")
async def list_orders(
    store_id: Optional[str] = None,
    page: int = Query(1),
    per_page: int = Query(20),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List orders"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_orders(page=page, per_page=per_page, status=status, search=search)

        orders = response.get("orders", [])

        # Normalize response
        normalized = []
        for order in orders:
            normalized.append({
                "id": str(order.get("id", "")),
                "order_number": str(order.get("number", order.get("id", ""))),
                "external_id": order.get("id", 0),
                "status": order.get("status", ""),
                "total": float(order.get("total", 0)),
                "currency": order.get("currency", "INR"),
                "customer_id": order.get("customer_id"),
                "customer_name": order.get("billing", {}).get("first_name", ""),
                "customer_email": order.get("billing", {}).get("email", ""),
                "payment_method": order.get("payment_method", ""),
                "created_at": order.get("date_created", datetime.now().isoformat()),
            })

        return {
            "orders": normalized,
            "total": response.get("total", len(orders)),
            "page": page,
            "per_page": per_page,
            "total_pages": (response.get("total", len(orders)) + per_page - 1) // per_page,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get order details"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        order = await connector.get_order(order_id)

        if not order:
            raise Exception("Order not found")

        # Normalize
        line_items = []
        for item in order.get("line_items", []):
            line_items.append({
                "product_id": item.get("product_id"),
                "quantity": item.get("quantity"),
                "price": float(item.get("price", 0)),
                "name": item.get("name", ""),
            })

        return {
            "id": str(order.get("id", "")),
            "order_number": str(order.get("number", order.get("id", ""))),
            "external_id": order.get("id", 0),
            "status": order.get("status", ""),
            "total": float(order.get("total", 0)),
            "currency": order.get("currency", "INR"),
            "customer_id": order.get("customer_id"),
            "customer_name": order.get("billing", {}).get("first_name", ""),
            "customer_email": order.get("billing", {}).get("email", ""),
            "payment_method": order.get("payment_method", ""),
            "billing_address": order.get("billing", {}),
            "shipping_address": order.get("shipping", {}),
            "line_items": line_items,
            "created_at": order.get("date_created", datetime.now().isoformat()),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Products =====

@router.get("/products")
async def list_products(
    store_id: Optional[str] = None,
    page: int = Query(1),
    per_page: int = Query(20),
    stock_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List products"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_products(
            page=page, per_page=per_page, stock_status=stock_status, search=search
        )

        products = response.get("products", [])

        normalized = []
        for product in products:
            normalized.append({
                "id": str(product.get("id", "")),
                "external_id": product.get("id", 0),
                "name": product.get("name", ""),
                "sku": product.get("sku", ""),
                "description": product.get("description", ""),
                "price": float(product.get("price", 0)),
                "stock_quantity": product.get("stock_quantity", 0),
                "stock_status": product.get("stock_status", ""),
                "status": product.get("status", ""),
                "categories": product.get("categories", []),
                "created_at": product.get("date_created", datetime.now().isoformat()),
            })

        return {
            "products": normalized,
            "total": response.get("total", len(products)),
            "page": page,
            "per_page": per_page,
            "total_pages": (response.get("total", len(products)) + per_page - 1) // per_page,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products/{product_id}")
async def get_product(
    product_id: int,
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get product details"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        product = await connector.get_product(product_id)

        if not product:
            raise Exception("Product not found")

        return {
            "id": str(product.get("id", "")),
            "external_id": product.get("id", 0),
            "name": product.get("name", ""),
            "sku": product.get("sku", ""),
            "description": product.get("description", ""),
            "price": float(product.get("price", 0)),
            "stock_quantity": product.get("stock_quantity", 0),
            "stock_status": product.get("stock_status", ""),
            "status": product.get("status", ""),
            "categories": product.get("categories", []),
            "images": product.get("images", []),
            "created_at": product.get("date_created", datetime.now().isoformat()),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Inventory =====

@router.get("/inventory")
async def get_inventory(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get inventory insights"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_products(per_page=200)

        products = response.get("products", [])

        low_stock_threshold = 10

        healthy = []
        low_stock = []
        out_of_stock = []

        for product in products:
            normalized = {
                "id": str(product.get("id", "")),
                "external_id": product.get("id", 0),
                "name": product.get("name", ""),
                "sku": product.get("sku", ""),
                "price": float(product.get("price", 0)),
                "stock_quantity": product.get("stock_quantity", 0),
                "stock_status": product.get("stock_status", ""),
            }

            stock_qty = product.get("stock_quantity", 0)

            if stock_qty == 0:
                out_of_stock.append(normalized)
            elif stock_qty < low_stock_threshold:
                low_stock.append(normalized)
            else:
                healthy.append(normalized)

        return {
            "summary": {
                "total_products": len(products),
                "healthy_stock": len(healthy),
                "low_stock": len(low_stock),
                "out_of_stock": len(out_of_stock),
            },
            "by_status": {
                "healthy": healthy,
                "low_stock": low_stock,
                "out_of_stock": out_of_stock,
            },
            "low_stock_threshold": low_stock_threshold,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Customers =====

@router.get("/customers")
async def list_customers(
    store_id: Optional[str] = None,
    page: int = Query(1),
    per_page: int = Query(20),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List customers"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_customers(page=page, per_page=per_page, search=search)

        customers = response.get("customers", [])

        normalized = []
        for customer in customers:
            normalized.append({
                "id": str(customer.get("id", "")),
                "external_id": customer.get("id", 0),
                "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                "email": customer.get("email", ""),
                "phone": customer.get("phone", ""),
                "address": customer.get("billing", {}),
                "total_spent": float(customer.get("total_spent", 0)),
                "order_count": customer.get("orders_count", 0),
                "created_at": customer.get("date_created", datetime.now().isoformat()),
            })

        return {
            "customers": normalized,
            "total": response.get("total", len(customers)),
            "page": page,
            "per_page": per_page,
            "total_pages": (response.get("total", len(customers)) + per_page - 1) // per_page,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: int,
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get customer details"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        connector = ConnectorService.get_connector(db, store_id)
        customer = await connector.get_customer(customer_id)

        if not customer:
            raise Exception("Customer not found")

        return {
            "id": str(customer.get("id", "")),
            "external_id": customer.get("id", 0),
            "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
            "email": customer.get("email", ""),
            "phone": customer.get("phone", ""),
            "address": customer.get("billing", {}),
            "total_spent": float(customer.get("total_spent", 0)),
            "order_count": customer.get("orders_count", 0),
            "created_at": customer.get("date_created", datetime.now().isoformat()),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Agent =====

@router.post("/agent/query")
async def agent_query(
    query_obj: AgentQuery,
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Process an agent query"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"error": "No store connected"}
            store_id = str(stores[0].id)

        result = await AgentService.process_query(db, store_id, query_obj.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/agent/executions")
async def agent_executions(
    store_id: Optional[str] = None,
    limit: int = Query(10),
    db: Session = Depends(get_db),
):
    """Get agent execution history"""
    try:
        if not store_id:
            merchant = StoreService.get_or_create_merchant(db)
            stores = StoreService.get_stores(db, str(merchant.id))
            if not stores:
                return {"executions": []}
            store_id = str(stores[0].id)

        executions = db.query(AgentExecution).filter(
            AgentExecution.store_id == store_id
        ).order_by(AgentExecution.created_at.desc()).limit(limit).all()

        result = []
        for exe in executions:
            result.append({
                "id": str(exe.id),
                "query": exe.query,
                "status": exe.status,
                "duration_ms": exe.duration_ms,
                "created_at": exe.created_at,
            })

        return {"executions": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

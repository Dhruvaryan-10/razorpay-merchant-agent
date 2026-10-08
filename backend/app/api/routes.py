from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import AgentExecution
from app.schemas import AgentQuery, ConnectionCreate
from app.services import StoreService, ConnectorService, AgentService
from app.services.metrics_service import build_dashboard, fetch_all, format_inr, DEFAULT_PERIOD
from app.services.normalize import normalize_customer, normalize_order, normalize_product
from app.services.stock import LOW_STOCK_THRESHOLD, classify_stock
from app.connectors import WooCommerceConnector

router = APIRouter(prefix="/api", tags=["merchant"])

# Accepted values for the products stock filter, mapped to stock levels.
# "lowstock"/"instock"/"outofstock" are kept for existing callers.
STOCK_FILTERS = {
    "low": "low", "lowstock": "low",
    "out": "out", "outofstock": "out",
    "healthy": "healthy", "instock": "healthy",
}


def _store_payload(store) -> dict:
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


def _resolve_store_id(db: Session, store_id: Optional[str]) -> Optional[str]:
    """Use the requested store, falling back to the merchant's first store."""
    if store_id:
        return store_id
    merchant = StoreService.get_or_create_merchant(db)
    stores = StoreService.get_stores(db, str(merchant.id))
    return str(stores[0].id) if stores else None


def _page(total: int, page: int, per_page: int) -> dict:
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


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
    credentials: ConnectionCreate,
    db: Session = Depends(get_db),
):
    """Connect a real WooCommerce store.

    Credentials arrive in the JSON body only, never the query string, so the
    consumer secret stays out of URLs, proxies and access logs.
    """
    try:
        store_url = credentials.store_url.strip()
        consumer_key = credentials.consumer_key.strip()
        consumer_secret = credentials.consumer_secret.strip()

        if not store_url or not consumer_key or not consumer_secret:
            raise Exception("Missing required fields")

        connector = WooCommerceConnector(
            store_url=store_url,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
        )

        if not await connector.verify_connection():
            raise Exception("Could not connect to WooCommerce. Check your credentials.")

        store_info = await connector.get_store_info()
        store_name = store_info.get("name", "WooCommerce Store")

        merchant = StoreService.get_or_create_merchant(db)

        store = StoreService.create_live_store(
            db=db,
            merchant_id=str(merchant.id),
            store_url=store_url,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            name=store_name,
        )

        return {
            "store_id": str(store.id),
            "name": store_name,
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
        return {"stores": [_store_payload(store) for store in stores]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stores/{store_id}")
async def get_store(store_id: str, db: Session = Depends(get_db)):
    """Get store details"""
    try:
        store = StoreService.get_store(db, store_id)
        if not store:
            raise Exception("Store not found")
        return _store_payload(store)
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
async def get_dashboard(
    store_id: Optional[str] = None,
    period: str = Query(DEFAULT_PERIOD),
    db: Session = Depends(get_db),
):
    """Dashboard figures for a period (today, 7d, 30d, 90d).

    Revenue counts paid orders only (processing, on-hold, completed); pending,
    cancelled, failed and refunded orders are reported separately.
    """
    try:
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        store = StoreService.get_store(db, store_id)
        if not store:
            raise Exception("Store not found")

        connector = ConnectorService.get_connector(db, store_id)

        orders, orders_truncated = await fetch_all(connector.list_orders, "orders")
        products, products_truncated = await fetch_all(connector.list_products, "products")
        customers_response = await connector.list_customers(per_page=1)

        data = build_dashboard(orders, products, period)
        current = data["period"]["current"]
        pending = data["pending"]

        insights = [
            f"{data['low_count']} products below the stock threshold of {LOW_STOCK_THRESHOLD}"
            if data["low_count"] else None,
            f"{format_inr(pending['value'])} tied up in {pending['count']} pending orders"
            if pending["count"] else None,
            f"{data['out_count']} products out of stock" if data["out_count"] else None,
        ]

        return {
            "store": {
                "id": str(store.id),
                "name": store.name,
                "mode": store.mode,
                "status": store.status,
            },
            "metrics": {
                "total_revenue": current["net_revenue"],
                "total_orders": current["orders"],
                "pending_orders": pending["count"],
                "pending_value": pending["value"],
                "low_stock_count": data["low_count"],
                "out_of_stock_count": data["out_count"],
                "total_products": len(products),
                "total_customers": customers_response.get("total", 0),
            },
            "period": data["period"],
            "pending": pending,
            "inventory": data["inventory"],
            "coverage": {
                "orders_scanned": len(orders),
                "orders_truncated": orders_truncated,
                "products_truncated": products_truncated,
            },
            "recent_orders": data["recent_orders"],
            "insights": [i for i in insights if i],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Orders =====

@router.get("/orders")
async def list_orders(
    store_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List orders"""
    try:
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_orders(
            page=page, per_page=per_page, status=status, search=search, customer_id=customer_id
        )
        orders = response.get("orders", [])

        return {
            "orders": [normalize_order(order) for order in orders],
            **_page(response.get("total", len(orders)), page, per_page),
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
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        order = await connector.get_order(order_id)

        if not order:
            raise Exception("Order not found")

        return normalize_order(order, detail=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Products =====

@router.get("/products")
async def list_products(
    store_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    stock_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List products.

    stock_status filters by the shared stock definition (low, out, healthy)
    rather than WooCommerce's own flag, which has no "low" state.
    """
    try:
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        level = STOCK_FILTERS.get(stock_status or "")

        if level:
            products, _ = await fetch_all(connector.list_products, "products", search=search)
            matching = [p for p in products if classify_stock(p) == level]
            start = (page - 1) * per_page
            return {
                "products": [normalize_product(p) for p in matching[start:start + per_page]],
                **_page(len(matching), page, per_page),
            }

        response = await connector.list_products(page=page, per_page=per_page, search=search)
        products = response.get("products", [])

        return {
            "products": [normalize_product(p) for p in products],
            **_page(response.get("total", len(products)), page, per_page),
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
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        product = await connector.get_product(product_id)

        if not product:
            raise Exception("Product not found")

        return normalize_product(product, detail=True)
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
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        products, truncated = await fetch_all(connector.list_products, "products")

        buckets = {"healthy": [], "low": [], "out": [], "untracked": []}
        for product in products:
            normalized = normalize_product(product)
            buckets[normalized["stock_level"]].append(normalized)

        return {
            "summary": {
                "total_products": len(products),
                "healthy_stock": len(buckets["healthy"]),
                "low_stock": len(buckets["low"]),
                "out_of_stock": len(buckets["out"]),
                "untracked": len(buckets["untracked"]),
            },
            "by_status": {
                "healthy": buckets["healthy"],
                "low_stock": buckets["low"],
                "out_of_stock": buckets["out"],
                "untracked": buckets["untracked"],
            },
            "low_stock_threshold": LOW_STOCK_THRESHOLD,
            "truncated": truncated,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== Customers =====

@router.get("/customers")
async def list_customers(
    store_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List customers"""
    try:
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        response = await connector.list_customers(page=page, per_page=per_page, search=search)
        customers = response.get("customers", [])

        return {
            "customers": [normalize_customer(c) for c in customers],
            **_page(response.get("total", len(customers)), page, per_page),
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
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        connector = ConnectorService.get_connector(db, store_id)
        customer = await connector.get_customer(customer_id)

        if not customer:
            raise Exception("Customer not found")

        return normalize_customer(customer)
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
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"error": "No store connected"}

        return await AgentService.process_query(db, store_id, query_obj.query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/agent/executions")
async def agent_executions(
    store_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get agent execution history"""
    try:
        store_id = _resolve_store_id(db, store_id)
        if not store_id:
            return {"executions": []}

        store = StoreService.get_store(db, store_id)
        if not store:
            raise Exception("Store not found")

        executions = db.query(AgentExecution).filter(
            AgentExecution.store_id == store.id
        ).order_by(AgentExecution.created_at.desc()).limit(limit).all()

        return {"executions": [
            {
                "id": str(exe.id),
                "query": exe.query,
                "status": exe.status,
                "duration_ms": exe.duration_ms,
                "created_at": exe.created_at,
            }
            for exe in executions
        ]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

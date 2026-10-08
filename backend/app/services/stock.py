"""Single source of truth for stock levels and order-revenue rules.

Every surface (dashboard, products, inventory, agent) classifies stock and
counts revenue through these helpers so the numbers always agree.
"""
from typing import Any, Dict, Optional

LOW_STOCK_THRESHOLD = 10

# WooCommerce statuses that represent money actually received.
# pending = awaiting payment, so it is reported separately, not as revenue.
REVENUE_STATUSES = {"processing", "on-hold", "completed"}

STOCK_HEALTHY = "healthy"
STOCK_LOW = "low"
STOCK_OUT = "out"
STOCK_UNTRACKED = "untracked"


def _quantity(product: Dict[str, Any]) -> Optional[int]:
    qty = product.get("stock_quantity")
    if qty is None:
        return None
    try:
        return int(qty)
    except (TypeError, ValueError):
        return None


def classify_stock(product: Dict[str, Any], threshold: int = LOW_STOCK_THRESHOLD) -> str:
    """Classify a raw connector product into healthy / low / out / untracked.

    out:       WooCommerce says outofstock, or a tracked quantity is <= 0
    low:       tracked quantity is above 0 and below the threshold
    healthy:   tracked quantity at or above the threshold
    untracked: stock is not managed (no quantity) and not marked out of stock
    """
    qty = _quantity(product)
    if product.get("stock_status") == "outofstock" or (qty is not None and qty <= 0):
        return STOCK_OUT
    if qty is None:
        return STOCK_UNTRACKED
    if qty < threshold:
        return STOCK_LOW
    return STOCK_HEALTHY


def order_total(order: Dict[str, Any]) -> float:
    try:
        return float(order.get("total", 0) or 0)
    except (TypeError, ValueError):
        return 0.0


def counts_as_revenue(order: Dict[str, Any]) -> bool:
    return order.get("status") in REVENUE_STATUSES

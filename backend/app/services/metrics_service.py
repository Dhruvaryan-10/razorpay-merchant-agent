"""Dashboard aggregates computed from real connector data.

Revenue rules live in stock.py: only paid statuses (processing, on-hold,
completed) count as revenue. Every figure carries the window it covers.
"""
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from .normalize import normalize_order
from .stock import (
    LOW_STOCK_THRESHOLD, STOCK_LOW, STOCK_OUT,
    classify_stock, counts_as_revenue, order_total,
)

PERIODS = {"today": 1, "7d": 7, "30d": 30, "90d": 90}
DEFAULT_PERIOD = "30d"

# Bounds how much history one dashboard request scans (10 x 100 records).
MAX_PAGES = 10
PAGE_SIZE = 100


async def fetch_all(
    fetch: Callable[..., Awaitable[Dict[str, Any]]], key: str, **filters: Any
) -> Tuple[List[Dict[str, Any]], bool]:
    """Page through a connector list call. Returns (records, truncated)."""
    records: List[Dict[str, Any]] = []
    for page in range(1, MAX_PAGES + 1):
        response = await fetch(page=page, per_page=PAGE_SIZE, **filters)
        batch = response.get(key, [])
        records.extend(batch)
        total = response.get("total", len(records))
        if len(batch) < PAGE_SIZE or len(records) >= total:
            return records, False
    return records, True


def _order_time(order: Dict[str, Any]) -> Optional[datetime]:
    raw = order.get("date_created")
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.replace(tzinfo=None)


def _window(period: str, now: datetime) -> Tuple[datetime, datetime, timedelta]:
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now, timedelta(days=1)
    span = timedelta(days=PERIODS[period])
    return now - span, now, span


def _summarise(orders: List[Dict[str, Any]]) -> Dict[str, Any]:
    paid = [o for o in orders if counts_as_revenue(o)]
    revenue = sum(order_total(o) for o in paid)
    items = sum(
        int(i.get("quantity", 0) or 0) for o in paid for i in (o.get("line_items") or [])
    )
    return {
        "net_revenue": revenue,
        "orders": len(orders),
        "paid_orders": len(paid),
        "average_order": revenue / len(paid) if paid else 0,
        "items_sold": items,
        "unique_buyers": len({o.get("customer_id") for o in orders if o.get("customer_id")}),
    }


def _series(
    current: List[Tuple[datetime, Dict[str, Any]]],
    previous: List[Tuple[datetime, Dict[str, Any]]],
    start: datetime, end: datetime, shift: timedelta, hourly: bool,
) -> List[Dict[str, Any]]:
    step = timedelta(hours=1) if hourly else timedelta(days=1)
    origin = start.replace(minute=0, second=0, microsecond=0) if hourly else \
        start.replace(hour=0, minute=0, second=0, microsecond=0)
    buckets: List[Dict[str, Any]] = []
    cursor = origin
    while cursor <= end:
        buckets.append({"start": cursor.isoformat(), "revenue": 0.0, "orders": 0, "prev_revenue": 0.0})
        cursor += step

    def place(rows, field, offset):
        for when, order in rows:
            index = int(((when + offset) - origin) / step)
            if 0 <= index < len(buckets):
                if field == "revenue":
                    buckets[index]["orders"] += 1
                if counts_as_revenue(order):
                    buckets[index][field] += order_total(order)

    place(current, "revenue", timedelta(0))
    place(previous, "prev_revenue", shift)
    return buckets


def build_dashboard(
    orders: List[Dict[str, Any]],
    products: List[Dict[str, Any]],
    period: str,
    now: Optional[datetime] = None,
) -> Dict[str, Any]:
    now = now or datetime.now()
    period = period if period in PERIODS else DEFAULT_PERIOD
    start, end, shift = _window(period, now)

    dated = [(t, o) for o in orders if (t := _order_time(o)) is not None]
    current = [(t, o) for t, o in dated if start <= t <= end]
    previous = [(t, o) for t, o in dated if start - shift <= t < end - shift]

    cur = _summarise([o for _, o in current])
    prev = _summarise([o for _, o in previous])

    breakdown: Dict[str, Dict[str, Any]] = {}
    for _, order in current:
        entry = breakdown.setdefault(order.get("status", ""), {"count": 0, "value": 0.0})
        entry["count"] += 1
        entry["value"] += order_total(order)

    # Open work is not period-bound: a pending order from last month still needs action.
    pending = sorted(
        [(t, o) for t, o in dated if o.get("status") == "pending"], key=lambda r: r[0]
    )
    pending_value = sum(order_total(o) for _, o in pending)

    # Units of each product sitting in pending orders: demand that stock must cover.
    pending_demand: Dict[Any, Dict[str, int]] = {}
    for _, order in pending:
        for item in order.get("line_items") or []:
            entry = pending_demand.setdefault(item.get("product_id"), {"units": 0, "orders": 0})
            entry["units"] += int(item.get("quantity", 0) or 0)
            entry["orders"] += 1

    levels = [(classify_stock(p), p) for p in products]
    at_risk = []
    for level, product in levels:
        if level not in (STOCK_LOW, STOCK_OUT):
            continue
        demand = pending_demand.get(product.get("id"), {"units": 0, "orders": 0})
        at_risk.append({
            "id": str(product.get("id", "")),
            "name": product.get("name", ""),
            "sku": product.get("sku", ""),
            "price": float(product.get("price", 0) or 0),
            "stock_quantity": product.get("stock_quantity"),
            "stock_level": level,
            "pending_units": demand["units"],
            "pending_orders": demand["orders"],
        })
    # Out of stock first, then by unmet demand, then by how far below threshold.
    at_risk.sort(key=lambda r: (
        r["stock_level"] != STOCK_OUT, -r["pending_units"], r["stock_quantity"] or 0,
    ))

    low_count = sum(1 for level, _ in levels if level == STOCK_LOW)
    out_count = sum(1 for level, _ in levels if level == STOCK_OUT)
    recent = sorted(dated, key=lambda r: r[0], reverse=True)[:6]

    return {
        "period": {
            "key": period,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "current": cur,
            "previous": prev,
            "status_breakdown": [
                {"status": status, **values} for status, values in breakdown.items()
            ],
            "series": _series(current, previous, start, end, shift, hourly=period == "today"),
        },
        "pending": {
            "count": len(pending),
            "value": pending_value,
            "oldest": normalize_order(pending[0][1]) if pending else None,
        },
        "inventory": {
            "threshold": LOW_STOCK_THRESHOLD,
            "total": len(products),
            "low": low_count,
            "out": out_count,
            "at_risk": at_risk[:8],
        },
        "recent_orders": [normalize_order(o) for _, o in recent],
        "low_count": low_count,
        "out_count": out_count,
    }


def format_inr(amount: float) -> str:
    """₹ with Indian digit grouping: 4821000 -> ₹48,21,000"""
    whole = str(int(round(amount)))
    if len(whole) <= 3:
        return f"₹{whole}"
    head, tail = whole[:-3], whole[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return "₹" + ",".join(groups + [tail])

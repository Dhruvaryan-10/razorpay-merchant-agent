"""Normalise raw connector records into the shapes the API returns."""
from typing import Any, Dict, Optional

from .stock import classify_stock, LOW_STOCK_THRESHOLD


def _full_name(person: Dict[str, Any]) -> str:
    return f"{person.get('first_name', '') or ''} {person.get('last_name', '') or ''}".strip()


def _created(record: Dict[str, Any]) -> Optional[str]:
    """The record's creation date, or None when the source doesn't provide one."""
    return record.get("date_created") or None


def normalize_line_item(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "product_id": item.get("product_id"),
        "sku": item.get("sku") or "",
        "quantity": item.get("quantity"),
        "price": float(item.get("price", 0) or 0),
        "total": float(item.get("total", 0) or 0),
        "name": item.get("name", ""),
    }


def normalize_order(order: Dict[str, Any], detail: bool = False) -> Dict[str, Any]:
    billing = order.get("billing", {}) or {}
    line_items = order.get("line_items", []) or []
    result = {
        "id": str(order.get("id", "")),
        "order_number": str(order.get("number", order.get("id", ""))),
        "external_id": order.get("id", 0),
        "status": order.get("status", ""),
        "total": float(order.get("total", 0) or 0),
        "currency": order.get("currency", "INR"),
        "customer_id": order.get("customer_id"),
        "customer_name": _full_name(billing),
        "customer_email": billing.get("email", ""),
        "payment_method": order.get("payment_method", ""),
        "payment_method_title": order.get("payment_method_title") or "",
        "item_count": sum(int(i.get("quantity", 0) or 0) for i in line_items),
        "created_at": _created(order),
    }
    if detail:
        result["billing_address"] = billing
        result["shipping_address"] = order.get("shipping", {}) or {}
        result["line_items"] = [normalize_line_item(i) for i in line_items]
    return result


def normalize_product(
    product: Dict[str, Any], threshold: int = LOW_STOCK_THRESHOLD, detail: bool = False
) -> Dict[str, Any]:
    images = product.get("images", []) or []
    first_image = images[0].get("src") if images and isinstance(images[0], dict) else None
    result = {
        "id": str(product.get("id", "")),
        "external_id": product.get("id", 0),
        "name": product.get("name", ""),
        "sku": product.get("sku", ""),
        "description": product.get("description", ""),
        "price": float(product.get("price", 0) or 0),
        "stock_quantity": product.get("stock_quantity"),
        "stock_status": product.get("stock_status", ""),
        "stock_level": classify_stock(product, threshold),
        "status": product.get("status", ""),
        "categories": product.get("categories", []),
        "image": first_image,
        "permalink": product.get("permalink"),
        "created_at": _created(product),
    }
    if detail:
        result["images"] = images
    return result


def normalize_customer(customer: Dict[str, Any]) -> Dict[str, Any]:
    billing = customer.get("billing", {}) or {}
    return {
        "id": str(customer.get("id", "")),
        "external_id": customer.get("id", 0),
        "name": _full_name(customer) or _full_name(billing),
        "email": customer.get("email", ""),
        "phone": customer.get("phone") or billing.get("phone", ""),
        "address": billing,
        "total_spent": float(customer.get("total_spent", 0) or 0),
        "order_count": customer.get("orders_count", 0),
        "created_at": _created(customer),
    }

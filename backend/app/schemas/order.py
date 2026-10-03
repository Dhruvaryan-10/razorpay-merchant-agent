from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class LineItem(BaseModel):
    product_id: int
    quantity: int
    price: float
    name: str


class OrderResponse(BaseModel):
    id: str
    order_number: str
    external_id: int
    status: str
    total: float
    currency: str
    customer_id: Optional[str]
    customer_name: Optional[str]
    customer_email: Optional[str]
    payment_method: Optional[str]
    line_items: Optional[List[LineItem]]
    billing_address: Optional[dict]
    shipping_address: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

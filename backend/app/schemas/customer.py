from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CustomerResponse(BaseModel):
    id: str
    external_id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[dict]
    total_spent: float
    order_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

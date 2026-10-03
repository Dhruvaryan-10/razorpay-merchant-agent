from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ProductResponse(BaseModel):
    id: str
    external_id: int
    name: str
    sku: Optional[str]
    description: Optional[str]
    price: float
    stock_quantity: int
    stock_status: str
    status: str
    categories: Optional[list]
    images: Optional[list]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

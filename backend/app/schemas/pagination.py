from pydantic import BaseModel
from typing import TypeVar, Generic, List, Any

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int

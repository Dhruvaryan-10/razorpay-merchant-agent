from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional
from enum import Enum


class StoreMode(str, Enum):
    live = "live"
    demo = "demo"


class StoreStatus(str, Enum):
    connected = "connected"
    disconnected = "disconnected"
    error = "error"


class StoreCreate(BaseModel):
    store_url: Optional[str] = None
    consumer_key: Optional[str] = None
    consumer_secret: Optional[str] = None


class StoreResponse(BaseModel):
    id: str
    name: str
    store_url: Optional[str]
    provider: str
    mode: str
    status: str
    last_synced_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

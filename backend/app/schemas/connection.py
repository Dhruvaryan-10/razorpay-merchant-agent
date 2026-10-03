from pydantic import BaseModel
from typing import Optional


class ConnectionCreate(BaseModel):
    store_url: str
    consumer_key: str
    consumer_secret: str


class ConnectionResponse(BaseModel):
    id: str
    consumer_key: str
    created_at: str

    class Config:
        from_attributes = True

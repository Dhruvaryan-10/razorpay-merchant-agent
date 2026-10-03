from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    external_id = Column(Integer, nullable=False)  # WooCommerce product ID
    name = Column(String(500), nullable=False)
    sku = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    stock_status = Column(String(50), default="instock")  # instock, outofstock, onbackorder
    status = Column(String(50), default="publish")
    categories = Column(JSON, nullable=True)
    images = Column(JSON, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="products")

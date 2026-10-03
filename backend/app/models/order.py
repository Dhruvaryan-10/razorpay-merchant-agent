from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    external_id = Column(Integer, nullable=False)  # WooCommerce order ID
    order_number = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")
    currency = Column(String(10), default="INR")
    total = Column(Float, default=0.0)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    payment_method = Column(String(100), nullable=True)
    billing_address = Column(JSON, nullable=True)
    shipping_address = Column(JSON, nullable=True)
    line_items = Column(JSON, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")

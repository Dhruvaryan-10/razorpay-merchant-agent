from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    store_url = Column(String(500), nullable=True)
    provider = Column(String(50), default="woocommerce")  # woocommerce
    mode = Column(String(20), default="demo")  # live, demo
    status = Column(String(20), default="connected")  # connected, disconnected, error
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="stores")
    connection = relationship("WooCommerceConnection", back_populates="store", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="store", cascade="all, delete-orphan")
    sync_runs = relationship("SyncRun", back_populates="store", cascade="all, delete-orphan")
    agent_executions = relationship("AgentExecution", back_populates="store", cascade="all, delete-orphan")

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="staff")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="storage")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    unit_of_measure: Mapped[str] = mapped_column(String(50), nullable=False, default="pcs")
    reorder_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("product_id", "location_id", name="uq_inventory_product_location"),)


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supplier_id: Mapped[Optional[int]] = mapped_column(ForeignKey("suppliers.id"), nullable=True)
    destination_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    expected_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    received_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class DeliveryItem(Base):
    __tablename__ = "delivery_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    delivery_id: Mapped[int] = mapped_column(ForeignKey("deliveries.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    destination_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class TransferItem(Base):
    __tablename__ = "transfer_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    transfer_id: Mapped[int] = mapped_column(ForeignKey("transfers.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)


class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    recorded_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    physical_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    difference: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    source_location_id: Mapped[Optional[int]] = mapped_column(ForeignKey("locations.id"), nullable=True)
    destination_location_id: Mapped[Optional[int]] = mapped_column(ForeignKey("locations.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False)
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    previous_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    updated_stock: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    pinned: Mapped[bool] = mapped_column(default=False)
    reference_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

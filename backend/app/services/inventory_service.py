from __future__ import annotations

from datetime import datetime

from sqlalchemy import func

from app.db import SessionLocal
from app.models import Inventory, Product, Location, StockLedger


def get_inventory_summary():
    session = SessionLocal()
    try:
        rows = session.query(
            Inventory,
            Product.name.label("product_name"),
            Product.sku,
            Location.name.label("location_name"),
        ).join(Product, Product.id == Inventory.product_id).join(Location, Location.id == Inventory.location_id).all()
        return [
            {
                "id": inv.id,
                "product_id": inv.product_id,
                "product_name": product_name,
                "sku": sku,
                "location_id": inv.location_id,
                "location_name": location_name,
                "quantity": inv.quantity,
                "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
            }
            for inv, product_name, sku, location_name in rows
        ]
    finally:
        session.close()


def get_total_stock(product_id: int) -> float:
    session = SessionLocal()
    try:
        total = session.query(func.coalesce(func.sum(Inventory.quantity), 0)).filter(Inventory.product_id == product_id).scalar() or 0
        return float(total)
    finally:
        session.close()


def ensure_inventory_row(session, product_id: int, location_id: int, quantity: float = 0):
    inv = session.query(Inventory).filter_by(product_id=product_id, location_id=location_id).first()
    if inv is None:
        inv = Inventory(product_id=product_id, location_id=location_id, quantity=0, updated_at=datetime.utcnow())
        session.add(inv)
    inv.quantity = float(inv.quantity) + float(quantity)
    inv.updated_at = datetime.utcnow()
    return inv


def write_ledger_entry(session, product_id: int, user_id: int, reference_type: str, reference_id: int, operation_type: str, quantity: float, previous_stock: float, updated_stock: float, source_location_id=None, destination_location_id=None):
    entry = StockLedger(
        product_id=product_id,
        source_location_id=source_location_id,
        destination_location_id=destination_location_id,
        user_id=user_id,
        reference_type=reference_type,
        reference_id=reference_id,
        operation_type=operation_type,
        quantity=float(quantity),
        previous_stock=float(previous_stock),
        updated_stock=float(updated_stock),
        created_at=datetime.utcnow(),
    )
    session.add(entry)
    return entry

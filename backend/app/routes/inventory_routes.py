from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import Inventory, Product, Location, Warehouse
from app.middleware.auth import jwt_required

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/inventory", methods=["GET"])
@jwt_required
def get_inventory():
    session = SessionLocal()
    try:
        query = session.query(
            Inventory,
            Product.name.label("product_name"),
            Product.sku.label("product_sku"),
            Product.reorder_threshold,
            Location.name.label("location_name"),
            Location.warehouse_id,
        ).join(Product, Product.id == Inventory.product_id).join(Location, Location.id == Inventory.location_id)

        product_id = request.args.get("product_id")
        location_id = request.args.get("location_id")
        warehouse_id = request.args.get("warehouse_id")
        search = request.args.get("search")
        if product_id:
            query = query.filter(Inventory.product_id == int(product_id))
        if location_id:
            query = query.filter(Inventory.location_id == int(location_id))
        if warehouse_id:
            query = query.filter(Location.warehouse_id == int(warehouse_id))
        if search:
            like = f"%{search}%"
            query = query.filter(Product.name.ilike(like) | Product.sku.ilike(like))

        rows = query.order_by(Inventory.product_id).all()
        return jsonify([
            {
                "id": inv.id,
                "product_id": inv.product_id,
                "product_name": product_name,
                "product_sku": product_sku,
                "location_id": inv.location_id,
                "location_name": location_name,
                "warehouse_id": warehouse_id_val,
                "quantity": float(inv.quantity),
                "reorder_threshold": float(reorder_threshold),
                "is_low_stock": float(inv.quantity) <= float(reorder_threshold),
                "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
            }
            for inv, product_name, product_sku, reorder_threshold, location_name, warehouse_id_val in rows
        ]), 200
    finally:
        session.close()

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import Product, Inventory, Location, Category
from app.middleware.auth import jwt_required, get_current_user

products_bp = Blueprint("products", __name__)


@products_bp.route("/products", methods=["GET"])
@jwt_required
def get_products():
    session = SessionLocal()
    try:
        query = session.query(Product)
        search = request.args.get("search")
        category_id = request.args.get("category_id")
        if search:
            like = f"%{search}%"
            query = query.filter((Product.name.ilike(like)) | (Product.sku.ilike(like)))
        if category_id:
            query = query.filter(Product.category_id == int(category_id))

        # Pagination
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        total = query.count()
        items = query.order_by(Product.id.desc()).offset((page - 1) * per_page).limit(per_page).all()

        return jsonify({
            "items": [{
                "id": item.id,
                "name": item.name,
                "sku": item.sku,
                "category_id": item.category_id,
                "unit_of_measure": item.unit_of_measure,
                "reorder_threshold": item.reorder_threshold,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            } for item in items],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": max(1, -(-total // per_page)),
        }), 200
    finally:
        session.close()


@products_bp.route("/products", methods=["POST"])
@jwt_required
def create_product():
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        name = (data.get("name") or "").strip()
        sku = (data.get("sku") or "").strip()
        if not name or not sku:
            return jsonify({"error": "Name and SKU are required"}), 400
        if session.query(Product).filter_by(sku=sku).first():
            return jsonify({"error": "SKU already exists"}), 409

        # Validate category exists if provided
        category_id = data.get("category_id")
        if category_id:
            category_id = int(category_id)
            if not session.query(Category).filter_by(id=category_id).first():
                return jsonify({"error": "Category not found"}), 400

        product = Product(
            category_id=category_id,
            name=name,
            sku=sku,
            unit_of_measure=data.get("unit_of_measure", "pcs"),
            reorder_threshold=float(data.get("reorder_threshold") or 0),
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        return jsonify({
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category_id": product.category_id,
            "unit_of_measure": product.unit_of_measure,
            "reorder_threshold": product.reorder_threshold,
        }), 201
    finally:
        session.close()


@products_bp.route("/products/<int:product_id>", methods=["GET"])
@jwt_required
def get_product(product_id):
    session = SessionLocal()
    try:
        item = session.query(Product).filter_by(id=product_id).first()
        if not item:
            return jsonify({"error": "Product not found"}), 404
        # Get total stock across all locations
        from sqlalchemy import func
        total_stock = session.query(func.coalesce(func.sum(Inventory.quantity), 0)).filter(Inventory.product_id == product_id).scalar() or 0
        # Get stock by location
        inventory_rows = session.query(
            Inventory, Location.name.label("location_name")
        ).join(Location, Location.id == Inventory.location_id).filter(Inventory.product_id == product_id).all()

        category_name = None
        if item.category_id:
            cat = session.query(Category).filter_by(id=item.category_id).first()
            if cat:
                category_name = cat.name

        return jsonify({
            "id": item.id,
            "name": item.name,
            "sku": item.sku,
            "category_id": item.category_id,
            "category_name": category_name,
            "unit_of_measure": item.unit_of_measure,
            "reorder_threshold": item.reorder_threshold,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "total_stock": float(total_stock),
            "inventory": [{
                "location_id": inv.location_id,
                "location_name": loc_name,
                "quantity": float(inv.quantity),
            } for inv, loc_name in inventory_rows],
        }), 200
    finally:
        session.close()


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@jwt_required
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        item = session.query(Product).filter_by(id=product_id).first()
        if not item:
            return jsonify({"error": "Product not found"}), 404
        if "name" in data:
            item.name = data["name"]
        if "sku" in data:
            new_sku = data["sku"].strip()
            existing = session.query(Product).filter(Product.sku == new_sku, Product.id != product_id).first()
            if existing:
                return jsonify({"error": "SKU already exists"}), 409
            item.sku = new_sku
        if "category_id" in data:
            item.category_id = data["category_id"]
        if "unit_of_measure" in data:
            item.unit_of_measure = data["unit_of_measure"]
        if "reorder_threshold" in data:
            item.reorder_threshold = float(data["reorder_threshold"])
        session.commit()
        return jsonify({
            "id": item.id,
            "name": item.name,
            "sku": item.sku,
            "category_id": item.category_id,
            "unit_of_measure": item.unit_of_measure,
            "reorder_threshold": item.reorder_threshold,
        }), 200
    finally:
        session.close()

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import Supplier
from app.middleware.auth import jwt_required, require_role

supplier_bp = Blueprint("suppliers", __name__)


@supplier_bp.route("/suppliers", methods=["GET"])
@jwt_required
def list_suppliers():
    session = SessionLocal()
    try:
        query = session.query(Supplier)
        search = request.args.get("search")
        if search:
            like = f"%{search}%"
            query = query.filter(Supplier.name.ilike(like) | Supplier.contact_email.ilike(like))
        rows = query.order_by(Supplier.id.desc()).all()
        return jsonify([{
            "id": s.id,
            "name": s.name,
            "contact_email": s.contact_email,
            "phone": s.phone,
        } for s in rows]), 200
    finally:
        session.close()


@supplier_bp.route("/suppliers", methods=["POST"])
@jwt_required
def create_supplier():
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Supplier name is required"}), 400
        supplier = Supplier(
            name=name,
            contact_email=data.get("contact_email"),
            phone=data.get("phone"),
        )
        session.add(supplier)
        session.commit()
        session.refresh(supplier)
        return jsonify({
            "id": supplier.id,
            "name": supplier.name,
            "contact_email": supplier.contact_email,
            "phone": supplier.phone,
        }), 201
    finally:
        session.close()

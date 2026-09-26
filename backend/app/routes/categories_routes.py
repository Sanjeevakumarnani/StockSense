from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import Category, Product
from app.middleware.auth import jwt_required, require_role

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET"])
@jwt_required
def get_categories():
    session = SessionLocal()
    try:
        categories = session.query(Category).order_by(Category.id.desc()).all()
        result = []
        for cat in categories:
            prod_count = session.query(Product).filter_by(category_id=cat.id).count()
            result.append({
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "product_count": prod_count
            })
        return jsonify(result), 200
    finally:
        session.close()


@categories_bp.route("/categories", methods=["POST"])
@jwt_required
@require_role("manager")
def create_category():
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Category name is required"}), 400
        if session.query(Category).filter_by(name=name).first():
            return jsonify({"error": "Category already exists"}), 409
        category = Category(name=name, description=data.get("description"))
        session.add(category)
        session.commit()
        session.refresh(category)
        return jsonify({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "product_count": 0
        }), 201
    finally:
        session.close()


@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
@jwt_required
@require_role("manager")
def update_category(category_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        cat = session.query(Category).filter_by(id=category_id).first()
        if not cat:
            return jsonify({"error": "Category not found"}), 404

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Category name is required"}), 400

        existing = session.query(Category).filter(Category.name == name, Category.id != category_id).first()
        if existing:
            return jsonify({"error": "Another category with this name already exists"}), 409

        cat.name = name
        cat.description = data.get("description")
        session.commit()
        session.refresh(cat)

        prod_count = session.query(Product).filter_by(category_id=cat.id).count()
        return jsonify({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "product_count": prod_count
        }), 200
    finally:
        session.close()


@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@jwt_required
@require_role("manager")
def delete_category(category_id):
    session = SessionLocal()
    try:
        cat = session.query(Category).filter_by(id=category_id).first()
        if not cat:
            return jsonify({"error": "Category not found"}), 404

        prod_count = session.query(Product).filter_by(category_id=category_id).count()
        if prod_count > 0:
            return jsonify({"error": f"Cannot delete category '{cat.name}': {prod_count} product(s) are assigned to it. Reassign or delete the products first."}), 400

        session.delete(cat)
        session.commit()
        return jsonify({"message": f"Category '{cat.name}' deleted successfully"}), 200
    finally:
        session.close()

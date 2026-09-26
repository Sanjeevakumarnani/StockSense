from __future__ import annotations

import re
from flask import Blueprint, jsonify, request
from app.db import SessionLocal
from app.models import User
from app.middleware.auth import jwt_required, get_current_user
from app.services.auth_service import hash_password

user_bp = Blueprint("users", __name__)

EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


@user_bp.route("/users/me", methods=["GET"])
@jwt_required
def get_current_user_profile():
    curr_user = get_current_user()
    if not curr_user:
        return jsonify({"error": "Authentication required"}), 401
    return jsonify({
        "user": {
            "id": curr_user["id"],
            "name": curr_user["name"],
            "email": curr_user["email"],
            "role": curr_user["role"]
        }
    }), 200


@user_bp.route("/users/me", methods=["PUT"])
@jwt_required
def update_current_user_profile():
    curr_user = get_current_user()
    if not curr_user:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not name:
        return jsonify({"error": "Full name is required"}), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Please provide a valid email address"}), 400

    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=curr_user["id"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if email != user.email:
            existing = session.query(User).filter(User.email == email, User.id != user.id).first()
            if existing:
                return jsonify({"error": "Email address is already in use by another user"}), 409

        user.name = name
        user.email = email
        session.commit()
        session.refresh(user)

        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }), 200
    finally:
        session.close()


@user_bp.route("/users/me/password", methods=["PUT"])
@jwt_required
def update_current_user_password():
    curr_user = get_current_user()
    if not curr_user:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password:
        return jsonify({"error": "Current password is required"}), 400

    if not new_password or len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long"}), 400

    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=curr_user["id"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.password_hash != hash_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 400

        user.password_hash = hash_password(new_password)
        session.commit()

        return jsonify({"message": "Password updated successfully"}), 200
    finally:
        session.close()

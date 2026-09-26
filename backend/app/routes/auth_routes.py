from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import User
from app.services.auth_service import generate_token, login, request_otp, signup, verify_otp_and_reset

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup_route():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password", "")
    role = data.get("role", "staff")
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if role not in ("manager", "staff"):
        return jsonify({"error": "Role must be 'manager' or 'staff'"}), 400
    try:
        user = signup(name, email, password, role)
        return jsonify({"user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}, "token": generate_token(user)}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@auth_bp.route("/login", methods=["POST"])
def login_route():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    try:
        user = login(email, password)
        return jsonify({"user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}, "token": generate_token(user)}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout_route():
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/otp/request", methods=["POST"])
def otp_request_route():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400
    code = request_otp(email)
    return jsonify({"message": "OTP generated", "otp": code}), 200


@auth_bp.route("/otp/verify", methods=["POST"])
def otp_verify_route():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password", "")
    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP, and new password are required"}), 400
    try:
        verify_otp_and_reset(email, otp, new_password)
        return jsonify({"message": "Password updated successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@auth_bp.route("/me", methods=["GET"])
def me_route():
    """Return the current user from the JWT token."""
    from app.middleware.auth import _decode_token
    payload = _decode_token()
    if payload is None:
        return jsonify({"error": "Authentication required"}), 401
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=payload.get("user_id")).first()
        if not user:
            return jsonify({"error": "User not found"}), 401
        return jsonify({"user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}), 200
    finally:
        session.close()

from __future__ import annotations

from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from app.db import SessionLocal
from app.models import User


def _decode_token():
    """Extract and decode the JWT from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    """Return the current user dict stored in flask.g, or None."""
    return getattr(g, "current_user", None)


def jwt_required(f):
    """Decorator that enforces a valid JWT token on the request."""
    @wraps(f)
    def decorated(*args, **kwargs):
        payload = _decode_token()
        if payload is None:
            return jsonify({"error": "Authentication required"}), 401
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(id=payload.get("user_id")).first()
            if not user:
                return jsonify({"error": "User not found"}), 401
            g.current_user = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        finally:
            session.close()
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator that enforces the current user has one of the specified roles.
    Must be used AFTER @jwt_required."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if user["role"] not in roles:
                return jsonify({"error": "Forbidden — insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

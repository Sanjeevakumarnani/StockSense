from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from .config.settings import settings
from .db import SessionLocal, engine


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(settings)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from .models import Base as ModelBase
    from .routes import register_routes

    ModelBase.metadata.create_all(bind=engine)
    register_routes(app)

    # Seed demo user so the pre-filled credentials work on first run
    from .models import User
    from .services.auth_service import hash_password
    session = SessionLocal()
    try:
        if not session.query(User).filter_by(email="manager@example.com").first():
            demo = User(
                name="Demo Manager",
                email="manager@example.com",
                password_hash=hash_password("password123"),
                role="manager",
            )
            session.add(demo)
            session.commit()
    finally:
        session.close()

    return app

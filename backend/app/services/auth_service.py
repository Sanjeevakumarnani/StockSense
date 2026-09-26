from __future__ import annotations

import hashlib
from datetime import datetime, timedelta

import jwt
from flask import current_app

from app.db import SessionLocal
from app.models import User

OTP_STORE = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def generate_token(user: User):
    payload = {"user_id": user.id, "role": user.role, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def signup(name: str, email: str, password: str, role: str):
    session = SessionLocal()
    try:
        existing = session.query(User).filter_by(email=email.lower()).first()
        if existing:
            raise ValueError("User already exists")
        user = User(name=name, email=email.lower(), password_hash=hash_password(password), role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    finally:
        session.close()


def login(email: str, password: str):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=email.lower()).first()
        if not user or user.password_hash != hash_password(password):
            raise ValueError("Invalid credentials")
        return user
    finally:
        session.close()


def request_otp(email: str):
    otp = "123456" if email else "000000"
    OTP_STORE[email.lower()] = {"otp": otp, "created_at": datetime.utcnow()}
    return otp


def verify_otp_and_reset(email: str, otp: str, new_password: str):
    record = OTP_STORE.get(email.lower())
    if not record or record["otp"] != otp:
        raise ValueError("Invalid OTP")
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=email.lower()).first()
        if not user:
            raise ValueError("User not found")
        user.password_hash = hash_password(new_password)
        session.commit()
    finally:
        session.close()
    del OTP_STORE[email.lower()]

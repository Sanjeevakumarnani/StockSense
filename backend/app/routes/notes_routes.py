from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request

from app.db import SessionLocal
from app.models import Note

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("/notes", methods=["GET"]) 
def list_notes():
    session = SessionLocal()
    try:
        rows = session.query(Note).order_by(Note.id.desc()).all()
        return jsonify([{"id": item.id, "content": item.content, "pinned": item.pinned, "reference_type": item.reference_type, "reference_id": item.reference_id, "created_by": item.created_by, "created_at": item.created_at.isoformat()} for item in rows]), 200
    finally:
        session.close()


@notes_bp.route("/notes", methods=["POST"]) 
def create_note():
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        content = (data.get("content") or "").strip()
        if not content:
            return jsonify({"error": "Content is required"}), 400
        note = Note(content=content, pinned=bool(data.get("pinned", False)), reference_type=data.get("reference_type"), reference_id=data.get("reference_id"), created_by=int(data.get("created_by") or 1))
        session.add(note)
        session.commit()
        session.refresh(note)
        return jsonify({"id": note.id, "content": note.content, "pinned": note.pinned, "reference_type": note.reference_type, "reference_id": note.reference_id}), 201
    finally:
        session.close()


@notes_bp.route("/notes/<int:note_id>", methods=["PUT"]) 
def update_note(note_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        note = session.query(Note).filter_by(id=note_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
        if "content" in data:
            note.content = data["content"]
        if "pinned" in data:
            note.pinned = bool(data["pinned"])
        note.updated_at = datetime.utcnow()
        session.commit()
        return jsonify({"id": note.id, "content": note.content, "pinned": note.pinned}), 200
    finally:
        session.close()


@notes_bp.route("/notes/<int:note_id>", methods=["DELETE"]) 
def delete_note(note_id):
    session = SessionLocal()
    try:
        note = session.query(Note).filter_by(id=note_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
        session.delete(note)
        session.commit()
        return jsonify({"message": "Note deleted"}), 200
    finally:
        session.close()

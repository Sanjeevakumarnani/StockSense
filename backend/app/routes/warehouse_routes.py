from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.db import SessionLocal
from app.models import Warehouse, Location, Inventory, Receipt, Delivery, Transfer, StockLedger, StockAdjustment
from app.middleware.auth import jwt_required, require_role

warehouse_bp = Blueprint("warehouses", __name__)


@warehouse_bp.route("/warehouses", methods=["GET"])
@jwt_required
def list_warehouses():
    session = SessionLocal()
    try:
        warehouses = session.query(Warehouse).order_by(Warehouse.id.desc()).all()
        payload = []
        for warehouse in warehouses:
            locations = session.query(Location).filter_by(warehouse_id=warehouse.id).all()
            location_payload = []
            wh_product_ids = set()
            wh_total_qty = 0.0

            for loc in locations:
                inv_rows = session.query(Inventory).filter(Inventory.location_id == loc.id, Inventory.quantity > 0).all()
                loc_product_ids = {i.product_id for i in inv_rows}
                loc_qty = sum(float(i.quantity) for i in inv_rows)

                wh_product_ids.update(loc_product_ids)
                wh_total_qty += loc_qty

                location_payload.append({
                    "id": loc.id,
                    "warehouse_id": loc.warehouse_id,
                    "name": loc.name,
                    "type": loc.type,
                    "product_count": len(loc_product_ids),
                    "total_quantity": loc_qty
                })

            payload.append({
                "id": warehouse.id,
                "name": warehouse.name,
                "address": warehouse.address,
                "location_count": len(locations),
                "product_count": len(wh_product_ids),
                "total_quantity": wh_total_qty,
                "locations": location_payload,
            })
        return jsonify(payload), 200
    finally:
        session.close()


@warehouse_bp.route("/warehouses", methods=["POST"])
@jwt_required
@require_role("manager")
def create_warehouse():
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Warehouse name is required"}), 400
        warehouse = Warehouse(name=name, address=data.get("address"))
        session.add(warehouse)
        session.commit()
        session.refresh(warehouse)
        return jsonify({
            "id": warehouse.id,
            "name": warehouse.name,
            "address": warehouse.address,
            "location_count": 0,
            "product_count": 0,
            "total_quantity": 0.0,
            "locations": []
        }), 201
    finally:
        session.close()


@warehouse_bp.route("/warehouses/<int:warehouse_id>", methods=["PUT"])
@jwt_required
@require_role("manager")
def update_warehouse(warehouse_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        wh = session.query(Warehouse).filter_by(id=warehouse_id).first()
        if not wh:
            return jsonify({"error": "Warehouse not found"}), 404

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Warehouse name is required"}), 400

        wh.name = name
        wh.address = data.get("address")
        session.commit()
        session.refresh(wh)

        return jsonify({"id": wh.id, "name": wh.name, "address": wh.address}), 200
    finally:
        session.close()


@warehouse_bp.route("/warehouses/<int:warehouse_id>", methods=["DELETE"])
@jwt_required
@require_role("manager")
def delete_warehouse(warehouse_id):
    session = SessionLocal()
    try:
        wh = session.query(Warehouse).filter_by(id=warehouse_id).first()
        if not wh:
            return jsonify({"error": "Warehouse not found"}), 404

        locations = session.query(Location).filter_by(warehouse_id=warehouse_id).all()
        loc_ids = [l.id for l in locations]

        if loc_ids:
            active_inv = session.query(Inventory).filter(Inventory.location_id.in_(loc_ids), Inventory.quantity > 0).count()
            if active_inv > 0:
                return jsonify({"error": f"Cannot delete warehouse '{wh.name}': locations inside contain active inventory."}), 400

            # Check document references
            rec_count = session.query(Receipt).filter(Receipt.destination_location_id.in_(loc_ids)).count()
            del_count = session.query(Delivery).filter(Delivery.source_location_id.in_(loc_ids)).count()
            tr_count = session.query(Transfer).filter((Transfer.source_location_id.in_(loc_ids)) | (Transfer.destination_location_id.in_(loc_ids))).count()
            if rec_count + del_count + tr_count > 0:
                return jsonify({"error": f"Cannot delete warehouse '{wh.name}': locations inside are referenced by transactions/documents."}), 400

            # Delete empty locations
            for l in locations:
                session.query(Inventory).filter_by(location_id=l.id).delete()
                session.delete(l)

        session.delete(wh)
        session.commit()
        return jsonify({"message": f"Warehouse '{wh.name}' deleted successfully"}), 200
    finally:
        session.close()


@warehouse_bp.route("/warehouses/<int:warehouse_id>/locations", methods=["POST"])
@jwt_required
@require_role("manager")
def create_location(warehouse_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        warehouse = session.query(Warehouse).filter_by(id=warehouse_id).first()
        if not warehouse:
            return jsonify({"error": "Warehouse not found"}), 404

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Location name is required"}), 400

        location = Location(warehouse_id=warehouse_id, name=name, type=data.get("type", "storage"))
        session.add(location)
        session.commit()
        session.refresh(location)
        return jsonify({
            "id": location.id,
            "warehouse_id": location.warehouse_id,
            "name": location.name,
            "type": location.type,
            "product_count": 0,
            "total_quantity": 0.0
        }), 201
    finally:
        session.close()


@warehouse_bp.route("/locations/<int:location_id>", methods=["PUT"])
@jwt_required
@require_role("manager")
def update_location(location_id):
    data = request.get_json(silent=True) or {}
    session = SessionLocal()
    try:
        loc = session.query(Location).filter_by(id=location_id).first()
        if not loc:
            return jsonify({"error": "Location not found"}), 404

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Location name is required"}), 400

        loc.name = name
        loc.type = data.get("type", loc.type)
        session.commit()
        session.refresh(loc)

        return jsonify({
            "id": loc.id,
            "warehouse_id": loc.warehouse_id,
            "name": loc.name,
            "type": loc.type
        }), 200
    finally:
        session.close()


@warehouse_bp.route("/locations/<int:location_id>", methods=["DELETE"])
@jwt_required
@require_role("manager")
def delete_location(location_id):
    session = SessionLocal()
    try:
        loc = session.query(Location).filter_by(id=location_id).first()
        if not loc:
            return jsonify({"error": "Location not found"}), 404

        active_inv = session.query(Inventory).filter(Inventory.location_id == location_id, Inventory.quantity > 0).count()
        if active_inv > 0:
            return jsonify({"error": f"Cannot delete location '{loc.name}': location contains active inventory."}), 400

        rec_count = session.query(Receipt).filter_by(destination_location_id=location_id).count()
        del_count = session.query(Delivery).filter_by(source_location_id=location_id).count()
        tr_count = session.query(Transfer).filter((Transfer.source_location_id == location_id) | (Transfer.destination_location_id == location_id)).count()
        if rec_count + del_count + tr_count > 0:
            return jsonify({"error": f"Cannot delete location '{loc.name}': location is referenced by transaction records."}), 400

        session.query(Inventory).filter_by(location_id=location_id).delete()
        session.delete(loc)
        session.commit()
        return jsonify({"message": f"Location '{loc.name}' deleted successfully"}), 200
    finally:
        session.close()


@warehouse_bp.route("/locations", methods=["GET"])
@jwt_required
def list_locations():
    """Get all locations across all warehouses — useful for dropdowns."""
    session = SessionLocal()
    try:
        query = session.query(Location, Warehouse.name.label("warehouse_name")).join(Warehouse, Warehouse.id == Location.warehouse_id)
        warehouse_id = request.args.get("warehouse_id")
        if warehouse_id:
            query = query.filter(Location.warehouse_id == int(warehouse_id))
        rows = query.order_by(Location.id).all()
        return jsonify([{
            "id": loc.id,
            "warehouse_id": loc.warehouse_id,
            "warehouse_name": wh_name,
            "name": loc.name,
            "type": loc.type,
        } for loc, wh_name in rows]), 200
    finally:
        session.close()


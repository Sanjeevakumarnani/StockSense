from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.db import SessionLocal
from app.models import (
    Receipt, ReceiptItem, Delivery, DeliveryItem, Transfer, TransferItem,
    StockAdjustment, StockLedger, Product, Location, Inventory, Supplier, Warehouse,
)
from app.services.stock_service import AlreadyValidatedError, StockValidationError, create_adjustment, validate_delivery, validate_receipt, validate_transfer
from app.middleware.auth import jwt_required, get_current_user

transaction_bp = Blueprint("transactions", __name__)


# ─── Helper ───
def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None


# ─── Receipts ───

@transaction_bp.route("/receipts", methods=["GET"])
@jwt_required
def list_receipts():
    session = SessionLocal()
    try:
        query = session.query(Receipt)
        status = request.args.get("status")
        date_from = _parse_date(request.args.get("date_from"))
        date_to = _parse_date(request.args.get("date_to"))
        if status:
            query = query.filter(Receipt.status == status)
        if date_from:
            query = query.filter(Receipt.created_at >= date_from)
        if date_to:
            query = query.filter(Receipt.created_at <= date_to)

        rows = query.order_by(Receipt.id.desc()).all()
        payload = []
        for row in rows:
            items = session.query(ReceiptItem).filter_by(receipt_id=row.id).all()
            # Get location name
            loc = session.query(Location).filter_by(id=row.destination_location_id).first()
            sup = session.query(Supplier).filter_by(id=row.supplier_id).first() if row.supplier_id else None
            item_details = []
            for item in items:
                prod = session.query(Product).filter_by(id=item.product_id).first()
                item_details.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": prod.name if prod else None,
                    "product_sku": prod.sku if prod else None,
                    "expected_quantity": float(item.expected_quantity),
                    "received_quantity": float(item.received_quantity),
                })
            payload.append({
                "id": row.id,
                "supplier_id": row.supplier_id,
                "supplier_name": sup.name if sup else None,
                "destination_location_id": row.destination_location_id,
                "destination_location_name": loc.name if loc else None,
                "status": row.status,
                "created_by": row.created_by,
                "created_at": row.created_at.isoformat(),
                "validated_at": row.validated_at.isoformat() if row.validated_at else None,
                "items": item_details,
            })
        return jsonify(payload), 200
    finally:
        session.close()


@transaction_bp.route("/receipts", methods=["POST"])
@jwt_required
def create_receipt():
    data = request.get_json(silent=True) or {}
    user = get_current_user()
    session = SessionLocal()
    try:
        dest_location_id = data.get("destination_location_id")
        if not dest_location_id:
            return jsonify({"error": "Destination location is required"}), 400
        items = data.get("items", [])
        if not items:
            return jsonify({"error": "At least one item is required"}), 400

        receipt = Receipt(
            supplier_id=data.get("supplier_id"),
            destination_location_id=int(dest_location_id),
            created_by=user["id"],
            status="draft",
        )
        session.add(receipt)
        session.commit()
        session.refresh(receipt)
        for item in items:
            if not item.get("product_id"):
                continue
            session.add(ReceiptItem(
                receipt_id=receipt.id,
                product_id=int(item["product_id"]),
                expected_quantity=float(item.get("expected_quantity", 0)),
                received_quantity=float(item.get("received_quantity", 0)),
            ))
        session.commit()
        return jsonify({"id": receipt.id, "status": receipt.status}), 201
    finally:
        session.close()


@transaction_bp.route("/receipts/<int:receipt_id>/validate", methods=["POST"])
@jwt_required
def validate_receipt_route(receipt_id):
    user = get_current_user()
    try:
        result = validate_receipt(receipt_id, user["id"])
        return jsonify({"status": "validated", "receipt": {"id": result.id, "status": result.status}}), 200
    except AlreadyValidatedError as exc:
        return jsonify({"error": str(exc)}), 409
    except StockValidationError as exc:
        return jsonify({"error": str(exc)}), 400


# ─── Deliveries ───

@transaction_bp.route("/deliveries", methods=["GET"])
@jwt_required
def list_deliveries():
    session = SessionLocal()
    try:
        query = session.query(Delivery)
        status = request.args.get("status")
        date_from = _parse_date(request.args.get("date_from"))
        date_to = _parse_date(request.args.get("date_to"))
        if status:
            query = query.filter(Delivery.status == status)
        if date_from:
            query = query.filter(Delivery.created_at >= date_from)
        if date_to:
            query = query.filter(Delivery.created_at <= date_to)

        rows = query.order_by(Delivery.id.desc()).all()
        payload = []
        for row in rows:
            items = session.query(DeliveryItem).filter_by(delivery_id=row.id).all()
            loc = session.query(Location).filter_by(id=row.source_location_id).first()
            item_details = []
            for item in items:
                prod = session.query(Product).filter_by(id=item.product_id).first()
                item_details.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": prod.name if prod else None,
                    "product_sku": prod.sku if prod else None,
                    "quantity": float(item.quantity),
                })
            payload.append({
                "id": row.id,
                "source_location_id": row.source_location_id,
                "source_location_name": loc.name if loc else None,
                "status": row.status,
                "created_by": row.created_by,
                "created_at": row.created_at.isoformat(),
                "validated_at": row.validated_at.isoformat() if row.validated_at else None,
                "items": item_details,
            })
        return jsonify(payload), 200
    finally:
        session.close()


@transaction_bp.route("/deliveries", methods=["POST"])
@jwt_required
def create_delivery():
    data = request.get_json(silent=True) or {}
    user = get_current_user()
    session = SessionLocal()
    try:
        source_location_id = data.get("source_location_id")
        if not source_location_id:
            return jsonify({"error": "Source location is required"}), 400
        items = data.get("items", [])
        if not items:
            return jsonify({"error": "At least one item is required"}), 400

        delivery = Delivery(
            source_location_id=int(source_location_id),
            created_by=user["id"],
            status="draft",
        )
        session.add(delivery)
        session.commit()
        session.refresh(delivery)
        for item in items:
            if not item.get("product_id"):
                continue
            session.add(DeliveryItem(
                delivery_id=delivery.id,
                product_id=int(item["product_id"]),
                quantity=float(item.get("quantity", 0)),
            ))
        session.commit()
        return jsonify({"id": delivery.id, "status": delivery.status}), 201
    finally:
        session.close()


@transaction_bp.route("/deliveries/<int:delivery_id>/validate", methods=["POST"])
@jwt_required
def validate_delivery_route(delivery_id):
    user = get_current_user()
    try:
        result = validate_delivery(delivery_id, user["id"])
        return jsonify({"status": "validated", "delivery": {"id": result.id, "status": result.status}}), 200
    except AlreadyValidatedError as exc:
        return jsonify({"error": str(exc)}), 409
    except StockValidationError as exc:
        return jsonify({"error": str(exc)}), 400


# ─── Transfers ───

@transaction_bp.route("/transfers", methods=["GET"])
@jwt_required
def list_transfers():
    session = SessionLocal()
    try:
        query = session.query(Transfer)
        status = request.args.get("status")
        date_from = _parse_date(request.args.get("date_from"))
        date_to = _parse_date(request.args.get("date_to"))
        if status:
            query = query.filter(Transfer.status == status)
        if date_from:
            query = query.filter(Transfer.created_at >= date_from)
        if date_to:
            query = query.filter(Transfer.created_at <= date_to)

        rows = query.order_by(Transfer.id.desc()).all()
        payload = []
        for row in rows:
            items = session.query(TransferItem).filter_by(transfer_id=row.id).all()
            source_loc = session.query(Location).filter_by(id=row.source_location_id).first()
            dest_loc = session.query(Location).filter_by(id=row.destination_location_id).first()
            item_details = []
            for item in items:
                prod = session.query(Product).filter_by(id=item.product_id).first()
                item_details.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": prod.name if prod else None,
                    "product_sku": prod.sku if prod else None,
                    "quantity": float(item.quantity),
                })
            payload.append({
                "id": row.id,
                "source_location_id": row.source_location_id,
                "source_location_name": source_loc.name if source_loc else None,
                "destination_location_id": row.destination_location_id,
                "destination_location_name": dest_loc.name if dest_loc else None,
                "status": row.status,
                "created_by": row.created_by,
                "created_at": row.created_at.isoformat(),
                "validated_at": row.validated_at.isoformat() if row.validated_at else None,
                "items": item_details,
            })
        return jsonify(payload), 200
    finally:
        session.close()


@transaction_bp.route("/transfers", methods=["POST"])
@jwt_required
def create_transfer():
    data = request.get_json(silent=True) or {}
    user = get_current_user()
    session = SessionLocal()
    try:
        source_location_id = data.get("source_location_id")
        destination_location_id = data.get("destination_location_id")
        if not source_location_id or not destination_location_id:
            return jsonify({"error": "Source and destination locations are required"}), 400
        if int(source_location_id) == int(destination_location_id):
            return jsonify({"error": "Source and destination must be different"}), 400
        items = data.get("items", [])
        if not items:
            return jsonify({"error": "At least one item is required"}), 400

        transfer = Transfer(
            source_location_id=int(source_location_id),
            destination_location_id=int(destination_location_id),
            created_by=user["id"],
            status="draft",
        )
        session.add(transfer)
        session.commit()
        session.refresh(transfer)
        for item in items:
            if not item.get("product_id"):
                continue
            session.add(TransferItem(
                transfer_id=transfer.id,
                product_id=int(item["product_id"]),
                quantity=float(item.get("quantity", 0)),
            ))
        session.commit()
        return jsonify({"id": transfer.id, "status": transfer.status}), 201
    finally:
        session.close()


@transaction_bp.route("/transfers/<int:transfer_id>/validate", methods=["POST"])
@jwt_required
def validate_transfer_route(transfer_id):
    user = get_current_user()
    try:
        result = validate_transfer(transfer_id, user["id"])
        return jsonify({"status": "validated", "transfer": {"id": result.id, "status": result.status}}), 200
    except AlreadyValidatedError as exc:
        return jsonify({"error": str(exc)}), 409
    except StockValidationError as exc:
        return jsonify({"error": str(exc)}), 400


# ─── Adjustments ───

@transaction_bp.route("/adjustments", methods=["GET"])
@jwt_required
def list_adjustments():
    session = SessionLocal()
    try:
        query = session.query(StockAdjustment)
        product_id = request.args.get("product_id")
        location_id = request.args.get("location_id")
        date_from = _parse_date(request.args.get("date_from"))
        date_to = _parse_date(request.args.get("date_to"))
        if product_id:
            query = query.filter(StockAdjustment.product_id == int(product_id))
        if location_id:
            query = query.filter(StockAdjustment.location_id == int(location_id))
        if date_from:
            query = query.filter(StockAdjustment.created_at >= date_from)
        if date_to:
            query = query.filter(StockAdjustment.created_at <= date_to)

        rows = query.order_by(StockAdjustment.id.desc()).all()
        result = []
        for row in rows:
            prod = session.query(Product).filter_by(id=row.product_id).first()
            loc = session.query(Location).filter_by(id=row.location_id).first()
            result.append({
                "id": row.id,
                "product_id": row.product_id,
                "product_name": prod.name if prod else None,
                "product_sku": prod.sku if prod else None,
                "location_id": row.location_id,
                "location_name": loc.name if loc else None,
                "created_by": row.created_by,
                "recorded_quantity": float(row.recorded_quantity),
                "physical_quantity": float(row.physical_quantity),
                "difference": float(row.difference),
                "reason": row.reason,
                "created_at": row.created_at.isoformat(),
            })
        return jsonify(result), 200
    finally:
        session.close()


@transaction_bp.route("/adjustments", methods=["POST"])
@jwt_required
def create_adjustment_route():
    data = request.get_json(silent=True) or {}
    user = get_current_user()
    try:
        product_id = data.get("product_id")
        location_id = data.get("location_id")
        if not product_id or not location_id:
            return jsonify({"error": "Product and location are required"}), 400
        adjustment = create_adjustment(
            int(product_id), int(location_id),
            float(data.get("recorded_quantity", 0)),
            float(data.get("physical_quantity", 0)),
            data.get("reason", ""),
            user["id"],
        )
        return jsonify({"id": adjustment.id, "difference": float(adjustment.difference), "reason": adjustment.reason}), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


# ─── Ledger ───

@transaction_bp.route("/ledger", methods=["GET"])
@jwt_required
def get_ledger():
    session = SessionLocal()
    try:
        query = session.query(StockLedger)
        product_id = request.args.get("product_id")
        operation_type = request.args.get("operation_type")
        reference_type = request.args.get("reference_type")
        location_id = request.args.get("location_id")
        date_from = _parse_date(request.args.get("date_from"))
        date_to = _parse_date(request.args.get("date_to"))

        if product_id:
            query = query.filter(StockLedger.product_id == int(product_id))
        if operation_type:
            query = query.filter(StockLedger.operation_type == operation_type)
        if reference_type:
            query = query.filter(StockLedger.reference_type == reference_type)
        if location_id:
            lid = int(location_id)
            query = query.filter((StockLedger.source_location_id == lid) | (StockLedger.destination_location_id == lid))
        if date_from:
            query = query.filter(StockLedger.created_at >= date_from)
        if date_to:
            query = query.filter(StockLedger.created_at <= date_to)

        rows = query.order_by(StockLedger.id.desc()).all()
        result = []
        for row in rows:
            prod = session.query(Product).filter_by(id=row.product_id).first()
            src_loc = session.query(Location).filter_by(id=row.source_location_id).first() if row.source_location_id else None
            dst_loc = session.query(Location).filter_by(id=row.destination_location_id).first() if row.destination_location_id else None
            result.append({
                "id": row.id,
                "product_id": row.product_id,
                "product_name": prod.name if prod else None,
                "product_sku": prod.sku if prod else None,
                "source_location_id": row.source_location_id,
                "source_location_name": src_loc.name if src_loc else None,
                "destination_location_id": row.destination_location_id,
                "destination_location_name": dst_loc.name if dst_loc else None,
                "user_id": row.user_id,
                "reference_type": row.reference_type,
                "reference_id": row.reference_id,
                "operation_type": row.operation_type,
                "quantity": float(row.quantity),
                "previous_stock": float(row.previous_stock),
                "updated_stock": float(row.updated_stock),
                "created_at": row.created_at.isoformat(),
            })
        return jsonify(result), 200
    finally:
        session.close()


# ─── Dashboard ───

@transaction_bp.route("/dashboard", methods=["GET"])
@jwt_required
def dashboard():
    session = SessionLocal()
    try:
        doc_type = request.args.get("document_type")
        status_param = request.args.get("status")
        warehouse_id = request.args.get("warehouse_id")
        location_id = request.args.get("location_id")
        category_id = request.args.get("category_id")

        if doc_type in ["all", ""]: doc_type = None
        if status_param in ["all", ""]: status_param = None
        if warehouse_id in ["all", ""] or not warehouse_id: warehouse_id = None
        if location_id in ["all", ""] or not location_id: location_id = None
        if category_id in ["all", ""] or not category_id: category_id = None

        target_location_ids = []
        if location_id:
            target_location_ids = [int(location_id)]
        elif warehouse_id:
            locs = session.query(Location.id).filter(Location.warehouse_id == int(warehouse_id)).all()
            target_location_ids = [l.id for l in locs]

        # 1. Total Products in Stock (distinct products with inventory > 0)
        inv_query = session.query(Inventory.product_id).filter(Inventory.quantity > 0)
        if target_location_ids:
            inv_query = inv_query.filter(Inventory.location_id.in_(target_location_ids))
        if category_id:
            inv_query = inv_query.join(Product, Product.id == Inventory.product_id).filter(Product.category_id == int(category_id))
        total_products_in_stock = inv_query.distinct().count()

        # 2. Low Stock / Out of Stock Items
        low_query = session.query(Inventory.product_id).join(Product, Product.id == Inventory.product_id).filter(Inventory.quantity <= Product.reorder_threshold)
        if target_location_ids:
            low_query = low_query.filter(Inventory.location_id.in_(target_location_ids))
        if category_id:
            low_query = low_query.filter(Product.category_id == int(category_id))
        low_stock_items = low_query.distinct().count()

        # 3. Pending Receipts
        if doc_type and doc_type not in ["receipt", "receipts"]:
            pending_receipts = 0
        else:
            rec_q = session.query(Receipt)
            if status_param:
                rec_q = rec_q.filter(Receipt.status == status_param)
            else:
                rec_q = rec_q.filter(Receipt.status.in_(["draft", "waiting", "ready"]))
            if target_location_ids:
                rec_q = rec_q.filter(Receipt.destination_location_id.in_(target_location_ids))
            if category_id:
                rec_q = rec_q.join(ReceiptItem, ReceiptItem.receipt_id == Receipt.id)\
                             .join(Product, Product.id == ReceiptItem.product_id)\
                             .filter(Product.category_id == int(category_id))
            pending_receipts = rec_q.distinct().count()

        # 4. Pending Deliveries
        if doc_type and doc_type not in ["delivery", "deliveries"]:
            pending_deliveries = 0
        else:
            del_q = session.query(Delivery)
            if status_param:
                del_q = del_q.filter(Delivery.status == status_param)
            else:
                del_q = del_q.filter(Delivery.status.in_(["draft", "waiting", "ready"]))
            if target_location_ids:
                del_q = del_q.filter(Delivery.source_location_id.in_(target_location_ids))
            if category_id:
                del_q = del_q.join(DeliveryItem, DeliveryItem.delivery_id == Delivery.id)\
                             .join(Product, Product.id == DeliveryItem.product_id)\
                             .filter(Product.category_id == int(category_id))
            pending_deliveries = del_q.distinct().count()

        # 5. Scheduled Internal Transfers
        if doc_type and doc_type not in ["transfer", "transfers", "internal"]:
            scheduled_transfers = 0
        else:
            tr_q = session.query(Transfer)
            if status_param:
                tr_q = tr_q.filter(Transfer.status == status_param)
            else:
                tr_q = tr_q.filter(Transfer.status.in_(["draft", "waiting", "ready"]))
            if target_location_ids:
                tr_q = tr_q.filter((Transfer.source_location_id.in_(target_location_ids)) | (Transfer.destination_location_id.in_(target_location_ids)))
            if category_id:
                tr_q = tr_q.join(TransferItem, TransferItem.transfer_id == Transfer.id)\
                           .join(Product, Product.id == TransferItem.product_id)\
                           .filter(Product.category_id == int(category_id))
            scheduled_transfers = tr_q.distinct().count()

        # ─── Recent Movements (StockLedger Feed) ───
        ledger_q = session.query(StockLedger)
        if doc_type:
            op_map = {"receipts": "receipt", "delivery": "delivery", "deliveries": "delivery", "internal": "transfer", "transfers": "transfer", "adjustments": "adjustment"}
            target_op = op_map.get(doc_type, doc_type)
            ledger_q = ledger_q.filter(StockLedger.operation_type == target_op)

        if target_location_ids:
            ledger_q = ledger_q.filter((StockLedger.source_location_id.in_(target_location_ids)) | (StockLedger.destination_location_id.in_(target_location_ids)))

        if category_id:
            ledger_q = ledger_q.join(Product, Product.id == StockLedger.product_id).filter(Product.category_id == int(category_id))

        recent_rows = ledger_q.order_by(StockLedger.id.desc()).limit(30).all()
        movements = []
        for row in recent_rows:
            prod = session.query(Product).filter_by(id=row.product_id).first()
            movements.append({
                "id": row.id,
                "product_id": row.product_id,
                "product_name": prod.name if prod else f"Product #{row.product_id}",
                "operation_type": row.operation_type,
                "reference_type": row.reference_type,
                "reference_id": row.reference_id,
                "quantity": float(row.quantity),
                "created_at": row.created_at.isoformat(),
            })

        # ─── Stock Movement Overview (Chart Data) ───
        all_ledger_rows = ledger_q.order_by(StockLedger.created_at.asc()).all()
        daily_map = {}
        top_product_map = {}
        for row in all_ledger_rows:
            date_str = row.created_at.strftime("%Y-%m-%d")
            if date_str not in daily_map:
                daily_map[date_str] = {"date": date_str, "stock_in": 0.0, "stock_out": 0.0, "net_change": 0.0}
            
            qty = float(row.quantity)
            if qty > 0:
                daily_map[date_str]["stock_in"] += qty
            else:
                daily_map[date_str]["stock_out"] += abs(qty)
            daily_map[date_str]["net_change"] += qty

            p_id = row.product_id
            prod_obj = session.query(Product).filter_by(id=p_id).first()
            p_name = prod_obj.name if prod_obj else f"Product #{p_id}"
            if p_name not in top_product_map:
                top_product_map[p_name] = 0.0
            top_product_map[p_name] += abs(qty)

        chart_data = sorted(list(daily_map.values()), key=lambda x: x["date"])
        top_products = [{"name": name, "volume": vol} for name, vol in sorted(top_product_map.items(), key=lambda x: x[1], reverse=True)[:5]]
        total_net_units = sum(item["net_change"] for item in chart_data)

        return jsonify({
            "kpis": {
                "total_products_in_stock": total_products_in_stock,
                "low_stock_items": low_stock_items,
                "pending_receipts": pending_receipts,
                "pending_deliveries": pending_deliveries,
                "scheduled_transfers": scheduled_transfers,
            },
            "chart_data": chart_data,
            "top_products": top_products,
            "summary": {
                "net_units_this_period": total_net_units
            },
            "recent_movements": movements,
        }), 200
    finally:
        session.close()


# ─── Alerts ───

@transaction_bp.route("/alerts", methods=["GET"])
@jwt_required
def list_alerts():
    session = SessionLocal()
    try:
        rows = session.query(Inventory, Product, Location).join(
            Product, Product.id == Inventory.product_id
        ).join(
            Location, Location.id == Inventory.location_id
        ).filter(Inventory.quantity <= Product.reorder_threshold).all()

        alerts = []
        for inv, product, location in rows:
            alert_type = "out_of_stock" if float(inv.quantity) <= 0 else "low_stock"
            alerts.append({
                "product_id": inv.product_id,
                "product_name": product.name,
                "product_sku": product.sku,
                "location_id": inv.location_id,
                "location_name": location.name,
                "quantity": float(inv.quantity),
                "threshold": float(product.reorder_threshold),
                "alert_type": alert_type,
            })
        return jsonify(alerts), 200
    finally:
        session.close()

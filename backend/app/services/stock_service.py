from __future__ import annotations

from datetime import datetime

from sqlalchemy import exc

from app.db import SessionLocal
from app.models import Inventory, Receipt, ReceiptItem, Delivery, DeliveryItem, Transfer, TransferItem, StockAdjustment, StockLedger


class StockValidationError(ValueError):
    pass


class AlreadyValidatedError(ValueError):
    pass


def validate_receipt(receipt_id: int, user_id: int):
    session = SessionLocal()
    try:
        receipt = session.query(Receipt).filter_by(id=receipt_id).first()
        if not receipt:
            raise StockValidationError("Receipt not found")
        if receipt.status == "done":
            raise AlreadyValidatedError("Receipt is already validated")
        if receipt.status == "canceled":
            raise StockValidationError("Cannot validate a canceled receipt")

        for item in session.query(ReceiptItem).filter_by(receipt_id=receipt_id).all():
            amount = float(item.received_quantity or 0)
            if amount < 0:
                raise StockValidationError(f"Negative quantity for product {item.product_id}")
            inv = session.query(Inventory).filter_by(product_id=item.product_id, location_id=receipt.destination_location_id).first()
            if inv is None:
                inv = Inventory(product_id=item.product_id, location_id=receipt.destination_location_id, quantity=0, updated_at=datetime.utcnow())
                session.add(inv)
            previous = float(inv.quantity)
            updated = previous + amount
            inv.quantity = updated
            inv.updated_at = datetime.utcnow()
            session.add(StockLedger(
                product_id=item.product_id,
                source_location_id=None,
                destination_location_id=receipt.destination_location_id,
                user_id=user_id,
                reference_type="receipt",
                reference_id=receipt.id,
                operation_type="receipt",
                quantity=amount,
                previous_stock=previous,
                updated_stock=updated,
                created_at=datetime.utcnow(),
            ))

        receipt.status = "done"
        receipt.validated_at = datetime.utcnow()
        session.commit()
        return receipt
    except exc.SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()


def validate_delivery(delivery_id: int, user_id: int):
    session = SessionLocal()
    try:
        delivery = session.query(Delivery).filter_by(id=delivery_id).first()
        if not delivery:
            raise StockValidationError("Delivery not found")
        if delivery.status == "done":
            raise AlreadyValidatedError("Delivery is already validated")
        if delivery.status == "canceled":
            raise StockValidationError("Cannot validate a canceled delivery")

        for item in session.query(DeliveryItem).filter_by(delivery_id=delivery_id).all():
            amount = float(item.quantity or 0)
            if amount < 0:
                raise StockValidationError(f"Negative quantity for product {item.product_id}")
            inv = session.query(Inventory).filter_by(product_id=item.product_id, location_id=delivery.source_location_id).first()
            if inv is None or float(inv.quantity) < amount:
                raise StockValidationError(f"Delivery exceeds available stock for product {item.product_id}")
            previous = float(inv.quantity)
            updated = previous - amount
            inv.quantity = updated
            inv.updated_at = datetime.utcnow()
            session.add(StockLedger(
                product_id=item.product_id,
                source_location_id=delivery.source_location_id,
                destination_location_id=None,
                user_id=user_id,
                reference_type="delivery",
                reference_id=delivery.id,
                operation_type="delivery",
                quantity=-amount,
                previous_stock=previous,
                updated_stock=updated,
                created_at=datetime.utcnow(),
            ))

        delivery.status = "done"
        delivery.validated_at = datetime.utcnow()
        session.commit()
        return delivery
    except exc.SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()


def validate_transfer(transfer_id: int, user_id: int):
    session = SessionLocal()
    try:
        transfer = session.query(Transfer).filter_by(id=transfer_id).first()
        if not transfer:
            raise StockValidationError("Transfer not found")
        if transfer.status == "done":
            raise AlreadyValidatedError("Transfer is already validated")
        if transfer.status == "canceled":
            raise StockValidationError("Cannot validate a canceled transfer")
        if transfer.source_location_id == transfer.destination_location_id:
            raise StockValidationError("Source and destination locations must be different")

        for item in session.query(TransferItem).filter_by(transfer_id=transfer_id).all():
            amount = float(item.quantity or 0)
            if amount <= 0:
                raise StockValidationError(f"Transfer quantity must be positive for product {item.product_id}")
            source_inv = session.query(Inventory).filter_by(product_id=item.product_id, location_id=transfer.source_location_id).first()
            destination_inv = session.query(Inventory).filter_by(product_id=item.product_id, location_id=transfer.destination_location_id).first()
            if source_inv is None or float(source_inv.quantity) < amount:
                raise StockValidationError(f"Transfer exceeds inventory for product {item.product_id} from source location")
            if destination_inv is None:
                destination_inv = Inventory(product_id=item.product_id, location_id=transfer.destination_location_id, quantity=0, updated_at=datetime.utcnow())
                session.add(destination_inv)

            source_previous = float(source_inv.quantity)
            destination_previous = float(destination_inv.quantity)
            source_inv.quantity = source_previous - amount
            destination_inv.quantity = destination_previous + amount
            source_inv.updated_at = datetime.utcnow()
            destination_inv.updated_at = datetime.utcnow()
            session.add(StockLedger(
                product_id=item.product_id,
                source_location_id=transfer.source_location_id,
                destination_location_id=transfer.destination_location_id,
                user_id=user_id,
                reference_type="transfer",
                reference_id=transfer.id,
                operation_type="transfer",
                quantity=amount,
                previous_stock=source_previous,
                updated_stock=source_previous - amount,
                created_at=datetime.utcnow(),
            ))

        transfer.status = "done"
        transfer.validated_at = datetime.utcnow()
        session.commit()
        return transfer
    except exc.SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()


def create_adjustment(product_id: int, location_id: int, recorded_quantity: float, physical_quantity: float, reason: str, user_id: int):
    session = SessionLocal()
    try:
        difference = float(physical_quantity) - float(recorded_quantity)
        inv = session.query(Inventory).filter_by(product_id=product_id, location_id=location_id).first()
        if inv is None:
            inv = Inventory(product_id=product_id, location_id=location_id, quantity=0, updated_at=datetime.utcnow())
            session.add(inv)
        previous = float(inv.quantity)
        inv.quantity = previous + difference
        inv.updated_at = datetime.utcnow()

        adjustment = StockAdjustment(
            product_id=product_id,
            location_id=location_id,
            created_by=user_id,
            recorded_quantity=float(recorded_quantity),
            physical_quantity=float(physical_quantity),
            difference=difference,
            reason=reason,
            created_at=datetime.utcnow(),
        )
        session.add(adjustment)
        session.flush()
        session.add(StockLedger(
            product_id=product_id,
            source_location_id=None,
            destination_location_id=location_id,
            user_id=user_id,
            reference_type="adjustment",
            reference_id=adjustment.id,
            operation_type="adjustment",
            quantity=difference,
            previous_stock=previous,
            updated_stock=previous + difference,
            created_at=datetime.utcnow(),
        ))
        session.commit()
        return adjustment
    except exc.SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()

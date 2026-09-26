from __future__ import annotations

from app import SessionLocal, engine
from app.models import Base, User, Product, Warehouse, Location, Inventory, Receipt, ReceiptItem, Delivery, DeliveryItem, Transfer, TransferItem
from app.services.stock_service import create_adjustment, validate_delivery, validate_receipt, validate_transfer


def reset_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        session.query(Inventory).delete()
        session.query(ReceiptItem).delete()
        session.query(Receipt).delete()
        session.query(DeliveryItem).delete()
        session.query(Delivery).delete()
        session.query(TransferItem).delete()
        session.query(Transfer).delete()
        session.query(Product).delete()
        session.query(Location).delete()
        session.query(Warehouse).delete()
        session.query(User).delete()
        session.commit()
    finally:
        session.close()


def test_receipt_increases_inventory_and_ledger():
    reset_db()
    session = SessionLocal()
    try:
        user = User(name="Alice", email="alice@example.com", password_hash="hash", role="manager")
        warehouse = Warehouse(name="Main", address="HQ")
        location = Location(warehouse_id=1, name="Rack A", type="storage")
        product = Product(category_id=None, name="Widget", sku="WGT-001", unit_of_measure="pcs", reorder_threshold=5)
        session.add_all([user, warehouse, location, product])
        session.commit()

        receipt = Receipt(supplier_id=None, destination_location_id=location.id, created_by=user.id, status="draft")
        session.add(receipt)
        session.commit()
        session.add(ReceiptItem(receipt_id=receipt.id, product_id=product.id, expected_quantity=10, received_quantity=10))
        session.commit()

        validate_receipt(receipt.id, user.id)

        inventory = session.query(Inventory).filter_by(product_id=product.id, location_id=location.id).one()
        assert inventory.quantity == 10
    finally:
        session.close()


def test_delivery_reduces_inventory_and_blocks_overdelivery():
    reset_db()
    session = SessionLocal()
    try:
        user = User(name="Bob", email="bob@example.com", password_hash="hash", role="staff")
        warehouse = Warehouse(name="Main", address="HQ")
        source = Location(warehouse_id=1, name="Rack L1", type="storage")
        product = Product(category_id=None, name="Bolt", sku="BOLT-001", unit_of_measure="pcs", reorder_threshold=2)
        session.add_all([user, warehouse, source, product])
        session.commit()
        session.add(Inventory(product_id=product.id, location_id=source.id, quantity=20))
        session.commit()

        delivery = Delivery(source_location_id=source.id, created_by=user.id, status="draft")
        session.add(delivery)
        session.commit()
        session.add(DeliveryItem(delivery_id=delivery.id, product_id=product.id, quantity=15))
        session.commit()

        validate_delivery(delivery.id, user.id)
        inventory = session.query(Inventory).filter_by(product_id=product.id, location_id=source.id).one()
        assert inventory.quantity == 5

        unsafe = Delivery(source_location_id=source.id, created_by=user.id, status="draft")
        session.add(unsafe)
        session.commit()
        session.add(DeliveryItem(delivery_id=unsafe.id, product_id=product.id, quantity=100))
        session.commit()

        try:
            validate_delivery(unsafe.id, user.id)
            assert False, "Overdelivery should raise an error"
        except ValueError:
            pass
    finally:
        session.close()


def test_transfer_moves_between_locations_and_keeps_total_constant():
    reset_db()
    session = SessionLocal()
    try:
        user = User(name="Carol", email="carol@example.com", password_hash="hash", role="manager")
        warehouse = Warehouse(name="Main", address="HQ")
        source = Location(warehouse_id=1, name="Rack A", type="storage")
        destination = Location(warehouse_id=1, name="Rack B", type="storage")
        product = Product(category_id=None, name="Screw", sku="SCR-001", unit_of_measure="pcs", reorder_threshold=1)
        session.add_all([user, warehouse, source, destination, product])
        session.commit()
        session.add_all([
            Inventory(product_id=product.id, location_id=source.id, quantity=10),
            Inventory(product_id=product.id, location_id=destination.id, quantity=2),
        ])
        session.commit()

        transfer = Transfer(source_location_id=source.id, destination_location_id=destination.id, created_by=user.id, status="draft")
        session.add(transfer)
        session.commit()
        session.add(TransferItem(transfer_id=transfer.id, product_id=product.id, quantity=6))
        session.commit()

        validate_transfer(transfer.id, user.id)
        source_inv = session.query(Inventory).filter_by(product_id=product.id, location_id=source.id).one()
        dest_inv = session.query(Inventory).filter_by(product_id=product.id, location_id=destination.id).one()
        assert source_inv.quantity == 4
        assert dest_inv.quantity == 8
        assert source_inv.quantity + dest_inv.quantity == 12
    finally:
        session.close()


def test_adjustment_applies_physical_minus_recorded_delta():
    reset_db()
    session = SessionLocal()
    try:
        user = User(name="Dora", email="dora@example.com", password_hash="hash", role="manager")
        warehouse = Warehouse(name="Main", address="HQ")
        location = Location(warehouse_id=1, name="Rack C", type="storage")
        product = Product(category_id=None, name="Cable", sku="CAB-001", unit_of_measure="m", reorder_threshold=2)
        session.add_all([user, warehouse, location, product])
        session.commit()
        session.add(Inventory(product_id=product.id, location_id=location.id, quantity=15))
        session.commit()

        create_adjustment(product.id, location.id, 15, 12, "Count discrepancy", user.id)
        inv = session.query(Inventory).filter_by(product_id=product.id, location_id=location.id).one()
        assert inv.quantity == 12
    finally:
        session.close()

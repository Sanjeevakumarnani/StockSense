from app.db import SessionLocal
from app.models import User, Category, Warehouse, Location, Supplier, Product, Inventory, StockLedger
from app.services.auth_service import hash_password
from datetime import datetime, timedelta
import random

def seed():
    session = SessionLocal()
    try:
        # Users
        manager = session.query(User).filter_by(email="manager@example.com").first()
        if not manager:
            manager = User(name="Alex Manager", email="manager@example.com", password_hash=hash_password("password123"), role="manager")
            session.add(manager)
            
        staff = session.query(User).filter_by(email="staff@example.com").first()
        if not staff:
            staff = User(name="Sam Staff", email="staff@example.com", password_hash=hash_password("password123"), role="staff")
            session.add(staff)
            
        session.flush()

        # Categories
        categories = ["Electronics", "Office Supplies", "Furniture", "Breakroom"]
        cat_objects = []
        for c in categories:
            cat = session.query(Category).filter_by(name=c).first()
            if not cat:
                cat = Category(name=c, description=f"All {c.lower()} items.")
                session.add(cat)
            cat_objects.append(cat)
        session.flush()

        # Warehouses & Locations
        wh1 = session.query(Warehouse).filter_by(name="Main Hub").first()
        if not wh1:
            wh1 = Warehouse(name="Main Hub", address="123 Industrial Parkway")
            session.add(wh1)
        session.flush()

        loc1 = session.query(Location).filter_by(name="A1-Racks").first()
        if not loc1:
            loc1 = Location(warehouse_id=wh1.id, name="A1-Racks", type="storage")
            session.add(loc1)
        
        loc2 = session.query(Location).filter_by(name="Receiving Dock").first()
        if not loc2:
            loc2 = Location(warehouse_id=wh1.id, name="Receiving Dock", type="receiving")
            session.add(loc2)
        session.flush()

        # Suppliers
        sup1 = session.query(Supplier).filter_by(name="TechSolutions Inc").first()
        if not sup1:
            sup1 = Supplier(name="TechSolutions Inc", contact_email="sales@techsolutions.com", phone="555-0192")
            session.add(sup1)

        # Products
        products_data = [
            ("MacBook Pro 16", "LAP-001", cat_objects[0].id, 10),
            ("Dell XPS 15", "LAP-002", cat_objects[0].id, 15),
            ("Herman Miller Chair", "FUR-001", cat_objects[2].id, 5),
            ("Standing Desk", "FUR-002", cat_objects[2].id, 10),
            ("Ergonomic Keyboard", "OFF-001", cat_objects[1].id, 20),
            ("Coffee Beans (1kg)", "BRK-001", cat_objects[3].id, 50),
        ]
        
        prod_objects = []
        for name, sku, cat_id, threshold in products_data:
            p = session.query(Product).filter_by(sku=sku).first()
            if not p:
                p = Product(name=name, sku=sku, category_id=cat_id, unit_of_measure="pcs", reorder_threshold=threshold)
                session.add(p)
            prod_objects.append(p)
        session.flush()

        # Inventory & Ledger (to populate charts)
        now = datetime.utcnow()
        for p in prod_objects:
            inv = session.query(Inventory).filter_by(product_id=p.id, location_id=loc1.id).first()
            if not inv:
                qty = random.randint(5, 50)
                inv = Inventory(product_id=p.id, location_id=loc1.id, quantity=qty)
                session.add(inv)
                
                # Add some historical ledger entries for the charts
                for i in range(3):
                    days_ago = random.randint(1, 14)
                    movement_qty = random.randint(1, 10)
                    is_inbound = random.choice([True, False])
                    
                    if not is_inbound:
                        movement_qty = -movement_qty
                        
                    ledger = StockLedger(
                        product_id=p.id,
                        user_id=manager.id,
                        reference_type="adjustment",
                        reference_id=1,
                        operation_type="adjustment",
                        quantity=movement_qty,
                        previous_stock=0,
                        updated_stock=0,
                        created_at=now - timedelta(days=days_ago)
                    )
                    session.add(ledger)
                    
        session.commit()
        print("Database seeded with rich sample data!")
    finally:
        session.close()

if __name__ == "__main__":
    seed()

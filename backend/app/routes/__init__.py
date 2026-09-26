from flask import Flask

from .auth_routes import auth_bp
from .categories_routes import categories_bp
from .inventory_routes import inventory_bp
from .notes_routes import notes_bp
from .product_routes import products_bp
from .supplier_routes import supplier_bp
from .transaction_routes import transaction_bp
from .warehouse_routes import warehouse_bp
from .user_routes import user_bp


def register_routes(app: Flask):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
    app.register_blueprint(warehouse_bp, url_prefix="/api")
    app.register_blueprint(inventory_bp, url_prefix="/api")
    app.register_blueprint(transaction_bp, url_prefix="/api")
    app.register_blueprint(notes_bp, url_prefix="/api")
    app.register_blueprint(supplier_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/api")
    return app

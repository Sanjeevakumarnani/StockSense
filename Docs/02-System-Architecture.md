# StockSense — System Architecture

## 1. High-Level Architecture

```
Frontend (React + TypeScript)
        ↓  HTTPS / JSON
API Layer (REST API, Flask)
        ↓
Backend Services (modular, service-layer)
  ├── Authentication Service
  ├── Product Service
  ├── Inventory Service
  ├── Receipt Service
  ├── Delivery Service
  ├── Transfer Service
  ├── Adjustment Service
  ├── Ledger Service
  └── Notification/Alert Service
        ↓
Database (PostgreSQL)
```

Each service owns a single responsibility and talks to the database through models/repositories. Stock-changing services (Receipt, Delivery, Transfer, Adjustment) all call into the **Inventory Service** and **Ledger Service** to apply stock changes and record history, so stock logic and ledger writing are never duplicated across services.

### Data Flow

**1. Login**
Frontend sends credentials → Authentication Service validates against `users` table → issues JWT → frontend stores token → subsequent requests include `Authorization: Bearer <token>`.

**2. Creating a product**
Frontend form → API → Product Service validates fields (unique SKU, valid category/unit) → writes to `products` and initializes an `inventory` row per location → returns created product.

**3. Receiving goods**
Frontend Receipt form → API → Receipt Service creates `receipts`/`receipt_items` (Draft) → on Validate, Receipt Service calls Inventory Service to increase stock at the destination location → Ledger Service writes a ledger entry → response returns updated stock.

**4. Delivering goods**
Frontend Delivery form → API → Delivery Service creates `deliveries`/`delivery_items` (Draft) → Pick/Pack status updates → on Validate, checks available stock, calls Inventory Service to decrease stock at the source location → Ledger Service writes a ledger entry.

**5. Internal transfer**
Frontend Transfer form → API → Transfer Service creates `transfers`/`transfer_items` → on Validate, Inventory Service decreases stock at source location and increases stock at destination location in a single atomic transaction → Ledger Service writes one ledger entry per movement (or a paired entry) → total company stock unchanged.

**6. Stock adjustment**
Frontend Adjustment form → API → Adjustment Service records physical count vs recorded stock → computes delta → Inventory Service applies delta → Ledger Service writes an entry with the reason and delta.

**7. Dashboard loading**
Frontend requests dashboard data → API aggregates KPIs from Inventory Service (stock totals, low-stock counts) and document services (pending receipts/deliveries/transfers counts) → Ledger Service supplies "recent movements" → response is a single aggregated payload.

## 2. Recommended Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React.js + TypeScript | Component-based UI, strong typing reduces bugs, fast to build with in a hackathon. |
| UI Styling | Tailwind CSS | Rapid, consistent styling without writing custom CSS files. |
| Backend | Python Flask | Lightweight, minimal boilerplate, quick to stand up REST APIs. |
| API | REST (JSON over HTTPS) | Simple, well understood, easy to document and test (e.g., with Postman). |
| Database | PostgreSQL | Relational integrity for stock quantities, transactions, and foreign keys; strong at atomic updates. |
| Authentication | JWT | Stateless, easy to verify on each request, works well with a SPA frontend. |
| OTP / Password Reset | Email OTP service (e.g., SMTP + a transactional email provider) | Simple to implement, no external phone/SMS cost. |
| Charts | Recharts | React-native charting for dashboard KPIs, minimal setup. |
| Icons | Lucide React | Consistent, lightweight icon set matching a modern SaaS look. |
| Version Control | Git + GitHub | Standard collaboration workflow for a hackathon team. |
| Deployment | Vercel (frontend), Render/Railway (backend + PostgreSQL) | Fast, free-tier-friendly deployment suitable for a demo. |

**Alternatives:** If the team is more comfortable with it, Node.js + Express (with Prisma/Sequelize) is a viable backend alternative to Flask, and MongoDB could replace PostgreSQL if the team prefers a document store — though PostgreSQL is recommended because inventory data is inherently relational and benefits from transactional guarantees.

## 3. Database Architecture

### `users`
- **PK:** `id`
- Fields: `name`, `email` (unique), `password_hash`, `role` (`manager` / `staff`), `created_at`
- Relationships: referenced by every transaction table via `created_by` / `user_id`.

### `categories`
- **PK:** `id`
- Fields: `name`, `description`
- Relationships: referenced by `products.category_id`.

### `warehouses`
- **PK:** `id`
- Fields: `name`, `address`
- Relationships: has many `locations`.

### `locations`
- **PK:** `id`
- **FK:** `warehouse_id` → `warehouses.id`
- Fields: `name` (e.g., "Rack A1", "Production Floor"), `type`
- Relationships: referenced by `inventory.location_id` and as source/destination in transfers.

### `products`
- **PK:** `id`
- **FK:** `category_id` → `categories.id`
- Fields: `name`, `sku` (unique), `unit_of_measure`, `reorder_threshold`, `created_at`
- Relationships: has many `inventory` rows (one per location), referenced by all item tables.

### `suppliers`
- **PK:** `id`
- Fields: `name`, `contact_email`, `phone`
- Relationships: referenced by `receipts.supplier_id`.

### `inventory`
- **PK:** `id`
- **FK:** `product_id` → `products.id`, `location_id` → `locations.id`
- Fields: `quantity`, `updated_at`
- Relationships: unique constraint on (`product_id`, `location_id`); this table holds the current source-of-truth stock per product per location.

### `receipts`
- **PK:** `id`
- **FK:** `supplier_id` → `suppliers.id`, `destination_location_id` → `locations.id`, `created_by` → `users.id`
- Fields: `status` (Draft/Waiting/Ready/Done/Canceled), `created_at`, `validated_at`

### `receipt_items`
- **PK:** `id`
- **FK:** `receipt_id` → `receipts.id`, `product_id` → `products.id`
- Fields: `expected_quantity`, `received_quantity`

### `deliveries`
- **PK:** `id`
- **FK:** `source_location_id` → `locations.id`, `created_by` → `users.id`
- Fields: `status`, `created_at`, `validated_at`

### `delivery_items`
- **PK:** `id`
- **FK:** `delivery_id` → `deliveries.id`, `product_id` → `products.id`
- Fields: `quantity`

### `transfers`
- **PK:** `id`
- **FK:** `source_location_id` → `locations.id`, `destination_location_id` → `locations.id`, `created_by` → `users.id`
- Fields: `status`, `created_at`, `validated_at`

### `transfer_items`
- **PK:** `id`
- **FK:** `transfer_id` → `transfers.id`, `product_id` → `products.id`
- Fields: `quantity`

### `stock_adjustments`
- **PK:** `id`
- **FK:** `product_id` → `products.id`, `location_id` → `locations.id`, `created_by` → `users.id`
- Fields: `recorded_quantity`, `physical_quantity`, `difference`, `reason`, `created_at`

### `stock_ledger`
- **PK:** `id`
- **FK:** `product_id` → `products.id`, `source_location_id` → `locations.id` (nullable), `destination_location_id` → `locations.id` (nullable), `user_id` → `users.id`, `reference_id`/`reference_type` (polymorphic reference to receipt/delivery/transfer/adjustment)
- Fields: `operation_type`, `quantity`, `previous_stock`, `updated_stock`, `created_at`

**Assumption:** The Stock Ledger uses a polymorphic `reference_type` + `reference_id` pair rather than four separate nullable foreign keys, to keep the table simple while still traceable back to the originating document.

## 4. API Structure

| Method | Endpoint | Purpose | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | Register a user | name, email, password, role | user, token |
| POST | `/api/auth/login` | Authenticate | email, password | user, token |
| POST | `/api/auth/logout` | Invalidate session | — | success |
| POST | `/api/auth/otp/request` | Request password reset OTP | email | success |
| POST | `/api/auth/otp/verify` | Verify OTP + set new password | email, otp, new_password | success |
| GET | `/api/products` | List/search/filter products | query params | product[] |
| POST | `/api/products` | Create product | product fields | product |
| GET | `/api/products/:id` | Get product detail | — | product |
| PUT | `/api/products/:id` | Update product | product fields | product |
| GET | `/api/categories` | List categories | — | category[] |
| POST | `/api/categories` | Create category | name, description | category |
| GET | `/api/warehouses` | List warehouses + locations | — | warehouse[] |
| POST | `/api/warehouses` | Create warehouse | name, address | warehouse |
| POST | `/api/warehouses/:id/locations` | Create location | name, type | location |
| GET | `/api/inventory` | Current stock (by product/location) | filters | inventory[] |
| GET | `/api/receipts` | List receipts | filters | receipt[] |
| POST | `/api/receipts` | Create draft receipt | supplier_id, destination_location_id, items[] | receipt |
| POST | `/api/receipts/:id/validate` | Validate receipt, increase stock | — | receipt, ledger entries |
| GET | `/api/deliveries` | List deliveries | filters | delivery[] |
| POST | `/api/deliveries` | Create draft delivery | source_location_id, items[] | delivery |
| POST | `/api/deliveries/:id/validate` | Validate delivery, decrease stock | — | delivery, ledger entries |
| GET | `/api/transfers` | List transfers | filters | transfer[] |
| POST | `/api/transfers` | Create draft transfer | source_location_id, destination_location_id, items[] | transfer |
| POST | `/api/transfers/:id/validate` | Validate transfer, move stock | — | transfer, ledger entries |
| GET | `/api/adjustments` | List adjustments | filters | adjustment[] |
| POST | `/api/adjustments` | Create + apply adjustment | product_id, location_id, physical_quantity, reason | adjustment, ledger entry |
| GET | `/api/ledger` | Query stock ledger | filters (product, date range, type) | ledger_entry[] |
| GET | `/api/dashboard` | Aggregated KPIs + recent movements | filters | dashboard payload |
| GET | `/api/alerts` | Low-stock / out-of-stock list | — | alert[] |
| GET | `/api/notes` | List/search notes | filters | note[] |
| POST | `/api/notes` | Create note | content, pinned, reference | note |
| PUT | `/api/notes/:id` | Update note | content, pinned | note |
| DELETE | `/api/notes/:id` | Delete note | — | success |

## 5. Folder Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components (buttons, tables, badges, cards)
│   ├── pages/             # Route-level pages (Dashboard, Products, Receipts, ...)
│   ├── layouts/           # App shell, sidebar + top nav layout
│   ├── hooks/              # Custom React hooks (useAuth, useInventory, ...)
│   ├── services/           # API client modules (one per domain: products.ts, receipts.ts, ...)
│   ├── types/              # Shared TypeScript types/interfaces
│   ├── utils/               # Formatting, validation helpers
│   ├── contexts/            # Auth context, theme context
│   └── assets/               # Static assets

backend/
├── app/
│   ├── routes/            # Flask blueprints per domain (auth, products, receipts, ...)
│   ├── models/             # SQLAlchemy models (one file per table/entity)
│   ├── services/           # Business logic (InventoryService, LedgerService, ...)
│   ├── schemas/            # Request/response validation (e.g., Marshmallow/Pydantic)
│   ├── utils/                # Shared helpers (OTP generation, response formatting)
│   ├── middleware/          # Auth middleware, error handling
│   └── config/                # App configuration, environment loading
├── migrations/            # Database migration scripts
├── tests/                  # Unit/integration tests
└── run.py                   # Application entry point
```

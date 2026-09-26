# StockSense — Development Rules

## 1. General Principles

- Build the MVP first — do not implement Future Scope items defined in the PRD until the MVP is complete and demo-ready.
- Keep modules independent: Product, Receipt, Delivery, Transfer, Adjustment, and Ledger logic should not be tangled together.
- Follow separation of concerns: routes handle HTTP, services handle business logic, models handle data access.
- Avoid unnecessary complexity — favor the simplest solution that satisfies the requirement.
- Validate all user inputs on both frontend and backend; never trust client-side validation alone.
- Never directly modify a stock quantity without going through the appropriate transaction (Receipt, Delivery, Transfer, Adjustment) and its ledger record.
- Every stock-changing operation must be traceable back to a document and a user.
- Maintain data consistency — stock in `inventory` must always match the sum of ledger movements for that product/location.
- Handle errors gracefully with clear, actionable messages (e.g., "Insufficient stock for delivery" rather than a generic 500 error).
- Use reusable components on the frontend rather than duplicating similar UI across pages.
- Keep frontend and backend responsibilities separate — the frontend renders and collects input; the backend owns business rules and validation.

## 2. Technology & Coding Standards

### Frontend
- TypeScript strict mode enabled.
- Functional React components with hooks only (no class components).
- Reusable components (buttons, tables, status badges, modals) shared across pages.
- Meaningful, descriptive component names (`ReceiptForm`, not `Form2`).
- Avoid duplicated UI logic — extract shared logic into hooks or utils.
- Centralized API service layer (`services/`) — components never call `fetch`/`axios` directly.
- Every data-driven view must handle loading, error, and empty states explicitly.

### Backend
- Follow RESTful API conventions (resource-based URLs, correct HTTP verbs).
- Modular Flask architecture using blueprints, one per domain.
- Business logic lives in the service layer, not in route handlers.
- Every API request is validated (required fields, types, enum values) before touching the database.
- Consistent HTTP status codes: 200/201 for success, 400 for validation errors, 401/403 for auth errors, 404 for not found, 409 for conflicts (e.g., duplicate SKU), 500 for unexpected errors.
- Centralized error handling (a single error handler formats all error responses consistently).
- Secrets and config values (DB URL, JWT secret, email credentials) come from environment variables.
- Never hardcode credentials or secrets in source code.

### Database
- Use proper foreign keys to enforce referential integrity between products, locations, and transaction tables.
- Wrap every stock-changing operation in a database transaction so partial updates cannot occur.
- Add `created_at` (and `updated_at` where relevant) timestamps to all tables.
- Avoid unnecessary duplicate data — derive totals from `inventory`/`stock_ledger` rather than storing redundant totals that can drift out of sync.
- Maintain referential integrity — do not allow deletion of a product/location that has related transaction history; prefer soft deactivation.

### Git
- Use feature branches (e.g., `feature/receipt-workflow`).
- Write meaningful, conventional commit messages, for example:
  - `feat: add product management`
  - `feat: implement receipt workflow`
  - `fix: correct inventory transfer calculation`
  - `docs: update architecture`

## 3. Project Structure Rules

- **Components** belong in `frontend/src/components/` if reusable across pages, or co-located under `pages/<PageName>/` if page-specific.
- **API calls** belong exclusively in `frontend/src/services/`, grouped by domain (e.g., `services/receipts.ts`).
- **Business logic** (stock calculations, validation rules, ledger writing) belongs in `backend/app/services/`, never in route handlers or React components.
- **Database models** belong in `backend/app/models/`, one file per entity, matching the schema in the System Architecture document.
- **Authentication logic** (JWT issuing/verification, OTP generation/validation) belongs in `backend/app/services/auth_service.py` and `backend/app/middleware/` for request-level protection.
- **Shared utilities** (date formatting, number formatting, response envelopes) belong in `utils/` on both frontend and backend — never duplicated inline.
- **Naming conventions:** snake_case for backend Python/database fields, camelCase for frontend TypeScript variables, PascalCase for React components, kebab-case for API routes.

## 4. Critical Inventory Rules

**RULE 1** — Receipt validation increases stock at the receipt's destination location.

**RULE 2** — Delivery validation decreases stock at the delivery's source location.

**RULE 3** — Internal transfer decreases source location stock and increases destination location stock by the same quantity; total company-wide stock of the product remains unchanged.

**RULE 4** — Adjustment updates stock according to the difference between recorded quantity and physical count (physical − recorded = delta; delta is applied to stock).

**RULE 5** — Every stock-changing action (Receipt validation, Delivery validation, Transfer validation, Adjustment) creates a corresponding Stock Ledger entry.

**RULE 6** — Delivery quantity cannot exceed available stock at the source location, unless explicitly allowed by a future business rule (e.g., backorders).

**RULE 7** — Canceled transactions must not alter inventory; if a transaction is canceled before validation, no stock change and no ledger entry occur. A validated transaction cannot be silently canceled — it must be reversed through a new, explicit adjustment or return flow (future scope).

**RULE 8** — All inventory-changing operations (Receipt/Delivery/Transfer validation, Adjustment application) must be executed as atomic database transactions: either the stock update and ledger entry both succeed, or neither is applied.

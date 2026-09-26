# StockSense — Project Memory

*This is a living document. Update it as development progresses so any future session can pick up context quickly.*

## 1. Current Status

- **Project:** StockSense
- **Stage:** Prototype Development
- **Overall Status:** In Progress
- **Current Focus:** Creating/Editing Documents (CRUD)

## 2. Completed Tasks

- Problem statement analyzed.
- Product requirements defined.
- System architecture planned.
- Development rules defined.
- Design system defined.
- Development roadmap created.
- Project setup (frontend, backend, database, folder structure).
- Authentication (signup, login, JWT, OTP password reset).
- Product Management UI (search, pagination).
- Receipts UI (create → validate).
- Deliveries UI (validate).
- Internal Transfers UI (validate).
- Stock Adjustments UI.
- Stock Ledger UI (query, filter, display).
- Dashboard UI (KPIs, recent movements).
- Seeded realistic demo data.

## 3. In Progress

- Building forms to Create Deliveries, Transfers, Adjustments.

## 4. Upcoming Tasks (priority order)

1. Build "Create Delivery/Transfer/Adjustment" modals/forms.
2. Build Notes Management module.
3. Build Categories and Warehouses Management modules.
4. Polish, test all edge cases, and prepare hackathon demo.

## 5. Important Decisions

**Technology decisions:**
- Frontend: React + TypeScript + Tailwind CSS.
- Backend: Python Flask, REST API.
- Database: PostgreSQL.
- Auth: JWT for sessions, email-based OTP for password reset.
- Charts: Recharts. Icons: Lucide React.

**Architecture decisions:**
- Layered architecture: Frontend → REST API → Service layer → PostgreSQL.
- One dedicated service per domain (Auth, Product, Inventory, Receipt, Delivery, Transfer, Adjustment, Ledger, Notification).
- All stock changes flow through the Inventory Service and are recorded by the Ledger Service — no direct stock writes elsewhere.

**Database decisions:**
- `inventory` table holds per-product, per-location current stock as the single source of truth.
- `stock_ledger` uses a polymorphic reference (`reference_type` + `reference_id`) to link back to the originating Receipt/Delivery/Transfer/Adjustment.
- All stock-changing operations execute as atomic transactions (Rule 8 in Development Rules).

**UI/UX decisions:**
- Palette, typography (Inter), and component library defined in the Design System document.
- Status colors standardized: green = done, amber = warning/pending, red = error/canceled/out-of-stock, blue = informational/active.

**Authentication decisions:**
- Two roles for MVP: Inventory Manager and Warehouse Staff.
- No multi-step approval hierarchy in MVP; both roles can create and validate transactions (documented as an assumption in the PRD).

**Inventory business rules:**
- See the 8 Critical Inventory Rules in the Development Rules document (receipt increases stock, delivery decreases stock, transfer moves stock without changing total, adjustment applies recorded-vs-physical delta, every change is ledgered, delivery cannot exceed available stock, canceled transactions don't alter stock, all changes are atomic).

## 6. Known Issues

| Issue | Impact | Priority | Status | Resolution |
|---|---|---|---|---|
| *(none yet — populate as issues are found during development)* | — | — | — | — |

## 7. Project Context

StockSense is a modular inventory management system built to replace manual registers, spreadsheets, and scattered tracking with one centralized, real-time application. It serves two primary users — Inventory Managers and Warehouse Staff — and supports the full inventory lifecycle:

**Product → Receipt (stock increase) → Internal Transfer (location change, total unchanged) → Delivery (stock decrease) → Adjustment (correction) → Stock Ledger (full audit trail) → Dashboard/Alerts (visibility).**

Every stock-changing action must create a Stock Ledger entry, and stock must never be modified outside of a Receipt, Delivery, Transfer, or Adjustment. Multiple warehouses and internal locations are supported, with per-location and total stock tracked in the `inventory` table. The MVP is scoped for a hackathon: full-featured enough to demonstrate the complete lifecycle end-to-end, but without multi-tenancy, approval workflows, or hardware integrations (all deferred to Future Scope).

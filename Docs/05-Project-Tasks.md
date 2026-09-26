# StockSense — Development Task Plan

## PHASE 1 — Project Setup

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| Create GitHub repository | High | — | Repo initialized with README | Not Started |
| Initialize frontend (React + TS) | High | Repo | Running React app | Not Started |
| Initialize backend (Flask) | High | Repo | Running Flask app | Not Started |
| Configure TypeScript | High | Frontend init | `tsconfig.json` set up | Not Started |
| Configure Tailwind CSS | High | Frontend init | Tailwind working in app | Not Started |
| Configure Flask app factory | High | Backend init | App boots with config | Not Started |
| Configure PostgreSQL | High | Backend init | DB connection verified | Not Started |
| Configure environment variables | High | Backend/Frontend init | `.env` files + loader | Not Started |
| Create database connection | High | PostgreSQL config | ORM connected | Not Started |
| Create base folder structure | High | Frontend/Backend init | Folders per Architecture doc | Not Started |
| Configure API client | Medium | Frontend init | Axios/fetch wrapper with base URL | Not Started |
| Create base UI components | Medium | Tailwind config | Button, Input, Card components | Not Started |
| Create application layout | Medium | Base UI components | Shell with sidebar + top nav | Not Started |
| Create sidebar/navigation | Medium | App layout | Working navigation links | Not Started |
| Set up Git workflow | Medium | Repo | Branching convention documented | Not Started |

**Deliverable:** Running frontend + backend + database connection.

## PHASE 2 — Authentication

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| User registration | High | Phase 1 | Signup endpoint + form | Not Started |
| Login | High | User registration | Login endpoint + form | Not Started |
| JWT authentication | High | Login | Token issued and verified | Not Started |
| Protected routes | High | JWT auth | Frontend route guards | Not Started |
| Logout | Medium | JWT auth | Session cleared client-side | Not Started |
| OTP generation | Medium | Login | OTP email sent | Not Started |
| OTP verification | Medium | OTP generation | Password reset completes | Not Started |
| Password reset | Medium | OTP verification | New password saved | Not Started |
| User session handling | Medium | JWT auth | Token refresh/expiry handled | Not Started |
| Authentication error states | Low | Login/Signup | Clear inline error messages | Not Started |

**Deliverable:** Complete working authentication flow.

## PHASE 3 — Notes Management

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| Create note | Medium | Phase 2 | Note creation endpoint + form | Not Started |
| Edit note | Medium | Create note | Note update flow | Not Started |
| Delete note | Medium | Create note | Note removal flow | Not Started |
| View notes | Medium | Create note | Notes list view | Not Started |
| Search notes | Low | View notes | Search-as-you-type on notes | Not Started |
| Pin important notes | Low | View notes | Pinned notes sorted to top | Not Started |
| Add timestamp | Low | Create note | Created/updated time shown | Not Started |
| Associate note with entity | Medium | Create note | Link note to product/warehouse/doc | Not Started |

**Deliverable:** Working Notes module integrated into the application (does not interfere with core inventory workflows).

## PHASE 4 — Product Management

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| Product CRUD | High | Phase 2 | Create/read/update product | Not Started |
| Category management | High | Product CRUD | Create/list categories | Not Started |
| SKU generation/validation | High | Product CRUD | Unique SKU enforced | Not Started |
| Unit of measure | Medium | Product CRUD | UoM field on product | Not Started |
| Initial stock | High | Product CRUD | Inventory row created on product creation | Not Started |
| Stock availability | High | Initial stock | Stock by location visible | Not Started |
| Product search | Medium | Product CRUD | Search by name/SKU | Not Started |
| Filters | Medium | Product CRUD | Filter by category/warehouse/status | Not Started |
| Reorder threshold | Medium | Product CRUD | Threshold field + validation | Not Started |

**Deliverable:** Full product catalog with searchable, filterable inventory visibility.

## PHASE 5 — Inventory Operations

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| Receipt creation | High | Phase 4 | Draft receipt with items | Not Started |
| Receipt item management | High | Receipt creation | Add/edit/remove line items | Not Started |
| Receipt validation | High | Receipt creation | Validate action available | Not Started |
| Stock increase | High | Receipt validation | Inventory updated on validate | Not Started |
| Delivery creation | High | Phase 4 | Draft delivery with items | Not Started |
| Picking | Medium | Delivery creation | Pick status toggle | Not Started |
| Packing | Medium | Picking | Pack status toggle | Not Started |
| Delivery validation | High | Delivery creation | Validate action available | Not Started |
| Stock decrease | High | Delivery validation | Inventory updated on validate | Not Started |
| Internal transfers | High | Stock increase/decrease logic | Transfer create + validate | Not Started |
| Location stock updates | High | Internal transfers | Source/destination updated atomically | Not Started |
| Stock adjustments | High | Stock increase/decrease logic | Adjustment create + apply | Not Started |
| Stock ledger | High | All of the above | Ledger entry per stock change | Not Started |

**Deliverable:** Complete inventory lifecycle functioning end-to-end.

## PHASE 6 — Dashboard

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| KPI cards | High | Phase 5 | Cards render live data | Not Started |
| Total stock | High | KPI cards | Correct aggregate value | Not Started |
| Low-stock items | High | KPI cards | Count matches threshold logic | Not Started |
| Out-of-stock items | High | KPI cards | Count matches zero-stock products | Not Started |
| Pending receipts | Medium | KPI cards | Count of non-Done receipts | Not Started |
| Pending deliveries | Medium | KPI cards | Count of non-Done deliveries | Not Started |
| Scheduled transfers | Medium | KPI cards | Count of non-Done transfers | Not Started |
| Recent stock movements | Medium | Stock ledger | Feed of latest ledger entries | Not Started |
| Filters | Medium | KPI cards | Type/status/warehouse/category filters | Not Started |
| Warehouse/location filtering | Low | Filters | Dashboard scoped by location | Not Started |
| Category filtering | Low | Filters | Dashboard scoped by category | Not Started |

**Deliverable:** Fully functional real-time dashboard.

## PHASE 7 — Polish & Demo

| Task | Priority | Dependency | Expected Output | Status |
|---|---|---|---|---|
| Responsive design | High | All prior phases | Usable on tablet/desktop | Not Started |
| Loading states | High | All prior phases | Skeletons on all data views | Not Started |
| Error handling | High | All prior phases | Friendly error messages | Not Started |
| Empty states | Medium | All prior phases | Empty-state UI on all lists | Not Started |
| Toast notifications | Medium | All prior phases | Success/error toasts on actions | Not Started |
| Form validation | High | All prior phases | Inline validation on all forms | Not Started |
| Demo data | High | All prior phases | Seed script with realistic data | Not Started |
| Performance improvements | Low | All prior phases | Fast list/dashboard loads | Not Started |
| Final UI polish | Medium | All prior phases | Consistent spacing/typography | Not Started |
| Bug fixing | High | All prior phases | Known issues resolved | Not Started |
| Hackathon demo preparation | High | All prior phases | Rehearsed demo script | Not Started |

**Deliverable:** Demo-ready, polished prototype.

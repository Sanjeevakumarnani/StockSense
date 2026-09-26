# StockSense — Design System

## 1. Design Principles

The StockSense interface should be:

- **Clean** — minimal visual noise, generous whitespace, no unnecessary decoration.
- **Professional** — feels like a serious business tool, not a consumer app.
- **Modern** — current SaaS visual conventions (cards, soft shadows, rounded corners, clear typography hierarchy).
- **Fast** — lightweight components, minimal load on data-heavy screens.
- **Data-focused** — the dashboard and tables prioritize numbers and status over illustration.
- **Easy for warehouse staff** — large touch targets, simple forms, minimal steps to complete a transaction on a shared or mobile device.
- **Easy to scan** — clear visual hierarchy in tables and cards so key numbers (stock, status) stand out immediately.
- **Responsive** — usable from a warehouse tablet up to a manager's desktop monitor.
- **Consistent** — the same component looks and behaves the same way everywhere in the app.
- **Accessible** — sufficient color contrast, keyboard-navigable forms, status conveyed by icon + color + text (not color alone).

## 2. Design Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#2563EB` | Primary actions, links, active states |
| Secondary | `#0EA5A4` | Secondary actions, accents |
| Background | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards, panels, tables |
| Text | `#0F172A` | Primary text |
| Muted Text | `#64748B` | Secondary/helper text, captions |
| Border | `#E2E8F0` | Dividers, input borders, table lines |
| Success | `#16A34A` | Completed/validated states |
| Warning | `#D97706` | Low stock, pending/waiting states |
| Error | `#DC2626` | Out of stock, canceled, validation errors |
| Info | `#2563EB` | Informational badges, active/in-progress states |

**Status color usage:**
- Green → completed/validated/done.
- Yellow/Amber → warning, low stock, pending/waiting/draft.
- Red → error, out of stock, canceled.
- Blue → informational, active/in-progress.

## 3. Typography

**Font:** Inter (fallback: system-ui, sans-serif).

| Style | Size | Weight |
|---|---|---|
| H1 | 28px | 700 |
| H2 | 22px | 600 |
| H3 | 18px | 600 |
| Body | 14px | 400 |
| Caption | 12px | 400 |
| Button | 14px | 600 |
| Table text | 13px | 400 (header: 600) |

## 4. UI Components

| Component | Purpose | States | Usage | Interaction |
|---|---|---|---|---|
| Sidebar | Primary navigation between modules | default, active item, collapsed | Persistent on desktop, collapsible on tablet | Click to navigate; active item highlighted with primary color |
| Top Navigation | Search, user menu, notifications | default, search focused | Global search + profile access | Click avatar opens profile/logout menu |
| Dashboard KPI Card | Show one key metric | default, loading skeleton | Dashboard summary row | Click navigates to filtered list (e.g., low stock → product list) |
| Buttons | Trigger actions | default, hover, disabled, loading | Primary (filled), secondary (outline), destructive (red) | Loading spinner replaces label during async action |
| Inputs | Text/number entry | default, focused, error, disabled | Forms across all modules | Inline validation message below field |
| Search Bar | Filter by text (SKU/product/note) | default, active, no results | Top of list pages | Debounced search-as-you-type |
| Dropdown | Select from options (category, warehouse, status) | default, open, selected | Filters and forms | Keyboard navigable |
| Date Picker | Select a date/range | default, open | Filtering ledger/dashboard by date | Calendar popover |
| Status Badge | Show document/item status | draft, waiting, ready, done, canceled | Tables, detail headers | Color + label, non-interactive |
| Data Table | List records with sorting/pagination | default, loading, empty, error | Products, receipts, deliveries, ledger, etc. | Sortable columns, row click opens detail |
| Modal | Focused task or confirmation | open, closing | Create/edit forms, confirmations | Escape/backdrop click closes (with unsaved-changes guard) |
| Drawer | Side panel for detail/quick edit | open, closing | Quick view of a product/document without leaving the list | Slides in from the right |
| Toast | Brief system feedback | success, error, info | After create/update/validate actions | Auto-dismiss after a few seconds |
| Alert | Persistent inline warning | warning, error, info | Low-stock banner, validation summary | Dismissible where appropriate |
| Tabs | Switch between related views | default, active | Product detail (Overview / Stock by Location / History) | Click to switch, underline indicates active |
| Breadcrumb | Show navigation path | default | Detail pages | Click to navigate up |
| Pagination | Navigate large lists | default, disabled ends | All list/table views | Click page number or next/prev |
| Empty State | Explain no data present | default | Empty tables, no search results | Icon + message + primary action (e.g., "Create Product") |
| Loading Skeleton | Indicate content loading | loading | Tables, KPI cards, detail pages | Animated placeholder shapes |
| Confirmation Dialog | Confirm destructive/critical actions | default | Validate, delete, cancel actions | Requires explicit confirm click |
| Product Card | Compact product summary | default, low-stock, out-of-stock | Product grid view (optional alt to table) | Click opens product detail |
| Inventory Status Indicator | Visual stock health cue | in-stock, low-stock, out-of-stock | Product rows/cards, dashboard | Color dot/icon + label |
| Stock Movement Timeline | Chronological history for a product/location | default, loading, empty | Product detail, Stock Ledger detail view | Scrollable vertical timeline |

## 5. Main Screens

1. **Login** — Email/password fields, "Forgot password?" link, primary Login button, link to Signup.
2. **Signup** — Name, email, password, role selector, primary Create Account button.
3. **OTP Password Reset** — Step 1: enter email; Step 2: enter OTP + new password; success confirmation.
4. **Dashboard** — KPI cards row, filter bar (document type, status, warehouse, category), recent stock movements table, low-stock alert banner.
5. **Products** — Data table with search bar, category/warehouse filters, "Add Product" button, stock status indicator per row.
6. **Product Details** — Tabs: Overview (fields), Stock by Location, Movement History (timeline).
7. **Create Product** — Form with all product fields, reorder threshold, initial stock and location.
8. **Receipts** — Data table filtered by status, "Create Receipt" button, status badges.
9. **Create Receipt** — Supplier dropdown, destination location, line items table (product, expected qty, received qty), Validate button.
10. **Deliveries** — Data table filtered by status, "Create Delivery" button.
11. **Create Delivery** — Source location, line items table, Pick/Pack toggle steps, Validate button.
12. **Internal Transfers** — Data table of transfers, "Create Transfer" button.
13. **Stock Adjustments** — Data table of adjustments, "New Adjustment" button, recorded vs physical vs difference columns.
14. **Stock Ledger** — Filterable, sortable table (product, operation type, date range, location), exportable view.
15. **Warehouses** — List of warehouses, expandable to show internal locations, "Add Warehouse"/"Add Location" actions.
16. **Settings** — Category management, reorder threshold defaults, general app configuration.
17. **Profile** — User info, role, change password, logout button.

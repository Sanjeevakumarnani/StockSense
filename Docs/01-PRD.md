# StockSense — Product Requirements Document

## 1. Product Overview

StockSense is a modular, web-based inventory management system designed to replace manual registers, Excel sheets, and other scattered stock-tracking methods with a single, centralized, real-time platform.

It gives businesses one place to record every stock movement — goods coming in, goods going out, stock moving between locations, and corrections after physical counts — so that the recorded stock always reflects the physical stock.

StockSense solves the core problem of **fragmented, delayed, and error-prone inventory data** by:

- Centralizing all inventory operations (receipts, deliveries, transfers, adjustments) in one application.
- Updating stock quantities in real time as soon as a transaction is validated.
- Recording every stock-changing action in a single, traceable **Stock Ledger**, so any quantity can be explained by looking at its history.
- Giving Inventory Managers and Warehouse Staff role-appropriate views and actions, reducing manual double-entry and communication overhead.

**Assumption:** StockSense is built as a single-tenant application for one business (with multiple warehouses/locations), not a multi-company SaaS platform, since the problem statement does not require multi-tenancy for the MVP.

## 2. Problem Statement

Businesses that rely on manual registers, spreadsheets, or scattered tools face recurring operational problems:

- **Manual registers** are slow to update, easy to lose, and impossible to search or audit quickly.
- **Excel-based tracking** breaks down with multiple users editing simultaneously, has no built-in validation, and does not scale across warehouses.
- **Scattered stock information** (different sheets, notebooks, or verbal updates) means no one has a single source of truth.
- **Incoming and outgoing stock** are hard to track consistently, causing delays in confirming what has actually arrived or been shipped.
- **Lack of real-time visibility** means decisions (reordering, fulfilling orders) are made on stale data.
- **Low-stock items** are often discovered only when a customer or production line is already blocked, since there is no systematic alerting.
- **Stock movement between warehouses/locations** is difficult to track, so "where is it right now" becomes guesswork.
- **Mismatches between recorded and physical stock** accumulate over time and are only discovered during infrequent, disruptive manual counts.
- **No centralized movement history** makes it hard to answer "what happened to this stock" during audits, disputes, or investigations.

## 3. Goals

| # | Goal |
|---|------|
| G1 | Centralize all inventory data in a single system of record. |
| G2 | Provide real-time visibility into stock levels across all locations. |
| G3 | Simplify and standardize incoming stock (receipt) operations. |
| G4 | Simplify and standardize outgoing stock (delivery) operations. |
| G5 | Track stock movement across warehouses and internal locations. |
| G6 | Reduce manual, paper- or spreadsheet-based inventory management. |
| G7 | Proactively surface low-stock and out-of-stock situations. |
| G8 | Maintain a complete, auditable Stock Ledger for every stock-changing event. |
| G9 | Support multiple warehouses and internal locations (racks, floors, zones). |
| G10 | Make day-to-day operations easy for both Inventory Managers and Warehouse Staff. |

## 4. Target Users

### Inventory Manager

**Responsibilities:**
- Owns overall stock accuracy and availability.
- Sets up products, categories, and reorder rules.
- Reviews and validates receipts, deliveries, transfers, and adjustments.
- Monitors dashboard KPIs and responds to low-stock alerts.
- Investigates discrepancies using the Stock Ledger.

**Goals:**
- Always know current stock levels and locations.
- Avoid stockouts and overstocking.
- Ensure every stock movement is documented and explainable.

**Major actions:** Create/update products, configure warehouses and locations, create and validate receipts/deliveries/transfers, review dashboard, review stock ledger, manage reorder thresholds.

**Interaction with the system:** Primarily uses the Dashboard, Product Management, Stock Ledger, and validation steps of Receipts/Deliveries/Transfers/Adjustments. Has full read access and validation/approval permissions.

### Warehouse Staff

**Responsibilities:**
- Executes physical stock movements: receiving, picking, packing, shelving, transferring, and counting.
- Enters actual received/picked/counted quantities into the system.
- Flags discrepancies for adjustment.

**Goals:**
- Quickly find products and locations.
- Record movements with minimal friction, ideally on the shop floor.
- Avoid manual paperwork duplication.

**Major actions:** Create receipts/deliveries/transfers/adjustments (draft stage), enter quantities, mark items as picked/packed, submit for validation, search products by SKU.

**Interaction with the system:** Primarily uses Receipts, Deliveries, Internal Transfers, Stock Adjustments, and SKU Search. Typically has limited or no access to configuration screens (categories, warehouse setup).

**Assumption:** Both roles can create and validate transactions in the MVP (no separate approval workflow beyond "Draft → Validated"), since a full role-based approval chain is out of scope for a hackathon MVP.

## 5. Core Features — MVP

### 5.1 Authentication

- **Sign up:** Name, email, password, role (Inventory Manager / Warehouse Staff).
- **Login:** Email + password, returns a session token (JWT).
- **Logout:** Invalidates the client-side session.
- **OTP-based password reset:** User requests reset → system emails a one-time code → user enters code + new password → password updated.
- After successful login, the user is redirected to the **Inventory Dashboard**.

### 5.2 Dashboard

**KPIs:**
- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Scheduled Internal Transfers

**Filters:**
- Document Type: Receipts / Delivery / Internal / Adjustments
- Status: Draft / Waiting / Ready / Done / Canceled
- Warehouse / Location
- Product Category

The dashboard also shows a **Recent Stock Movements** feed pulled from the Stock Ledger.

### 5.3 Product Management

**Fields:** Product Name, SKU/Code, Category, Unit of Measure, Initial Stock, Current Stock, Location.

**Functions:**
- Create / update / view product.
- Search product (by name or SKU).
- Filter products (by category, warehouse, stock status).
- View stock availability by location.
- Configure reordering rules (low-stock threshold per product).

### 5.4 Receipts — Incoming Goods

**Workflow:** Create Receipt → Select Supplier → Add Products → Enter Received Quantity → Validate → Increase Stock → Record Ledger Entry.

**Example:** Receiving 50 units of Steel Rods increases Steel Rod stock by 50 at the destination location, and a ledger entry is created showing the previous stock, the +50 movement, and the updated stock.

### 5.5 Delivery Orders — Outgoing Goods

**Workflow:** Create Delivery → Select Items → Pick → Pack → Validate → Decrease Stock → Record Ledger Entry.

**Example:** Delivering 10 chairs decreases chair stock by 10 at the source location, and a ledger entry records the movement.

### 5.6 Internal Transfers

**Supported transfer types:**
- Warehouse → Warehouse
- Warehouse → Production Floor
- Rack → Rack
- Location → Location

**Workflow:** Create Transfer → Select Source → Select Destination → Select Product → Enter Quantity → Validate → Update Locations → Record Ledger Entry.

**Key rule:** Total company-wide stock of the product **does not change** during an internal transfer — only the quantity recorded at the source location and the destination location changes.

### 5.7 Stock Adjustments

**Workflow:** Select Product/Location → Enter Physical Count → Compare to Recorded Stock → Calculate Difference → Update Stock → Record Adjustment.

**Example:** Recorded stock = 100, Physical count = 97 → Adjustment = −3. The system reduces recorded stock by 3 and logs the adjustment with a reason.

### 5.8 Stock Ledger

Every stock-changing operation (Receipt, Delivery, Transfer, Adjustment) creates an immutable ledger entry containing:

- Date/time
- Product
- SKU
- Operation Type (Receipt / Delivery / Transfer / Adjustment)
- Source Location
- Destination Location
- Quantity
- Previous Stock
- Updated Stock
- Reference/Document ID
- User

### 5.9 Warehouse / Location Management

Supports multiple warehouses, each containing multiple internal locations (e.g., racks, zones, floors). Products track stock per location, and total stock is the sum across all locations.

### 5.10 Alerts

- **Low-stock alert:** Triggered when current stock at a location (or in total) falls below the configured reorder threshold.
- **Out-of-stock indication:** Triggered when current stock reaches zero.

### 5.11 Search & Smart Filters

- SKU search
- Product name search
- Category filter
- Warehouse filter
- Location filter
- Status filter (Draft / Waiting / Ready / Done / Canceled)
- Operation/document type filter

### 5.12 Notes Management (supporting feature)

A lightweight notes module allowing users to record operational notes, optionally linked to a product, warehouse, location, receipt, delivery, transfer, or adjustment. Supports create, edit, delete, view, search, pin, and timestamping. This is a productivity aid and does not affect core inventory calculations.

## 6. MVP vs Future Scope

| Feature | MVP | Future Enhancement |
|---|---|---|
| Authentication (signup/login/logout) | ✅ | Multi-factor authentication, SSO |
| OTP password reset | ✅ | Self-service account recovery via security questions |
| Inventory Dashboard with KPIs & filters | ✅ | Customizable/drag-and-drop dashboard widgets |
| Product management (CRUD, search, filter) | ✅ | Bulk import/export, barcode/QR generation |
| Reordering rules (low-stock threshold) | ✅ | Automated purchase order generation |
| Receipts (incoming stock) | ✅ | Vendor portal, partial receipt tracking with backorders |
| Delivery orders (outgoing stock) | ✅ | Route/shipment tracking, carrier integration |
| Internal transfers | ✅ | Transfer approval workflows, in-transit status |
| Stock adjustments | ✅ | Cycle counting schedules, photo evidence attachment |
| Stock ledger | ✅ | Advanced analytics, exportable audit reports |
| Warehouse/location management | ✅ | Location capacity planning, bin-level 3D mapping |
| Low-stock / out-of-stock alerts | ✅ | SMS/push notifications, predictive stock-out forecasting |
| SKU search & smart filters | ✅ | Full-text/fuzzy search, saved filter presets |
| Notes management | ✅ | Notes with file attachments, @mentions, notifications |
| Multi-tenant support | ❌ | Full multi-company SaaS mode |
| Approval workflows / role hierarchy | ❌ | Configurable multi-step approvals |
| Supplier/vendor performance analytics | ❌ | Supplier scorecards, lead-time analytics |
| Barcode scanning hardware integration | ❌ | Mobile scanner app integration |

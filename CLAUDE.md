# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A MERN-stack Point-of-Sale (POS) system for a retail store: product/inventory management, barcode-driven sales, invoicing with PDF receipts, and reporting. "Static Admin" refers to the admin panel being gated by hardcoded credentials (see Auth below) rather than a database-backed admin role.

## Commands

Run each service directly (requires a MongoDB reachable at `Backend/.env`'s `MONGO_URI`, currently `mongodb://localhost:27017/posfull`):

```bash
# Backend (needs Backend/.env with MONGO_URI, JWT_SECRET, PORT)
cd Backend && npm start          # nodemon server.js (auto-reload) → :5000
cd Backend && npm run dev        # node server.js (no reload)

# Frontend
cd Frontend && npm run dev       # vite --host → :5173
cd Frontend && npm run build     # production build
cd Frontend && npm run lint      # eslint
```

This project does not use Docker (the Dockerfiles/compose were removed) — run it with local Node + a local MongoDB. There is **no test suite** — do not assume one exists.

## Architecture

### Backend (`Backend/`) — Express + Mongoose

Entry point `server.js` mounts five route modules, each backed by one Mongoose model:

| Mount | Route file | Model | Purpose |
|-------|-----------|-------|---------|
| `/api/product` | `productRoute.js` | `Product` | products, expiry, low-stock, stats |
| `/api/invoice` | `invoiceRoute.js` | `Invoice` | sales, sales/profit stats, date-range reports |
| `/api/category` | `categoryRoute.js` | `Category` | product categories |
| `/api/auth` | `loginRoute.js` | `Login` | register/login/user management |
| `/api/detail` | `detailRoute.js` | `Detail` | single store-profile record (name/logo/contact) |

**Key domain logic to be aware of:**
- **Stock is coupled to invoices.** Creating an invoice (`POST /api/invoice/addinvoice`) validates stock then decrements `Product.Quantity`; updating restores old quantities before re-applying new ones; deleting restores stock. Any change to invoice items must keep this stock accounting consistent.
- **Auto-increment IDs** (`categoryId`, `invoiceNo`) are generated in Mongoose `pre("save")` hooks by querying the current max — not atomic, races possible under concurrency.
- **Profit** is computed server-side in the `Invoice` `pre("save")` hook: `(RetailPrice - CostPrice) * Quantity` per item, summed into `totalProfit`. Don't compute it client-side.
- Invoice **items are embedded** (denormalized snapshots of product data), so historical invoices are unaffected by later product edits. Note invoice create/delete matches products by `Probarcode` but update matches by `ProductName` — a known inconsistency.

**File uploads:** Multer saves to disk, not GridFS. Product images → `Backend/uploads/` (served at `/uploads`); store logo → `Backend/StoreDetail/` (served at `/StoreDetail`). Both dirs plus `.env` are gitignored.

### Auth (two separate, unrelated systems)

1. **User auth** — JWT (`process.env.JWT_SECRET`, 1h expiry) issued on login, stored in `localStorage` as `token`. `authMiddleware.js` protects select routes. Users have a `status` of `pending`/`active`/`disabled`; only `active` users can log in — status is set by the admin panel.
2. **Admin panel** — credentials are **hardcoded in the frontend** (`Frontend/src/components/Admin/AdminLogin.jsx`: `admin`/`admin123`), setting `localStorage.admin-token = "static-token"`. This gates `/admin-dashboard` and `/detail` client-side only. The admin's user-management endpoints (`/api/auth/getusers`, `/api/auth/updateStatus`) are **not** protected by the backend.

### Frontend (`Frontend/src/`) — React 19 + Vite + React Router 7

- `App.jsx` is the root: defines all routes, the global keyboard-shortcut handler, and a route-change `Loader`. Public routes (`/login`, `/register`, `/admin`) sit outside `ProtectedRoute`; the app shell (`Layout` with `Sidebar`) wraps private routes.
- Route protection: `ProtectedRoute` checks `localStorage.token`; `AdminProtectedRoute` checks `localStorage.admin-token`.
- **Structure convention:** top-level views live in `Pages/` (Dashboard, NewSale, Invoice, Product, Category, etc.); reusable/shell pieces in `components/`. Each component/page has a co-located `.css` file (or a file in `Styles/`); there is no CSS framework or module system — plain global CSS.
- **Keyboard-driven UX** is central: global shortcuts in `App.jsx` (Shift+N new sale, Shift+D dashboard, Alt+C calculator, Ctrl+L logout, etc.); `NewSale` is barcode-scanner oriented (auto-focused barcode input, F-key handlers). Preserve these when editing.
- PDF receipts/reports are generated client-side with `jspdf` + `jspdf-autotable`.
- Data tables use `react-data-table-component`.

### Critical gotcha: hardcoded API base URL

Every frontend API call hardcodes `http://localhost:5000` (~16 files, e.g. `http://localhost:5000/api/product/getproducts`, `http://localhost:5000/uploads/${ProImage}`). There is **no axios instance, no env var, no proxy**. Changing the backend host/port means find-and-replacing every occurrence across `Frontend/src`. When adding API calls, follow the existing absolute-URL pattern.

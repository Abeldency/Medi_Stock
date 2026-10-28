# MediStock — Pharmacy Management System

A polished full-stack pharmacy inventory project built with React, Bootstrap, Node.js, Express and MongoDB.

## Features
- Responsive dashboard with medicine count, total units, inventory value, low-stock count, expiry-soon and expired counts.
- Full medicine CRUD: add, view, edit and delete.
- Search by medicine ID, name, manufacturer or batch number.
- Medicine categories, batch number, optional expiry date and configurable low-stock threshold.
- Stock receipt and sale actions with whole-number validation and protection against overselling.
- Low-stock and expiry indicators, category/status filters and CSV export of the currently visible results.
- API validation, duplicate medicine ID protection, safer search matching, consistent JSON errors and atomic stock updates.

## Requirements
- Node.js LTS and npm
- MongoDB Community Server running locally, or a MongoDB Atlas URI
- VS Code

## Setup

### Backend
1. Open a terminal in `backend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Ensure `MONGODB_URI` points to your running MongoDB server. Default local URI: `mongodb://127.0.0.1:27017/medistock`.
5. Run `npm run dev` and keep the terminal open.

The backend runs at `http://localhost:5000`. Test `http://localhost:5000/api/health`.

### Frontend
1. Open a second terminal in `frontend`.
2. Run `npm install` (only required once).
3. Run `npm run dev`.
4. Open the Vite URL shown, normally `http://localhost:5173`.

Keep MongoDB, backend and frontend running while using the application.

## API routes
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health and database status |
| GET | `/api/medicines` | List medicines; optional `?search=term` |
| GET | `/api/medicines/:id` | Get one medicine by MongoDB document ID |
| POST | `/api/medicines` | Create medicine |
| PUT | `/api/medicines/:id` | Update medicine details |
| PATCH | `/api/medicines/:id/stock` | Receive stock or record a sale |
| DELETE | `/api/medicines/:id` | Delete medicine record |
| GET | `/api/dashboard` | Dashboard statistics |

## Notes
- Existing medicine documents remain compatible; new fields default to General category, empty batch number and no expiry date.
- Expiry dates are optional. Add real expiry details where available; the app does not assume a missing expiry date is safe.
- This is an educational inventory project. Before real-world pharmacy use, add authentication and role-based permissions, audit trails for stock movements, backups, access controls and appropriate operational/compliance review.

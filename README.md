# Device Purchase Contract

Monorepo with separate **frontend** (React + Vite) and **backend** (Express + Prisma + PostgreSQL).

## Project layout

```text
purchase_dashboard/
├── backend/          # API, database, PDF generation, uploads
├── frontend/         # React UI (Vite dev server on port 5173)
├── package.json      # Root scripts to run either app
└── README.md
```

## Quick start

### 1. Backend

```powershell
cd backend
Copy-Item .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, shop fields, CORS_ORIGINS
npm install
npm run prisma:generate
npm run db:setup
npm run dev
```

API runs at `http://localhost:4000` by default.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
# Set VITE_API_BASE_URL to your backend URL (e.g. http://localhost:4000)
npm install
npm run dev
```

UI runs at `http://localhost:5173` by default.

### From the repo root

```powershell
npm run install:all
npm run dev:backend    # terminal 1
npm run dev:frontend   # terminal 2
```

## API overview

See [backend/README.md](backend/README.md) for endpoints, upload fields, and completion rules.

## Environment

| App | File | Key variables |
|-----|------|----------------|
| Backend | `backend/.env` | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGINS` |
| Frontend | `frontend/.env` | `VITE_API_BASE_URL` (backend URL) |

CORS on the backend must include your frontend origin (default includes `http://localhost:5173`).

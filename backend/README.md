# Device Purchase Contract Backend

Backend API for the Device Purchase Contract Management System. It implements open sign-up/login, JWT-protected contract workflows, PostgreSQL/Prisma persistence, image/signature uploads, PDF generation, search, and dashboard metrics.

## Setup

Run all commands from the `backend/` directory (or use `npm run <script> --prefix backend` from the repo root).

1. In **pgAdmin**, create a PostgreSQL database (any name you prefer).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your pgAdmin connection, for example:
   ```text
   postgresql://postgres:yourpassword@localhost:5432/your_database?schema=public
   ```
   Also set `JWT_SECRET`, shop fields, and `CORS_ORIGINS` as needed.
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Generate Prisma client and apply migrations:
   ```powershell
   npm run prisma:generate
   npm run prisma:migrate:dev
   ```
5. Seed a local development admin user (safe for dev only):
   ```powershell
   npm run seed
   ```
   Default dev credentials:
   - Email: `admin@example.com`
   - Password: `Admin123456`
   - Role: `admin`
6. Start the server:
   ```powershell
   npm run dev
   ```
   On startup you should see `[db] Connected to PostgreSQL` and `[db] Target: host:port/database`.
   Run `npm run seed` and `npm run dev` from the **same** `backend/` folder so they use the same `DATABASE_URL`.

For production deployments, use `npm run prisma:migrate` instead of `prisma:migrate:dev`, and do **not** rely on the dev seed password.

## Main API

All endpoints except auth and health require `Authorization: Bearer <token>`.

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/contracts/draft`
- `PATCH /api/contracts/:id/draft`
- `GET /api/contracts/:id`
- `POST /api/contracts/:id/files`
- `POST /api/contracts/:id/signature`
- `POST /api/contracts/:id/complete`
- `POST /api/contracts/:id/cancel`
- `GET /api/contracts/:id/pdf`
- `GET /api/contracts/:id/pdf/download`
- `GET /api/contracts/search`
- `GET /api/dashboard`
- `GET /api/settings`

## Upload Fields

`POST /api/contracts/:id/files` is `multipart/form-data`:
- `fileType`: `id_front`, `id_back`, `device_front`, `device_back`, `imei_photo`, `damage_photo`, `accessories_photo`, or `other`
- `file`: PNG or SVG document/device image

`POST /api/contracts/:id/signature` is `multipart/form-data`:
- `signature`: PNG image
- Optional `role`: `customer` or `shopkeeper`

Required before completion:
- `id_front`
- `device_front`
- `device_back`
- `imei_photo`
- `signature.png`

## Completion Rules

Drafts can be incomplete. Completion requires full customer/device data, positive purchase price, at least one of IMEI or serial number, all ownership and lock confirmation fields set to `true`, required uploads, and signature.

Completed contracts generate:

```text
storage/contracts/YYYY-0001/contract.pdf
```

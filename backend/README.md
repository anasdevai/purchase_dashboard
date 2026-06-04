# Device Purchase Contract Backend

Backend API for the Device Purchase Contract Management System. It implements open sign-up/login, JWT-protected contract workflows, PostgreSQL/Prisma persistence, image/signature uploads, PDF generation, search, and dashboard metrics.

## Setup

Run all commands from the `backend/` directory (or use `npm run <script> --prefix backend` from the repo root).

1. Start PostgreSQL (this project expects port **5433** on a default PostgreSQL 18 install). In an elevated PowerShell:
   ```powershell
   Start-Service postgresql-x64-18
   ```
2. Create the database and apply migrations:
   ```powershell
   npm.cmd run db:setup
   ```
   Or create `purchase_dashboard` manually in pgAdmin (`scripts/create-database.sql`) then run `npm.cmd run prisma:migrate`.
3. Copy `.env.example` to `.env` and fill `DATABASE_URL`, `JWT_SECRET`, shop fields, etc.
4. Install dependencies:
   ```powershell
   npm.cmd install
   ```
5. Generate Prisma client (if not already done):
   ```powershell
   npm.cmd run prisma:generate
   ```
6. Start development server:
   ```powershell
   npm.cmd run dev
   ```

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

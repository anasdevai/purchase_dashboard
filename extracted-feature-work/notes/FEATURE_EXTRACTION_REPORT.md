# Feature Extraction Report

**Project:** purchase_dashboard  
**Extraction date:** 2026-06-18  
**Location:** `extracted-feature-work/` (copies only — original project unchanged)

---

## Summary

| Feature area | Full file copies | Partial extracts | Primary migrations |
|--------------|------------------|------------------|------------------|
| QR code / mobile signature | 5 | 11 | `20260617110824_add_signature_token` |
| Extra fields | 14 | 8 | `20260617104814`, `20260617105529`, `20260617110132` |
| Email (PDF send) | 2 | 12 | None (uses existing `customer_email` columns) |

---

## 1. QR Code Feature

### Files found

| File | Type | What it does |
|------|------|--------------|
| `backend/src/utils/lanIp.ts` | Full copy | Discovers LAN IP; builds mobile signature URL for QR (replaces localhost) |
| `backend/src/utils/cors.ts` | Partial | Allows LAN frontend origins so phones can POST signatures |
| `backend/src/controllers/contractController.ts` | Partial | `enrichContract` adds `qrUrl`; QR generate/status/public signature handlers |
| `backend/src/services/contractService.ts` | Partial | Token generation, status polling, public contract lookup |
| `backend/src/services/fileService.ts` | Partial | `saveSignatureByToken` — saves PNG + sets `signatureStatus: SIGNED` |
| `backend/src/routes/contractRoutes.ts` | Partial | Public + authenticated signature routes |
| `backend/prisma/migrations/20260617110824_add_signature_token/` | Full copy | Adds `signature_token`, `signature_status`, index |
| `backend/scripts/submitMockSignature.ts` | Full copy | Dev script to POST mock signature to public endpoint |
| `backend/scripts/testCors.ts` | Full copy | Dev script to test CORS on public signature route |
| `frontend/src/pages/MobileSignaturePage.tsx` | Full copy | Public mobile page for customer to draw & submit signature |
| `frontend/src/App.tsx` | Partial | Route `/signature/:token` |
| `frontend/src/api/contracts.ts` | Partial | `generateSignatureQr`, `fetchSignatureStatus`, public fetch/submit |
| `frontend/src/components/contract/ContractWizard.tsx` | Partial | QR tab, external QR image, polling, generate button |
| `frontend/src/types/contract.ts` | Partial | `signatureToken`, `signatureStatus`, `qrUrl` |
| `frontend/src/i18n/*` | Partial | QR signature UI strings (EN/DE) |

### Dependencies / packages

| Package | Where | Notes |
|---------|-------|-------|
| **None for QR generation** | UI | Uses external API `api.qrserver.com` — no `qrcode` npm package |
| `react-signature-canvas` | MobileSignaturePage, ContractWizard | Canvas drawing |
| `node:crypto` | contractService | `randomBytes(24)` for tokens |
| `node:os` | lanIp.ts | Network interface discovery |

### Environment variables

- `CORS_ALLOW_LAN` (default `true`) — required for phone browsers on LAN
- `CORS_ORIGINS` — explicit origin whitelist
- `HOST=0.0.0.0` — API reachable from mobile devices

### Database / schema changes

```sql
-- 20260617110824_add_signature_token
ALTER TABLE "contracts" ADD COLUMN "signature_status" TEXT;
ALTER TABLE "contracts" ADD COLUMN "signature_token" TEXT;
CREATE INDEX "contracts_signature_token_idx" ON "contracts"("signature_token");
```

Prisma: `signatureToken`, `signatureStatus` on `Contract` model.

### API routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/contracts/:id/signature-qr` | Yes | Generate token + return `qrUrl` |
| GET | `/api/contracts/:id/signature-status` | Yes | Poll `PENDING` / `SIGNED` |
| GET | `/api/contracts/public/signature/:token` | No | Load draft contract for mobile page |
| POST | `/api/contracts/public/signature/:token` | No | Upload customer signature PNG |

### Frontend pages / components

- `MobileSignaturePage` — public signature capture
- `ContractWizard` — step 4 signature method toggle (onsite vs QR)
- `App.tsx` — public route registration

### PDF / contract document changes

**None for QR codes.** Contract PDFs render signature images only (`contractTemplate.ts`). QR is display-only in the wizard UI.

### Missing / incomplete parts

- No offline/local QR library — depends on `api.qrserver.com` (network required to display QR image)
- No QR embedded in printed/PDF contracts
- `backend/.env.example` does not document LAN/CORS for QR mobile flow (documented in `env.ts` instead)
- Hardcoded dev token in `submitMockSignature.ts` / `testCors.ts`

---

## 2. Extra Fields Feature

### Files found

| File | Type | What it does |
|------|------|--------------|
| `backend/prisma/migrations/20260617104814_add_customer_split_fields/` | Full copy | Salutation, name split, address split, id_type |
| `backend/prisma/migrations/20260617105529_add_device_fields/` | Full copy | OS, iCloud, MDM, warranty, purchase receipt flag |
| `backend/prisma/migrations/20260617110132_add_payment_status_notes/` | Full copy | Contract `payment_status`, `notes` |
| `backend/src/validators/contractValidators.ts` | Full copy | Zod schemas for all new contract fields |
| `backend/src/validators/invoiceValidators.ts` | Full copy | `notes`, `paymentStatus` on invoices |
| `backend/src/services/contractService.ts` | Partial | Derives legacy name/address; maps fields for completion |
| `backend/src/services/invoiceService.ts` | Partial | Persists notes/status; `updateInvoicePaymentStatus` |
| `backend/src/pdf/templates/contractTemplate.ts` | Full copy | PDF layout for split customer, device extras, notes |
| `backend/src/pdf/types.ts` | Full copy | PDF type definitions including new fields |
| `frontend/src/types/contract.ts` | Full copy | ApiContract field types |
| `frontend/src/types/invoice.ts` | Full copy | `InvoicePaymentStatus`, notes |
| `frontend/src/api/contracts.ts` | Full copy | Payload mapping for new contract fields |
| `frontend/src/components/contract/ContractWizard.tsx` | Partial | Form fields for all new contract inputs |
| `frontend/src/components/invoices/InvoicePaymentStatusSelect.tsx` | Full copy | Dropdown for Paid/Open/Cancelled |
| `frontend/src/components/invoices/InvoicePaymentStatusBadge.tsx` | Full copy | Status badge display |
| `frontend/src/components/invoices/invoicePaymentStatusStyles.ts` | Full copy | Color styles per status |
| `frontend/src/pages/InvoiceDetailPage.tsx` | Partial | Notes textarea + payment status in form |
| `frontend/src/pages/InvoicesPage.tsx` | Partial | Inline payment status updates |
| `frontend/src/i18n/*` | Partial | Labels for new fields (EN/DE) |

### Dependencies / packages

- **Zod** — validation (`contractValidators.ts`, `invoiceValidators.ts`)
- No new npm packages specific to extra fields

### Environment variables

None specific to extra fields (uses existing `DATABASE_URL`).

### Database / schema changes

**Customer split** (`20260617104814`):
- `salutation`, `customer_first_name`, `customer_last_name`, `customer_street`, `customer_zip_code`, `customer_city`, `id_type`

**Device fields** (`20260617105529`):
- `os_version`, `icloud_status`, `mdm_status`, `warranty`, `purchase_receipt_available`

**Payment & notes** (`20260617110132`):
- `payment_status`, `notes` on contracts

**Invoice** (existing schema, enhanced UI):
- `payment_status` enum (`Paid`, `Open`, `Cancelled`), `notes` text

### API routes

- Contract create/update/complete — new fields in request body (no separate routes)
- `PATCH /api/invoices/:id/payment-status` — invoice status only
- Invoice save — `notes` + `paymentStatus` in payload

### Frontend pages / components

- `ContractWizard` — steps 0–1 customer/device/purchase fields
- `InvoiceDetailPage` — notes + payment status
- `InvoicesPage` — list-level status changes
- `InvoicePaymentStatusSelect` / `Badge`

### PDF / receipt changes

- **Contract PDF** — split name/address, device metadata rows, payment status row, general notes section
- **Invoice PDF** — notes block when present (via `invoiceTemplate.ts` / pdfService — not fully copied; referenced in types)

### Missing / incomplete parts

- Repair order `technicianNotes` predates these migrations (included in wizard/PDF but not in Jun 2026 migrations)
- `damageNotes` / `internalNotes` are older fields, grouped here as related form/PDF work
- Invoice PDF notes rendering lives in `invoiceTemplate.ts` (not copied as full file)

---

## 3. Email Feature

### Files found

| File | Type | What it does |
|------|------|--------------|
| `backend/src/services/emailService.ts` | Full copy | Nodemailer transport + 3 send functions with German plain-text bodies |
| `backend/src/config/env.ts` | Partial | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM |
| `backend/package.json` | Partial | `nodemailer`, `@types/nodemailer` |
| `backend/src/controllers/contractController.ts` | Partial | `sendEmail` handler |
| `backend/src/controllers/invoiceController.ts` | Partial | `sendEmail` (auto-generates PDF if needed) |
| `backend/src/controllers/repairOrderController.ts` | Partial | `sendEmail` handler |
| `backend/src/routes/contractRoutes.ts` | Partial | `POST /:id/email` |
| `backend/src/routes/invoiceRoutes.ts` | Partial | `POST /:id/email` |
| `backend/src/routes/repairOrderRoutes.ts` | Partial | `POST /:id/email` |
| `backend/scripts/checkInvoiceEmail.mjs` | Full copy | Debug: list invoices with email/pdf path |
| `frontend/src/api/contracts.ts` | Partial | `emailContractPdf` |
| `frontend/src/api/invoices.ts` | Partial | `emailInvoicePdf` |
| `frontend/src/api/repairOrders.ts` | Partial | `emailRepairOrderPdf` |
| `frontend/src/pages/ContractDetailPage.tsx` | Partial | Send email button + confirm dialog |
| `frontend/src/pages/InvoiceDetailPage.tsx` | Partial | Send email button + confirm dialog |
| `frontend/src/pages/RepairOrderDetailPage.tsx` | Partial | Send email button + confirm dialog |
| `frontend/src/i18n/*` | Partial | Email confirm/success/error strings |

### Dependencies / packages

| Package | Version |
|---------|---------|
| `nodemailer` | ^9.0.1 |
| `@types/nodemailer` | ^8.0.1 (dev) |

### Environment variables

| Variable | Default | Required |
|----------|---------|----------|
| `SMTP_HOST` | `localhost` | For real delivery |
| `SMTP_PORT` | `1025` | MailHog/Mailpit local default |
| `SMTP_USER` | `""` | If server requires auth |
| `SMTP_PASS` | `""` | If server requires auth |
| `SMTP_FROM` | `noreply@sclera.io` | From header |

**Gap:** `backend/.env.example` does not list SMTP variables (only `SHOP_EMAIL` for shop settings display).

### Database / schema changes

None for email sending — uses existing `customer_email` on contracts, invoices, repair orders.

### API routes

| Method | Route | Body | Response |
|--------|-------|------|----------|
| POST | `/api/contracts/:id/email` | — | `{ success: true }` |
| POST | `/api/invoices/:id/email` | — | `{ success: true }` |
| POST | `/api/repair-orders/:id/email` | — | `{ success: true }` |

### Frontend pages / components

- `ContractDetailPage` — "Send PDF to Customer" (when `customerEmail` set)
- `InvoiceDetailPage` — same pattern
- `RepairOrderDetailPage` — same pattern

### PDF / email template changes

- Emails attach existing generated PDFs — no changes to PDF templates for email
- Email bodies are **plain text** in `emailService.ts` (not separate template files)
- Contract emails use German salutation from `salutation` + `customerLastName` when available

### Missing / incomplete parts

- No HTML email templates
- No email queue / retry / delivery tracking
- No frontend SMTP configuration UI (env-only)
- Contract/repair order require PDF pre-generated; invoice generates on demand
- `SHOP_EMAIL` in shop settings is for PDF letterhead, not SMTP

---

## Extraction folder layout

```
extracted-feature-work/
├── qr-code-feature/
│   ├── README.md
│   ├── backend/...
│   └── frontend/...
├── extra-fields-feature/
│   ├── README.md
│   ├── backend/...
│   └── frontend/...
├── email-feature/
│   ├── README.md
│   ├── backend/...
│   └── frontend/...
└── notes/
    └── FEATURE_EXTRACTION_REPORT.md  (this file)
```

### Naming convention

- **Full copies** — same relative path as original project
- **Partial extracts** — `*.extract.ts` / `*.extract.tsx` / `*.extract.md` with `// Original path:` comment at top

---

## Cross-feature overlap

Some files serve multiple features and appear in more than one folder (as full or partial copies):

| Original file | QR | Extra fields | Email |
|---------------|:--:|:------------:|:-----:|
| `contractController.ts` | ✓ | | ✓ |
| `contractRoutes.ts` | ✓ | | ✓ |
| `ContractWizard.tsx` | ✓ | ✓ | |
| `frontend/src/types/contract.ts` | ✓ | ✓ | |
| `frontend/src/api/contracts.ts` | ✓ | ✓ | ✓ |
| `contractService.ts` | ✓ | ✓ | |

---

## Verification

- Original project files were **not moved or deleted**
- Extraction is read-only copy for review/porting
- To re-integrate a feature, use the README in each feature folder plus this report

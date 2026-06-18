# Email Feature — Notes

## Overview

Sends PDF attachments to `customerEmail` for contracts, invoices, and repair orders using **nodemailer** with plain-text German email bodies (no HTML templates).

## Email templates

Templates are **inline plain text** in `emailService.ts`:
- `sendContractPdfEmail` — subject: `Kaufvertrag - {contractNumber}`
- `sendRepairOrderPdfEmail` — subject: `Reparaturauftrag - {repairOrderNumber}`
- `sendInvoicePdfEmail` — subject: `Rechnung - {invoiceNumber}`

`buildGermanGreeting()` uses salutation + last name for contracts when available.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SMTP_HOST` | `localhost` | SMTP server hostname |
| `SMTP_PORT` | `1025` | SMTP port (465 = secure) |
| `SMTP_USER` | `""` | Optional auth user |
| `SMTP_PASS` | `""` | Optional auth password |
| `SMTP_FROM` | `noreply@sclera.io` | From address |

**Note:** `backend/.env.example` does not yet document SMTP vars; they are defined in `backend/src/config/env.ts`. Use MailHog/Mailpit on port 1025 for local dev.

## Prerequisites for send

- Entity must have `customerEmail` set
- Contract & repair order require existing `pdfPath`
- Invoice auto-generates PDF on send if missing

## Debug script

`backend/scripts/checkInvoiceEmail.mjs` — lists recent invoices with email/pdf path status.

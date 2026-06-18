# Extra Fields Feature — Notes

## Scope

Recently added fields (Jun 2026 migrations) extend contracts with:

1. **Customer split address** — salutation, first/last name, street, zip, city, id type
2. **Device metadata** — OS version, iCloud/MDM status, warranty, purchase receipt flag
3. **Contract purchase** — payment status, general notes (plus existing damage/internal notes)
4. **Invoice UI** — payment status dropdown/badge, notes on invoice form

## Backward compatibility

`contractService.toContractData()` auto-fills legacy `customerName` and `customerAddress` from split fields for search indexes and older PDF consumers.

## PDF changes

`contractTemplate.ts` renders split name/address, device extras, payment status, and general notes section.

Invoice PDF `notes` field rendered when present (see `invoiceTemplate.ts` / pdfService).

## API routes

- Contract draft/complete payloads accept all new fields via `draftContractSchema` / `completeContractSchema`
- `PATCH /api/invoices/:id/payment-status` — invoice payment status only (see invoiceRoutes)

## Not in this extraction (admin-only, separate feature)

User roles / admin dashboard are unrelated to these field additions.

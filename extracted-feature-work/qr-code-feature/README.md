# QR Code Feature — Notes

## How QR codes are generated

- **No local QR npm package** is installed in this project.
- The UI renders QR codes via a **third-party HTTP API**:
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=<encoded-url>`
- The encoded URL points to `/signature/:token` on the frontend (LAN IP substituted when on localhost).

## PDF / contract documents

- **No QR code is embedded in contract PDFs** in the current codebase.
- PDFs only include signature images (`signaturePath`, `shopkeeperSignaturePath`) — see `backend/src/pdf/templates/contractTemplate.ts`.

## Mobile flow

1. Staff clicks "Generate QR Code" in contract wizard → `POST /api/contracts/:id/signature-qr`
2. Backend creates `signatureToken`, sets `signatureStatus: PENDING`
3. QR image encodes URL from `getSignatureUrl()` (replaces localhost with LAN IP)
4. Customer scans → `MobileSignaturePage` at `/signature/:token`
5. Customer draws signature → `POST /api/contracts/public/signature/:token`
6. Wizard polls `GET /api/contracts/:id/signature-status` until `SIGNED`

## Related env vars

- `CORS_ALLOW_LAN=true` — allow mobile browsers on LAN origins
- `CORS_ORIGINS` — explicit allowed origins
- `HOST=0.0.0.0` — API reachable from phone on same network

## Frontend dependency

- `react-signature-canvas` — used on `MobileSignaturePage` (not QR-specific but required for mobile signing)

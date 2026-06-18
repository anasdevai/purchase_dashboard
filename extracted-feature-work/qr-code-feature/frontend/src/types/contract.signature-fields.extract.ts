// Original path: frontend/src/types/contract.ts
// Extracted: QR / mobile signature fields on ApiContract

export type ApiContract = {
  // ...other fields...
  signatureToken?: string | null
  signatureStatus?: string | null
  qrUrl?: string | null  // computed by backend enrichContract, not stored in DB
}

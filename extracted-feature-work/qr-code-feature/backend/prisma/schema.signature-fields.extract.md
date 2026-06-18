# Original path: backend/prisma/schema.prisma
# Extracted: Contract model QR/signature fields

```prisma
model Contract {
  // ...
  signatureToken          String?        @map("signature_token")
  signatureStatus         String?        @map("signature_status")
  signaturePath           String?        @map("signature_path")
  // ...

  @@index([signatureToken])
}
```

Migration: `backend/prisma/migrations/20260617110824_add_signature_token/migration.sql`

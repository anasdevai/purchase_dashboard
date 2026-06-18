# Original path: backend/prisma/schema.prisma
# Extracted: recently added Contract / Invoice fields (Jun 2026 migrations)

## Contract — customer split fields (migration 20260617104814)

```prisma
salutation              String?        @map("salutation")
customerFirstName       String?        @map("customer_first_name")
customerLastName        String?        @map("customer_last_name")
customerStreet          String?        @map("customer_street")
customerZipCode         String?        @map("customer_zip_code")
customerCity            String?        @map("customer_city")
idType                  String?        @map("id_type")
```

## Contract — device fields (migration 20260617105529)

```prisma
osVersion               String?        @map("os_version")
icloudStatus            String?        @map("icloud_status")
mdmStatus               String?        @map("mdm_status")
warranty                String?
purchaseReceiptAvailable Boolean?      @default(false) @map("purchase_receipt_available")
```

## Contract — payment status & notes (migration 20260617110132)

```prisma
paymentStatus           String?        @map("payment_status")
notes                   String?        @map("notes")
```

## Invoice — notes & payment status (pre-existing enum, UI enhanced recently)

```prisma
paymentStatus        InvoicePaymentStatus? @map("payment_status")  // Paid | Open | Cancelled
notes                String?
```

Legacy fields still used: `damageNotes`, `internalNotes` on contracts; `technicianNotes` on repair orders.

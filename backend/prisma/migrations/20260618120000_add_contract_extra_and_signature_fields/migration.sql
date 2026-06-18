-- Customer split fields
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_city" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_first_name" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_last_name" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_street" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_zip_code" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "id_type" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "salutation" TEXT;

-- Device extra fields
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "icloud_status" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "mdm_status" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "os_version" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "purchase_receipt_available" BOOLEAN DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "warranty" TEXT;

-- Payment status and notes
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "payment_status" TEXT;

-- Mobile QR signature
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signature_status" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signature_token" TEXT;
CREATE INDEX IF NOT EXISTS "contracts_signature_token_idx" ON "contracts"("signature_token");

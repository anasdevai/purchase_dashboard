CREATE TYPE "ContractStatus" AS ENUM ('Draft', 'Completed', 'Cancelled');

CREATE TYPE "ContractFileType" AS ENUM (
  'id_front',
  'id_back',
  'device_front',
  'device_back',
  'imei_photo',
  'damage_photo',
  'accessories_photo',
  'other'
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contracts" (
  "id" TEXT NOT NULL,
  "contract_number" TEXT NOT NULL,
  "customer_name" TEXT,
  "customer_address" TEXT,
  "customer_phone" TEXT,
  "customer_email" TEXT,
  "customer_date_of_birth" DATE,
  "id_document_number" TEXT,
  "device_type" TEXT,
  "brand" TEXT,
  "model" TEXT,
  "imei" TEXT,
  "serial_number" TEXT,
  "storage" TEXT,
  "color" TEXT,
  "condition" TEXT,
  "accessories" TEXT,
  "battery_health" TEXT,
  "damage_notes" TEXT,
  "internal_notes" TEXT,
  "purchase_price" DECIMAL(12,2),
  "payment_method" TEXT,
  "ownership_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "not_stolen_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "icloud_removed" BOOLEAN NOT NULL DEFAULT false,
  "google_lock_removed" BOOLEAN NOT NULL DEFAULT false,
  "other_lock_removed" BOOLEAN NOT NULL DEFAULT false,
  "factory_reset_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "signature_path" TEXT,
  "pdf_path" TEXT,
  "status" "ContractStatus" NOT NULL DEFAULT 'Draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_files" (
  "id" TEXT NOT NULL,
  "contract_id" TEXT NOT NULL,
  "file_type" "ContractFileType" NOT NULL,
  "file_path" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contract_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");
CREATE INDEX "contracts_contract_number_idx" ON "contracts"("contract_number");
CREATE INDEX "contracts_customer_name_idx" ON "contracts"("customer_name");
CREATE INDEX "contracts_customer_phone_idx" ON "contracts"("customer_phone");
CREATE INDEX "contracts_imei_idx" ON "contracts"("imei");
CREATE INDEX "contracts_serial_number_idx" ON "contracts"("serial_number");
CREATE INDEX "contracts_model_idx" ON "contracts"("model");
CREATE INDEX "contracts_created_at_idx" ON "contracts"("created_at");
CREATE INDEX "contract_files_contract_id_idx" ON "contract_files"("contract_id");
CREATE UNIQUE INDEX "contract_files_contract_id_file_type_file_path_key" ON "contract_files"("contract_id", "file_type", "file_path");

ALTER TABLE "contract_files"
ADD CONSTRAINT "contract_files_contract_id_fkey"
FOREIGN KEY ("contract_id") REFERENCES "contracts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;


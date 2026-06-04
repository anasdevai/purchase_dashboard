-- CreateTable
CREATE TABLE "shop_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL DEFAULT '',
    "shop_address" TEXT NOT NULL DEFAULT '',
    "shop_phone" TEXT NOT NULL DEFAULT '',
    "shop_email" TEXT NOT NULL DEFAULT '',
    "owner_name" TEXT NOT NULL DEFAULT '',
    "logo_data_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id")
);

-- Add user_id to contracts
ALTER TABLE "contracts" ADD COLUMN "user_id" TEXT;

UPDATE "contracts"
SET "user_id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1)
WHERE "user_id" IS NULL;

ALTER TABLE "contracts" ALTER COLUMN "user_id" SET NOT NULL;

-- Drop global unique on contract_number, add per-user unique
DROP INDEX IF EXISTS "contracts_contract_number_key";

CREATE UNIQUE INDEX "contracts_user_id_contract_number_key" ON "contracts"("user_id", "contract_number");

CREATE INDEX "contracts_user_id_idx" ON "contracts"("user_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "shop_settings_user_id_key" ON "shop_settings"("user_id");

ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

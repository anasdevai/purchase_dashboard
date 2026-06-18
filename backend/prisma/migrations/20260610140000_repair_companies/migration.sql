CREATE TABLE "repair_companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_info" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_companies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "repair_companies_user_id_name_key" ON "repair_companies"("user_id", "name");
CREATE INDEX "repair_companies_user_id_idx" ON "repair_companies"("user_id");

ALTER TABLE "repair_companies" ADD CONSTRAINT "repair_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "repair_orders" ADD COLUMN "repair_company_id" TEXT;
ALTER TABLE "repair_orders" ADD COLUMN "repair_company_notes" TEXT;

CREATE INDEX "repair_orders_repair_company_id_idx" ON "repair_orders"("repair_company_id");

ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_repair_company_id_fkey" FOREIGN KEY ("repair_company_id") REFERENCES "repair_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

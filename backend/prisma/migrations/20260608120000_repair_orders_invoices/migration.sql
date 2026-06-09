CREATE TYPE "RepairOrderStatus" AS ENUM ('Received', 'InProgress', 'WaitingForParts', 'ReadyForPickup', 'Completed', 'Cancelled');

CREATE TYPE "InvoicePaymentMethod" AS ENUM ('Cash', 'BankTransfer', 'Card', 'Other');

CREATE TYPE "InvoicePaymentStatus" AS ENUM ('Paid', 'Open', 'Cancelled');

CREATE TABLE "repair_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repair_order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_address" TEXT,
    "device_type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "imei_or_serial" TEXT,
    "password_pin" TEXT,
    "accessories_received" TEXT,
    "problem_description" TEXT NOT NULL,
    "visible_damage" TEXT,
    "technician_notes" TEXT,
    "estimated_price" DECIMAL(12,2),
    "deposit_amount" DECIMAL(12,2),
    "expected_completion_date" DATE,
    "status" "RepairOrderStatus" NOT NULL DEFAULT 'Received',
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repair_order_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_name" TEXT NOT NULL,
    "customer_address" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "device_summary" TEXT,
    "repair_summary" TEXT,
    "payment_method" "InvoicePaymentMethod",
    "payment_status" "InvoicePaymentStatus",
    "calculated_net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calculated_vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calculated_gross_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount_override" DECIMAL(12,2),
    "vat_amount_override" DECIMAL(12,2),
    "gross_total_override" DECIMAL(12,2),
    "notes" TEXT,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "vat_percent" DECIMAL(5,2) NOT NULL,
    "line_net" DECIMAL(12,2) NOT NULL,
    "line_vat" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "repair_orders_user_id_repair_order_number_key" ON "repair_orders"("user_id", "repair_order_number");
CREATE INDEX "repair_orders_user_id_idx" ON "repair_orders"("user_id");
CREATE INDEX "repair_orders_repair_order_number_idx" ON "repair_orders"("repair_order_number");
CREATE INDEX "repair_orders_customer_name_idx" ON "repair_orders"("customer_name");
CREATE INDEX "repair_orders_customer_phone_idx" ON "repair_orders"("customer_phone");
CREATE INDEX "repair_orders_model_idx" ON "repair_orders"("model");
CREATE INDEX "repair_orders_imei_or_serial_idx" ON "repair_orders"("imei_or_serial");
CREATE INDEX "repair_orders_status_idx" ON "repair_orders"("status");
CREATE INDEX "repair_orders_created_at_idx" ON "repair_orders"("created_at");

CREATE UNIQUE INDEX "invoices_user_id_invoice_number_key" ON "invoices"("user_id", "invoice_number");
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");
CREATE INDEX "invoices_repair_order_id_idx" ON "invoices"("repair_order_id");
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");
CREATE INDEX "invoices_customer_name_idx" ON "invoices"("customer_name");
CREATE INDEX "invoices_customer_phone_idx" ON "invoices"("customer_phone");
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

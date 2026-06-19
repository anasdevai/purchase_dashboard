-- CreateEnum
CREATE TYPE "SparePartStatus" AS ENUM ('NotOrdered', 'Ordered', 'Arrived', 'Installed');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Booked', 'Confirmed', 'Arrived', 'Cancelled', 'Voided');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('Manual', 'Order', 'Website');

-- AlterEnum
ALTER TYPE "InvoicePaymentMethod" ADD VALUE 'PayPal';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoicePaymentStatus" ADD VALUE 'Draft';
ALTER TYPE "InvoicePaymentStatus" ADD VALUE 'Sent';
ALTER TYPE "InvoicePaymentStatus" ADD VALUE 'PartiallyPaid';
ALTER TYPE "InvoicePaymentStatus" ADD VALUE 'Overdue';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RepairOrderStatus" ADD VALUE 'New';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'Received';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'InDiagnosis';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'WaitingForParts';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'SparePartArrived';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'InRepair';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'Finished';
ALTER TYPE "RepairOrderStatus" ADD VALUE 'ReadyForPickup';

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "customer_id" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "due_date" DATE,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "payment_date" DATE,
ADD COLUMN     "payment_reference" TEXT,
ADD COLUMN     "service_date" DATE;

-- AlterTable
ALTER TABLE "repair_orders" ADD COLUMN     "assigned_employee_id" TEXT,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "discount_percent" DECIMAL(5,2),
ADD COLUMN     "issue_category" TEXT,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "quotation_id" TEXT,
ADD COLUMN     "required_spare_parts" TEXT,
ADD COLUMN     "spare_part_status" "SparePartStatus";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_access_token" TEXT,
ADD COLUMN     "google_refresh_token" TEXT,
ADD COLUMN     "google_token_expiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "repair_order_history" (
    "id" TEXT NOT NULL,
    "repair_order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "from_status" "RepairOrderStatus",
    "to_status" "RepairOrderStatus" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_order_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_number" TEXT,
    "salutation" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "company" TEXT,
    "vat_id" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "date_of_birth" DATE,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "valid_until_date" DATE NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'Draft',
    "employee_id" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_address" TEXT,
    "device_type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "imei_or_serial" TEXT,
    "pdf_path" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "repair_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "discount" DECIMAL(5,2),
    "line_total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smtp_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "encryption" TEXT NOT NULL DEFAULT 'none',
    "username" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smtp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imap_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "encryption" TEXT NOT NULL DEFAULT 'none',
    "username" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imap_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_id" TEXT,
    "device_brand" TEXT,
    "device_model" TEXT,
    "device_imei" TEXT,
    "repair_order_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "note" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Booked',
    "source" "AppointmentSource" NOT NULL DEFAULT 'Manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "google_calendar_event_id" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repair_order_history_repair_order_id_idx" ON "repair_order_history"("repair_order_id");

-- CreateIndex
CREATE INDEX "repair_order_history_created_at_idx" ON "repair_order_history"("created_at");

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_name_phone_key" ON "customers"("user_id", "name", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_customer_number_key" ON "customers"("user_id", "customer_number");

-- CreateIndex
CREATE INDEX "quotations_user_id_idx" ON "quotations"("user_id");

-- CreateIndex
CREATE INDEX "quotations_quotation_number_idx" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "quotations_customer_name_idx" ON "quotations"("customer_name");

-- CreateIndex
CREATE INDEX "quotations_customer_phone_idx" ON "quotations"("customer_phone");

-- CreateIndex
CREATE INDEX "quotations_model_idx" ON "quotations"("model");

-- CreateIndex
CREATE INDEX "quotations_created_at_idx" ON "quotations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_user_id_quotation_number_key" ON "quotations"("user_id", "quotation_number");

-- CreateIndex
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "smtp_settings_user_id_key" ON "smtp_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "imap_settings_user_id_key" ON "imap_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_user_id_name_key" ON "email_templates"("user_id", "name");

-- CreateIndex
CREATE INDEX "email_logs_user_id_idx" ON "email_logs"("user_id");

-- CreateIndex
CREATE INDEX "email_logs_sent_at_idx" ON "email_logs"("sent_at");

-- CreateIndex
CREATE INDEX "appointments_user_id_idx" ON "appointments"("user_id");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "appointments_repair_order_id_idx" ON "appointments"("repair_order_id");

-- CreateIndex
CREATE INDEX "appointments_start_time_idx" ON "appointments"("start_time");

-- CreateIndex
CREATE INDEX "repair_orders_assigned_employee_id_idx" ON "repair_orders"("assigned_employee_id");

-- CreateIndex
CREATE INDEX "repair_orders_customer_id_idx" ON "repair_orders"("customer_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_history" ADD CONSTRAINT "repair_order_history_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smtp_settings" ADD CONSTRAINT "smtp_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imap_settings" ADD CONSTRAINT "imap_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_repair_order_id_fkey" FOREIGN KEY ("repair_order_id") REFERENCES "repair_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

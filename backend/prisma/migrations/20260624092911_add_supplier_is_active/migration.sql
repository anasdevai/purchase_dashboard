-- CreateEnum
CREATE TYPE "RepairCategory" AS ENUM ('Display', 'Battery', 'WaterDamage', 'Software', 'LogicBoard', 'Camera', 'ChargingPort', 'Keyboard', 'Other');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('Easy', 'Medium', 'Difficult', 'Expert');

-- CreateEnum
CREATE TYPE "RepairRequestStatus" AS ENUM ('New', 'Seen', 'Contacted', 'Completed');

-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN     "widget_accent_color" TEXT NOT NULL DEFAULT '#0f172a',
ADD COLUMN     "widget_font" TEXT NOT NULL DEFAULT 'Inter',
ADD COLUMN     "widget_primary_color" TEXT NOT NULL DEFAULT '#0284c7',
ADD COLUMN     "widget_show_logo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_type_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "generation" TEXT,
    "storage_options" TEXT[],
    "color_options" TEXT[],
    "release_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "RepairCategory" NOT NULL,
    "standard_price" DECIMAL(12,2),
    "duration" INTEGER,
    "difficulty" "DifficultyLevel",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "repair_type_id" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "duration" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "device_brand" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_model" TEXT NOT NULL,
    "repair_type" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "photo_path" TEXT,
    "preferred_appointment" TIMESTAMP(3),
    "status" "RepairRequestStatus" NOT NULL DEFAULT 'New',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_created_id" TEXT,
    "repair_order_created_id" TEXT,

    CONSTRAINT "repair_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_types_brand_id_name_key" ON "device_types"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_model_id_repair_type_id_key" ON "price_lists"("model_id", "repair_type_id");

-- CreateIndex
CREATE INDEX "repair_requests_user_id_idx" ON "repair_requests"("user_id");

-- CreateIndex
CREATE INDEX "repair_requests_status_idx" ON "repair_requests"("status");

-- CreateIndex
CREATE INDEX "repair_requests_created_at_idx" ON "repair_requests"("created_at");

-- AddForeignKey
ALTER TABLE "device_types" ADD CONSTRAINT "device_types_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "device_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_repair_type_id_fkey" FOREIGN KEY ("repair_type_id") REFERENCES "repair_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "InventoryOrderStatus" AS ENUM ('Ordered', 'Shipped', 'PartiallyDelivered', 'Delivered', 'Cancelled');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "delivery_time" INTEGER,
    "payment_terms" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "compatibility" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "supplier_id" TEXT,
    "purchase_price" DECIMAL(12,2) NOT NULL,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "storage_location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "status" "InventoryOrderStatus" NOT NULL DEFAULT 'Ordered',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "spare_part_id" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spare_part_id" TEXT NOT NULL,
    "quantity_diff" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_user_id_company_name_key" ON "suppliers"("user_id", "company_name");

-- CreateIndex
CREATE INDEX "spare_parts_user_id_idx" ON "spare_parts"("user_id");

-- CreateIndex
CREATE INDEX "spare_parts_supplier_id_idx" ON "spare_parts"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_user_id_item_number_key" ON "spare_parts"("user_id", "item_number");

-- CreateIndex
CREATE INDEX "inventory_orders_user_id_idx" ON "inventory_orders"("user_id");

-- CreateIndex
CREATE INDEX "inventory_orders_supplier_id_idx" ON "inventory_orders"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_orders_user_id_order_number_key" ON "inventory_orders"("user_id", "order_number");

-- CreateIndex
CREATE INDEX "inventory_order_items_order_id_idx" ON "inventory_order_items"("order_id");

-- CreateIndex
CREATE INDEX "inventory_order_items_spare_part_id_idx" ON "inventory_order_items"("spare_part_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_order_items_order_id_spare_part_id_key" ON "inventory_order_items"("order_id", "spare_part_id");

-- CreateIndex
CREATE INDEX "goods_receipts_user_id_idx" ON "goods_receipts"("user_id");

-- CreateIndex
CREATE INDEX "goods_receipts_order_id_idx" ON "goods_receipts"("order_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_user_id_idx" ON "stock_adjustments"("user_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_spare_part_id_idx" ON "stock_adjustments"("spare_part_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_order_items" ADD CONSTRAINT "inventory_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "inventory_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_order_items" ADD CONSTRAINT "inventory_order_items_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "inventory_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_spare_part_id_fkey" FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

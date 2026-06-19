-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "icloud_status" TEXT,
ADD COLUMN     "mdm_status" TEXT,
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "purchase_receipt_available" BOOLEAN DEFAULT false,
ADD COLUMN     "warranty" TEXT;

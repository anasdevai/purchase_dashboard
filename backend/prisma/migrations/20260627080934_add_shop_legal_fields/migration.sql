-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN     "company_register_court" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gisa_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gln" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "customer_city" TEXT,
ADD COLUMN     "customer_first_name" TEXT,
ADD COLUMN     "customer_last_name" TEXT,
ADD COLUMN     "customer_street" TEXT,
ADD COLUMN     "customer_zip_code" TEXT,
ADD COLUMN     "id_type" TEXT,
ADD COLUMN     "salutation" TEXT;

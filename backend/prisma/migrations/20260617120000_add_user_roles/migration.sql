-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'staff');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'staff';

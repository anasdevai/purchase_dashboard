-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "signature_status" TEXT,
ADD COLUMN     "signature_token" TEXT;

-- CreateIndex
CREATE INDEX "contracts_signature_token_idx" ON "contracts"("signature_token");

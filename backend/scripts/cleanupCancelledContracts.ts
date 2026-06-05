/// <reference types="node" />

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cleanupCancelledContracts = async () => {
  const storageRoot = path.resolve("storage/contracts");
  const cancelledContracts = await prisma.contract.findMany({
    where: { status: "Cancelled" },
    select: { id: true, contractNumber: true }
  });

  if (cancelledContracts.length > 0) {
    await prisma.contract.deleteMany({
      where: {
        id: {
          in: cancelledContracts.map((contract) => contract.id)
        }
      }
    });

    for (const contract of cancelledContracts) {
      const contractDir = path.resolve(storageRoot, contract.contractNumber);
      if (!contractDir.startsWith(`${storageRoot}${path.sep}`)) {
        throw new Error(`Refusing to delete outside storage root: ${contractDir}`);
      }

      await fs.rm(contractDir, { recursive: true, force: true });
    }
  }

  console.log(
    `Removed ${cancelledContracts.length} cancelled contract(s): ${
      cancelledContracts.map((contract) => contract.contractNumber).join(", ") || "none"
    }`
  );
};

cleanupCancelledContracts()
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clearDuplicates = async (field: "imei" | "serialNumber") => {
  const contracts = await prisma.contract.findMany({
    where: {
      [field]: { not: null },
      status: { not: "Cancelled" }
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      contractNumber: true,
      status: true,
      [field]: true
    }
  });
  contracts.sort((left, right) => {
    if (left.status === right.status) return 0;
    if (left.status === "Completed") return -1;
    if (right.status === "Completed") return 1;
    return 0;
  });

  const seen = new Set<string>();
  const cleared: string[] = [];

  for (const contract of contracts) {
    const rawValue = contract[field];
    if (!rawValue) continue;

    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) continue;

    if (!seen.has(normalized)) {
      seen.add(normalized);
      continue;
    }

    if (contract.status === "Draft") {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { [field]: null }
      });
      cleared.push(`${contract.contractNumber}:${rawValue}`);
      continue;
    }

    throw new Error(`Duplicate completed ${field} exists on ${contract.contractNumber}: ${rawValue}`);
  }

  console.log(`Cleared duplicate draft ${field}: ${cleared.join(", ") || "none"}`);
};

const main = async () => {
  await clearDuplicates("imei");
  await clearDuplicates("serialNumber");
};

main().finally(async () => {
  await prisma.$disconnect();
});

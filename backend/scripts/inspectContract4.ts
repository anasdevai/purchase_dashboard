import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const contract = await prisma.contract.findFirst({
    where: { contractNumber: "2026-0004" }
  });
  console.log(JSON.stringify(contract, null, 2));
};

main().finally(() => prisma.$disconnect());

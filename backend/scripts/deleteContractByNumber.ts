import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const contractNumber = process.argv[2];

const main = async () => {
  if (!contractNumber) {
    throw new Error("Contract number is required");
  }

  const contract = await prisma.contract.findUnique({
    where: { contractNumber },
    select: { id: true }
  });

  if (contract) {
    await prisma.contract.delete({ where: { id: contract.id } });
    console.log(`Deleted ${contractNumber}`);
  } else {
    console.log(`No contract found for ${contractNumber}`);
  }
};

main().finally(async () => {
  await prisma.$disconnect();
});

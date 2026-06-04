import { prisma } from "../config/prisma.js";

export const generateContractNumber = async (userId: string) => {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;

  const latest = await prisma.contract.findFirst({
    where: {
      userId,
      contractNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      contractNumber: "desc"
    },
    select: {
      contractNumber: true
    }
  });

  const lastSequence = latest ? Number(latest.contractNumber.split("-")[1]) : 0;
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

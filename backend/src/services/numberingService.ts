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

const nextNumber = async (
  prefix: string,
  findLatest: () => Promise<string | null>
) => {
  const latestNumber = await findLatest();
  const lastSequence = latestNumber ? Number(latestNumber.split("-").at(-1)) : 0;
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

export const generateRepairOrderNumber = async (userId: string) => {
  const year = new Date().getFullYear();
  const prefix = `RO-${year}-`;

  return nextNumber(prefix, async () => {
    const latest = await prisma.repairOrder.findFirst({
      where: {
        userId,
        repairOrderNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        repairOrderNumber: "desc"
      },
      select: {
        repairOrderNumber: true
      }
    });

    return latest?.repairOrderNumber ?? null;
  });
};

export const generateInvoiceNumber = async (userId: string) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  return nextNumber(prefix, async () => {
    const latest = await prisma.invoice.findFirst({
      where: {
        userId,
        invoiceNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoiceNumber: "desc"
      },
      select: {
        invoiceNumber: true
      }
    });

    return latest?.invoiceNumber ?? null;
  });
};

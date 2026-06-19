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

export const generateQuotationNumber = async (userId: string) => {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  return nextNumber(prefix, async () => {
    const latest = await prisma.quotation.findFirst({
      where: {
        userId,
        quotationNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        quotationNumber: "desc"
      },
      select: {
        quotationNumber: true
      }
    });

    return latest?.quotationNumber ?? null;
  });
};


const INVOICE_NUMBER_PREFIX = "INV-";

const parseInvoiceSequence = (invoiceNumber: string) => {
  const simple = invoiceNumber.match(/^INV-(\d+)$/);
  if (simple) {
    const sequence = Number(simple[1]);
    return Number.isFinite(sequence) ? sequence : null;
  }

  const legacy = invoiceNumber.match(/^INV-\d{4}-(\d+)$/);
  if (legacy) {
    const sequence = Number(legacy[1]);
    return Number.isFinite(sequence) ? sequence : null;
  }

  return null;
};

export const generateInvoiceNumber = async (userId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      invoiceNumber: {
        startsWith: INVOICE_NUMBER_PREFIX
      }
    },
    select: {
      invoiceNumber: true
    }
  });

  const maxSequence = invoices.reduce((max, invoice) => {
    const sequence = parseInvoiceSequence(invoice.invoiceNumber);
    return sequence !== null && sequence > max ? sequence : max;
  }, 0);

  const nextSequence = maxSequence + 1;
  return `${INVOICE_NUMBER_PREFIX}${String(nextSequence).padStart(3, "0")}`;
};

import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { getDayRange } from "../utils/date.js";
import { HttpError } from "../utils/httpError.js";
import { getRecentContracts } from "./contractService.js";

const decimalToNumber = (value: { toString: () => string } | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
};

const invoiceGross = (invoice: {
  calculatedGrossTotal: { toString: () => string };
  grossTotalOverride: { toString: () => string } | null;
}) => decimalToNumber(invoice.grossTotalOverride ?? invoice.calculatedGrossTotal);

const sumInvoiceGrossTotals = async (where: Prisma.InvoiceWhereInput) => {
  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      calculatedGrossTotal: true,
      grossTotalOverride: true,
    },
  });

  return invoices.reduce((total, invoice) => total + invoiceGross(invoice), 0);
};

export const getDashboardSummary = async (userId: string) => {
  const range = getDayRange();

  if (!range) {
    throw new HttpError(500, "Unable to calculate today range");
  }

  const completedTodayWhere = {
    userId,
    status: "Completed" as const,
    updatedAt: { gte: range.start, lt: range.end },
  };

  const createdTodayWhere = {
    userId,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [
    contractsToday,
    purchaseAggregate,
    currentContracts,
    draftContracts,
    repairOrdersToday,
    readyForPickupCount,
    paidInvoiceRevenueToday,
    openInvoiceAmount,
    repairRevenueToday,
    recentContracts,
  ] = await Promise.all([
    prisma.contract.count({ where: completedTodayWhere }),
    prisma.contract.aggregate({
      where: completedTodayWhere,
      _sum: { purchasePrice: true },
    }),
    prisma.contract.count({ where: { userId, status: { not: "Cancelled" } } }),
    prisma.contract.count({ where: { userId, status: "Draft" } }),
    prisma.repairOrder.count({ where: createdTodayWhere }),
    prisma.repairOrder.count({
      where: { userId, status: "ReadyForPickup" },
    }),
    sumInvoiceGrossTotals({
      ...createdTodayWhere,
      paymentStatus: "Paid",
    }),
    sumInvoiceGrossTotals({
      userId,
      paymentStatus: "Open",
    }),
    sumInvoiceGrossTotals({
      ...createdTodayWhere,
      paymentStatus: "Paid",
      repairOrderId: { not: null },
    }),
    getRecentContracts(userId),
  ]);

  return {
    contractsToday,
    todayPurchaseTotal: decimalToNumber(purchaseAggregate._sum?.purchasePrice),
    currentContracts,
    draftContracts,
    repairOrdersToday,
    readyForPickupCount,
    paidInvoiceRevenueToday,
    openInvoiceAmount,
    repairRevenueToday,
    recentContracts: recentContracts.map((contract) => ({
      ...contract,
      purchasePrice: decimalToNumber(contract.purchasePrice),
    })),
  };
};

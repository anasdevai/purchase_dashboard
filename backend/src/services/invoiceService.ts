import fs from "node:fs";
import { prisma } from "../config/prisma.js";
import { getDayRange } from "../utils/date.js";
import { HttpError } from "../utils/httpError.js";
import { ensureDirectory, getInvoiceStorageDir } from "../utils/paths.js";
import {
  invoicePaymentStatusSchema,
  invoiceSchema,
  searchInvoicesSchema
} from "../validators/invoiceValidators.js";
import { generateInvoiceNumber } from "./numberingService.js";
import { generateInvoicePdf } from "./pdfService.js";
import { getShopSettingsForUser } from "./settingsService.js";

const includeItems = {
  items: { orderBy: { sortOrder: "asc" as const } },
  repairOrder: { select: { id: true, repairOrderNumber: true } }
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateItems = (items: Array<{ description: string; quantity: number; unitPrice: number; vatPercent: number }>) => {
  let calculatedNetAmount = 0;
  let calculatedVatAmount = 0;

  const preparedItems = items.map((item, index) => {
    const lineNet = roundMoney(item.quantity * item.unitPrice);
    const lineVat = roundMoney(lineNet * (item.vatPercent / 100));
    const lineTotal = roundMoney(lineNet + lineVat);
    calculatedNetAmount += lineNet;
    calculatedVatAmount += lineVat;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatPercent: item.vatPercent,
      lineNet,
      lineVat,
      lineTotal,
      sortOrder: index
    };
  });

  calculatedNetAmount = roundMoney(calculatedNetAmount);
  calculatedVatAmount = roundMoney(calculatedVatAmount);

  return {
    preparedItems,
    calculatedNetAmount,
    calculatedVatAmount,
    calculatedGrossTotal: roundMoney(calculatedNetAmount + calculatedVatAmount)
  };
};

const toData = (input: Record<string, unknown>) => invoiceSchema.parse(input);

export const getInvoiceOrThrow = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: includeItems
  });

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  return invoice;
};

const assertRepairOrderAccess = async (repairOrderId: string | undefined, userId: string) => {
  if (!repairOrderId) return;

  const repairOrder = await prisma.repairOrder.findFirst({
    where: { id: repairOrderId, userId },
    select: { id: true }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }
};

export const createInvoice = async (userId: string, input: Record<string, unknown>) => {
  const parsed = toData(input);
  await assertRepairOrderAccess(parsed.repairOrderId, userId);
  const totals = calculateItems(parsed.items);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const invoiceNumber = parsed.invoiceNumber?.trim() || (await generateInvoiceNumber(userId));

    try {
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          repairOrderId: parsed.repairOrderId,
          invoiceNumber,
          invoiceDate: parsed.invoiceDate ?? new Date(),
          customerName: parsed.customerName,
          customerAddress: parsed.customerAddress,
          customerPhone: parsed.customerPhone,
          customerEmail: parsed.customerEmail,
          deviceSummary: parsed.deviceSummary,
          repairSummary: parsed.repairSummary,
          paymentMethod: parsed.paymentMethod,
          paymentStatus: parsed.paymentStatus,
          calculatedNetAmount: totals.calculatedNetAmount,
          calculatedVatAmount: totals.calculatedVatAmount,
          calculatedGrossTotal: totals.calculatedGrossTotal,
          netAmountOverride: parsed.netAmountOverride,
          vatAmountOverride: parsed.vatAmountOverride,
          grossTotalOverride: parsed.grossTotalOverride,
          notes: parsed.notes,
          items: { create: totals.preparedItems }
        },
        include: includeItems
      });

      await ensureDirectory(getInvoiceStorageDir(userId, invoice.invoiceNumber));
      return invoice;
    } catch (error) {
      if (parsed.invoiceNumber || attempt === 2) throw error;
    }
  }

  throw new HttpError(500, "Unable to generate invoice number");
};

export const createInvoiceFromRepairOrder = async (userId: string, repairOrderId: string) => {
  const repairOrder = await prisma.repairOrder.findFirst({
    where: { id: repairOrderId, userId }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }

  const existingInvoice = await prisma.invoice.findFirst({
    where: { userId, repairOrderId: repairOrder.id },
    select: { id: true, invoiceNumber: true }
  });

  if (existingInvoice) {
    throw new HttpError(409, "Invoice already exists for this repair order", {
      invoiceId: existingInvoice.id,
      invoiceNumber: existingInvoice.invoiceNumber
    });
  }

  const deviceSummary = [repairOrder.deviceType, repairOrder.brand, repairOrder.model]
    .filter(Boolean)
    .join(" ");

  return createInvoice(userId, {
    repairOrderId: repairOrder.id,
    customerName: repairOrder.customerName,
    customerAddress: repairOrder.customerAddress,
    customerPhone: repairOrder.customerPhone,
    customerEmail: repairOrder.customerEmail,
    deviceSummary,
    repairSummary: repairOrder.problemDescription,
    paymentStatus: "Open",
    items: [
      {
        description: repairOrder.problemDescription || "Repair service",
        quantity: 1,
        unitPrice: repairOrder.estimatedPrice ? Number(repairOrder.estimatedPrice.toString()) : 0,
        vatPercent: 0
      }
    ]
  });
};

export const updateInvoice = async (id: string, userId: string, input: Record<string, unknown>) => {
  await getInvoiceOrThrow(id, userId);
  const parsed = toData(input);
  await assertRepairOrderAccess(parsed.repairOrderId, userId);
  const totals = calculateItems(parsed.items);

  return prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    return tx.invoice.update({
      where: { id },
      data: {
        repairOrderId: parsed.repairOrderId,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate: parsed.invoiceDate ?? new Date(),
        customerName: parsed.customerName,
        customerAddress: parsed.customerAddress,
        customerPhone: parsed.customerPhone,
        customerEmail: parsed.customerEmail,
        deviceSummary: parsed.deviceSummary,
        repairSummary: parsed.repairSummary,
        paymentMethod: parsed.paymentMethod,
        paymentStatus: parsed.paymentStatus,
        calculatedNetAmount: totals.calculatedNetAmount,
        calculatedVatAmount: totals.calculatedVatAmount,
        calculatedGrossTotal: totals.calculatedGrossTotal,
        netAmountOverride: parsed.netAmountOverride,
        vatAmountOverride: parsed.vatAmountOverride,
        grossTotalOverride: parsed.grossTotalOverride,
        notes: parsed.notes,
        pdfPath: null,
        items: { create: totals.preparedItems }
      },
      include: includeItems
    });
  });
};

export const updateInvoicePaymentStatus = async (
  id: string,
  userId: string,
  input: Record<string, unknown>
) => {
  await getInvoiceOrThrow(id, userId);
  const parsed = invoicePaymentStatusSchema.parse(input);

  return prisma.invoice.update({
    where: { id },
    data: { paymentStatus: parsed.paymentStatus },
    include: includeItems
  });
};

export const generatePdfForInvoice = async (id: string, userId: string) => {
  const invoice = await getInvoiceOrThrow(id, userId);
  const shopSettings = await getShopSettingsForUser(userId);
  const pdfPath = await generateInvoicePdf(invoice, {
    name: shopSettings.shopName,
    address: shopSettings.shopAddress,
    phone: shopSettings.shopPhone,
    email: shopSettings.shopEmail,
    ownerName: shopSettings.ownerName,
    logoDataUrl: shopSettings.logoDataUrl
  });

  return prisma.invoice.update({
    where: { id },
    data: { pdfPath },
    include: includeItems
  });
};

export const deleteInvoice = async (id: string, userId: string) => {
  const invoice = await getInvoiceOrThrow(id, userId);

  await prisma.invoice.delete({ where: { id } });
  await fs.promises.rm(getInvoiceStorageDir(userId, invoice.invoiceNumber), {
    recursive: true,
    force: true
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber
  };
};

export const searchInvoices = async (userId: string, query: Record<string, unknown>) => {
  const parsed = searchInvoicesSchema.parse(query);
  const where: Record<string, unknown> = { userId };

  if (parsed.q) {
    where.OR = [
      { invoiceNumber: { contains: parsed.q, mode: "insensitive" } },
      { customerName: { contains: parsed.q, mode: "insensitive" } },
      { customerPhone: { contains: parsed.q, mode: "insensitive" } }
    ];
  }

  if (parsed.invoiceNumber) where.invoiceNumber = { contains: parsed.invoiceNumber, mode: "insensitive" };
  if (parsed.customerName) where.customerName = { contains: parsed.customerName, mode: "insensitive" };
  if (parsed.phone) where.customerPhone = { contains: parsed.phone, mode: "insensitive" };

  if (parsed.date) {
    const range = getDayRange(parsed.date);
    if (!range) {
      throw new HttpError(400, "Invalid date filter");
    }
    where.invoiceDate = { gte: range.start, lt: range.end };
  }

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: includeItems
  });
};

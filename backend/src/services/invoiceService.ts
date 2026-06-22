import fs from "node:fs";
import { Prisma } from "@prisma/client";
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
import type { InvoicePdfLanguage } from "../pdf/i18n/invoicePdfI18n.js";
import { generateInvoicePdf, renderInvoicePdfBuffer } from "./pdfService.js";
import { getDefaultVatPercent, getShopSettingsForUser, shopSettingsToPdf } from "./settingsService.js";
import { calculateInvoiceItems } from "../utils/invoiceCalculations.js";

const includeItems = {
  items: { orderBy: { sortOrder: "asc" as const } },
  repairOrder: { select: { id: true, repairOrderNumber: true } },
  employee: { select: { id: true, name: true } },
  customer: { select: { id: true, email: true, lastName: true, salutation: true } }
};

const isDev = process.env.NODE_ENV !== "production";

const devLog = (message: string, details?: Record<string, unknown>) => {
  if (!isDev) return;
  if (details) {
    console.log(`[invoice:dev] ${message}`, details);
    return;
  }
  console.log(`[invoice:dev] ${message}`);
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const calculateItems = calculateInvoiceItems;

const toData = (input: Record<string, unknown>) => invoiceSchema.parse(input);

export const getInvoiceOrThrow = async (id: string, userId: string, isAdmin = false) => {
  const invoice = await prisma.invoice.findFirst({
    where: isAdmin ? { id } : { id, userId },
    include: includeItems
  });

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  return invoice;
};

const attachInvoicePdf = async (id: string, userId: string, language: InvoicePdfLanguage = "en") => {
  const invoice = await getInvoiceOrThrow(id, userId);
  devLog("PDF generation started", {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    itemCount: invoice.items.length,
    net: invoice.calculatedNetAmount.toString(),
    vat: invoice.calculatedVatAmount.toString(),
    gross: invoice.calculatedGrossTotal.toString(),
    language,
  });

  try {
    const shopSettings = await getShopSettingsForUser(userId);
    const pdfPath = await generateInvoicePdf(invoice, shopSettingsToPdf(shopSettings), language);
    devLog("PDF generation completed", { invoiceId: invoice.id, pdfPath });

    return prisma.invoice.update({
      where: { id },
      data: { pdfPath },
      include: includeItems
    });
  } catch (error) {
    devLog("PDF generation failed", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
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

export const createInvoice = async (
  userId: string,
  input: Record<string, unknown>,
  language: InvoicePdfLanguage = "en"
) => {
  const parsed = toData(input);
  await assertRepairOrderAccess(parsed.repairOrderId, userId);
  const totals = calculateItems(parsed.items);

  devLog("create started", {
    userId,
    customerName: parsed.customerName,
    itemCount: parsed.items.length,
    net: totals.calculatedNetAmount,
    vat: totals.calculatedVatAmount,
    gross: totals.calculatedGrossTotal,
    language,
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const invoiceNumber = await generateInvoiceNumber(userId);

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
          netAmountOverride: null,
          vatAmountOverride: null,
          grossTotalOverride: null,
          notes: parsed.notes,
          serviceDate: parsed.serviceDate ?? new Date(),
          dueDate: parsed.dueDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          paymentDate: parsed.paymentDate,
          paymentReference: parsed.paymentReference,
          cancellationReason: parsed.cancellationReason,
          employeeId: parsed.employeeId,
          items: { create: totals.preparedItems }
        },
        include: includeItems
      });

      devLog("invoice saved", { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });

      await ensureDirectory(getInvoiceStorageDir(userId, invoice.invoiceNumber));

      try {
        return await attachInvoicePdf(invoice.id, userId, language);
      } catch (error) {
        devLog("PDF generation failed after create; invoice kept without pdfPath", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        });
        return invoice;
      }
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < 4) {
        continue;
      }
      throw error;
    }
  }

  throw new HttpError(500, "Unable to generate invoice number");
};

export const createInvoiceFromRepairOrder = async (
  userId: string,
  repairOrderId: string,
  language: InvoicePdfLanguage = "en"
) => {
  const repairOrder = await prisma.repairOrder.findFirst({
    where: { id: repairOrderId, userId },
    include: { customer: { select: { email: true } } }
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

  const shopSettings = await getShopSettingsForUser(userId);
  const defaultVatPercent = Math.round(getDefaultVatPercent(shopSettings));

  const items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
  }> = [
    {
      description: repairOrder.problemDescription || "Repair service",
      quantity: 1,
      unitPrice: repairOrder.estimatedPrice
        ? Math.round(Number(repairOrder.estimatedPrice.toString()))
        : 0,
      vatPercent: defaultVatPercent
    }
  ];

  const estPrice = repairOrder.estimatedPrice ? Number(repairOrder.estimatedPrice.toString()) : 0;

  if (repairOrder.discountPercent && Number(repairOrder.discountPercent) > 0) {
    const discPercent = Number(repairOrder.discountPercent);
    const discAmount = estPrice * (discPercent / 100);
    items.push({
      description: `Discount (${discPercent}%)`,
      quantity: 1,
      unitPrice: -Math.round(discAmount),
      vatPercent: defaultVatPercent
    });
  }

  if (repairOrder.depositAmount && Number(repairOrder.depositAmount) > 0) {
    const depAmount = Number(repairOrder.depositAmount);
    items.push({
      description: "Deposit Paid",
      quantity: 1,
      unitPrice: -Math.round(depAmount),
      vatPercent: defaultVatPercent
    });
  }

  return createInvoice(
    userId,
    {
      repairOrderId: repairOrder.id,
      customerName: repairOrder.customerName,
      customerAddress: repairOrder.customerAddress,
      customerPhone: repairOrder.customerPhone,
      customerEmail: repairOrder.customerEmail || repairOrder.customer?.email || undefined,
      deviceSummary,
      repairSummary: repairOrder.problemDescription,
      paymentStatus: "Open",
      items
    },
    language
  );
};

export const updateInvoice = async (
  id: string,
  userId: string,
  input: Record<string, unknown>,
  language: InvoicePdfLanguage = "en"
) => {
  await getInvoiceOrThrow(id, userId);
  const parsed = toData(input);
  await assertRepairOrderAccess(parsed.repairOrderId, userId);
  const totals = calculateItems(parsed.items);

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    await tx.invoice.update({
      where: { id },
      data: {
        repairOrderId: parsed.repairOrderId,
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
        netAmountOverride: null,
        vatAmountOverride: null,
        grossTotalOverride: null,
        notes: parsed.notes,
        serviceDate: parsed.serviceDate ?? new Date(),
        dueDate: parsed.dueDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        paymentDate: parsed.paymentDate,
        paymentReference: parsed.paymentReference,
        cancellationReason: parsed.cancellationReason,
        employeeId: parsed.employeeId,
        pdfPath: null,
        items: { create: totals.preparedItems }
      }
    });
  });

  return attachInvoicePdf(id, userId, language);
};

export const updateInvoicePaymentStatus = async (
  id: string,
  userId: string,
  input: Record<string, unknown>
) => {
  await getInvoiceOrThrow(id, userId);
  const parsed = invoicePaymentStatusSchema.parse(input);

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: parsed.paymentStatus,
      cancellationReason: parsed.cancellationReason ?? null,
      paymentDate: parsed.paymentDate ?? null,
      paymentReference: parsed.paymentReference ?? null,
      pdfPath: null
    },
    include: includeItems
  });

  try {
    return await attachInvoicePdf(id, userId);
  } catch (error) {
    console.error("[invoice] Failed to regenerate PDF on status update:", error);
    return updatedInvoice;
  }
};

export const generatePdfForInvoice = async (
  id: string,
  userId: string,
  language: InvoicePdfLanguage = "en"
) => attachInvoicePdf(id, userId, language);

export const streamInvoicePdf = async (
  id: string,
  userId: string,
  language: InvoicePdfLanguage = "en",
  isAdmin = false
) => {
  const invoice = await getInvoiceOrThrow(id, userId, isAdmin);
  const shopSettings = shopSettingsToPdf(await getShopSettingsForUser(invoice.userId));
  return renderInvoicePdfBuffer(invoice, shopSettings, language);
};

export const deleteInvoice = async (id: string, userId: string, isAdmin = false) => {
  const invoice = await getInvoiceOrThrow(id, userId, isAdmin);

  await prisma.invoice.delete({ where: { id } });
  await fs.promises.rm(getInvoiceStorageDir(invoice.userId, invoice.invoiceNumber), {
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

export const copyInvoice = async (id: string, userId: string) => {
  const source = await getInvoiceOrThrow(id, userId);

  const items = source.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    vatPercent: Number(item.vatPercent)
  }));

  return createInvoice(userId, {
    repairOrderId: source.repairOrderId || undefined,
    customerName: source.customerName,
    customerAddress: source.customerAddress || undefined,
    customerPhone: source.customerPhone || undefined,
    customerEmail: source.customerEmail || undefined,
    deviceSummary: source.deviceSummary || undefined,
    repairSummary: source.repairSummary || undefined,
    paymentMethod: source.paymentMethod || undefined,
    paymentStatus: "Draft",
    notes: source.notes || undefined,
    serviceDate: source.serviceDate ?? new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    employeeId: source.employeeId || undefined,
    items
  });
};

export const cancelInvoice = async (id: string, userId: string, reason?: string) => {
  await getInvoiceOrThrow(id, userId);

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: "Cancelled",
      cancellationReason: reason ?? null,
      pdfPath: null
    },
    include: includeItems
  });

  try {
    return await attachInvoicePdf(id, userId);
  } catch (error) {
    console.error("[invoice] Failed to regenerate PDF on cancellation:", error);
    return updatedInvoice;
  }
};

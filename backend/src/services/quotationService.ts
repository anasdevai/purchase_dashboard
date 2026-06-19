import fs from "node:fs";
import { prisma } from "../config/prisma.js";
import { getDayRange } from "../utils/date.js";
import { HttpError } from "../utils/httpError.js";
import { ensureDirectory, getQuotationStorageDir } from "../utils/paths.js";
import { generateQuotationNumber } from "./numberingService.js";
import { generateQuotationPdf, generateRepairOrderPdf } from "./pdfService.js";
import {
  quotationSchema,
  quotationStatusSchema,
  searchQuotationsSchema
} from "../validators/quotationValidator.js";
import { getShopSettingsForUser, shopSettingsToPdf } from "./settingsService.js";
import { findOrCreateCustomerForRepair } from "./customerService.js";
import { generateRepairOrderNumber } from "./numberingService.js";
import { getRepairOrderStorageDir } from "../utils/paths.js";

const includeItems = {
  items: true,
  employee: { select: { id: true, name: true, email: true } },
  customer: true,
  repairOrders: { select: { id: true, repairOrderNumber: true } }
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toData = (input: Record<string, unknown>) => quotationSchema.parse(input);

/**
 * Automatically marks Draft/Sent quotations whose validUntilDate has passed as Expired.
 * Called on every read/search so no scheduled job is needed.
 */
const autoExpireQuotations = async (ownerUserId: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // start of today
  await prisma.quotation.updateMany({
    where: {
      userId: ownerUserId,
      status: { in: ["Draft", "Sent"] },
      validUntilDate: { lt: now }
    },
    data: { status: "Expired" }
  });
};

export const getQuotationOrThrow = async (idOrNumber: string, userId: string, isAdmin = false) => {
  // Expire stale quotations for this user before returning
  await autoExpireQuotations(userId);

  const quotation = await prisma.quotation.findFirst({
    where: UUID_RE.test(idOrNumber)
      ? (isAdmin ? { id: idOrNumber } : { id: idOrNumber, userId })
      : (isAdmin ? { quotationNumber: idOrNumber } : { quotationNumber: idOrNumber, userId }),
    include: includeItems
  });

  if (!quotation) {
    throw new HttpError(404, "Quotation not found");
  }

  return quotation;
};

const attachQuotationPdf = async (id: string, userId: string) => {
  const quotation = await getQuotationOrThrow(id, userId);
  const shopSettings = await getShopSettingsForUser(userId);
  const pdfPath = await generateQuotationPdf(quotation as any, shopSettingsToPdf(shopSettings));

  return prisma.quotation.update({
    where: { id },
    data: { pdfPath },
    include: includeItems
  });
};

export const createQuotation = async (userId: string, input: Record<string, unknown>) => {
  const parsed = toData(input);
  const { quotationNumber: _ignored, items, ...quotationData } = parsed;

  const customer = await findOrCreateCustomerForRepair(
    userId,
    quotationData.customerName,
    quotationData.customerPhone,
    quotationData.customerEmail,
    quotationData.customerAddress
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const quotationNumber = await generateQuotationNumber(userId);

    try {
      const quotation = await prisma.quotation.create({
        data: {
          userId,
          ...quotationData,
          quotationNumber,
          customerId: customer.id,
          items: {
            create: items.map((item) => {
              const unitPrice = Number(item.unitPrice);
              const quantity = Number(item.quantity);
              const discount = item.discount ? Number(item.discount) : 0;
              const lineTotal = Math.round(unitPrice * quantity * (1 - discount / 100));

              return {
                repairType: item.repairType,
                description: item.description,
                unitPrice,
                quantity,
                discount: item.discount ? discount : null,
                lineTotal
              };
            })
          }
        },
        include: includeItems
      });

      await ensureDirectory(getQuotationStorageDir(userId, quotation.quotationNumber));

      try {
        return await attachQuotationPdf(quotation.id, userId);
      } catch (pdfErr) {
        console.error("[quotation] Failed to generate PDF for new quotation, rolling back:", pdfErr);
        await prisma.quotation.delete({ where: { id: quotation.id } }).catch(() => {});
        throw pdfErr;
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new HttpError(500, "Unable to generate quotation number");
};

export const updateQuotation = async (id: string, userId: string, input: Record<string, unknown>, isAdmin = false) => {
  await getQuotationOrThrow(id, userId, isAdmin);
  const parsed = toData(input);
  const { quotationNumber: _ignored, items, ...quotationData } = parsed;

  const customer = await findOrCreateCustomerForRepair(
    userId,
    quotationData.customerName,
    quotationData.customerPhone,
    quotationData.customerEmail,
    quotationData.customerAddress
  );

  await prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });

    await tx.quotation.update({
      where: { id },
      data: {
        ...quotationData,
        customerId: customer.id,
        pdfPath: null, // Clear PDF path until regenerated
        items: {
          create: items.map((item) => {
            const unitPrice = Number(item.unitPrice);
            const quantity = Number(item.quantity);
            const discount = item.discount ? Number(item.discount) : 0;
            const lineTotal = Math.round(unitPrice * quantity * (1 - discount / 100));

            return {
              repairType: item.repairType,
              description: item.description,
              unitPrice,
              quantity,
              discount: item.discount ? discount : null,
              lineTotal
            };
          })
        }
      }
    });
  });

  return attachQuotationPdf(id, userId);
};

export const updateQuotationStatus = async (id: string, userId: string, input: Record<string, unknown>, isAdmin = false) => {
  await getQuotationOrThrow(id, userId, isAdmin);
  const parsed = quotationStatusSchema.parse(input);

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status: parsed.status },
    include: includeItems
  });

  // Regenerate PDF with new status
  try {
    return await attachQuotationPdf(id, userId);
  } catch (err) {
    console.error("[quotation] PDF regeneration failed on status change:", err);
    return updated;
  }
};

export const generatePdfForQuotation = async (id: string, userId: string, isAdmin = false) => {
  return attachQuotationPdf(id, userId);
};

export const copyQuotation = async (id: string, userId: string) => {
  const current = await getQuotationOrThrow(id, userId);

  const items = current.items.map((item) => ({
    repairType: item.repairType,
    description: item.description,
    unitPrice: Number(item.unitPrice.toString()),
    quantity: Number(item.quantity.toString()),
    discount: item.discount ? Number(item.discount.toString()) : undefined
  }));

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 14);

  return createQuotation(userId, {
    validUntilDate,
    status: "Draft",
    employeeId: current.employeeId,
    customerId: current.customerId,
    customerName: current.customerName,
    customerPhone: current.customerPhone,
    customerEmail: current.customerEmail,
    customerAddress: current.customerAddress,
    deviceType: current.deviceType,
    brand: current.brand,
    model: current.model,
    imeiOrSerial: current.imeiOrSerial,
    notes: current.notes ? `Cloned from ${current.quotationNumber}. ${current.notes}` : `Cloned from ${current.quotationNumber}`,
    items
  });
};

export const convertToRepairOrder = async (id: string, userId: string) => {
  const quotation = await getQuotationOrThrow(id, userId);

  // Check if repair order already exists
  const existingOrder = await prisma.repairOrder.findFirst({
    where: { userId, quotationId: quotation.id },
    select: { id: true, repairOrderNumber: true }
  });

  if (existingOrder) {
    throw new HttpError(409, "Quotation already converted to a Repair Order", {
      repairOrderId: existingOrder.id,
      repairOrderNumber: existingOrder.repairOrderNumber
    });
  }

  // Calculate quotation gross total to map as estimatedPrice
  const total = quotation.items.reduce((sum, item) => sum + Number(item.lineTotal.toString()), 0);

  // Join items descriptions
  const itemsSummary = quotation.items
    .map((item) => `[${item.repairType}] ${item.description} (Qty: ${item.quantity})`)
    .join("\n");

  const problemDescription = `Converted from Quotation ${quotation.quotationNumber}.\n\nServices Included:\n${itemsSummary}`;

  // Find or create customer
  const customer = await findOrCreateCustomerForRepair(
    userId,
    quotation.customerName,
    quotation.customerPhone,
    quotation.customerEmail,
    quotation.customerAddress
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const repairOrderNumber = await generateRepairOrderNumber(userId);

    try {
      const repairOrder = await prisma.$transaction(async (tx) => {
        // Create Repair Order
        const ro = await tx.repairOrder.create({
          data: {
            userId,
            repairOrderNumber,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            customerEmail: quotation.customerEmail,
            customerAddress: quotation.customerAddress,
            deviceType: quotation.deviceType,
            brand: quotation.brand,
            model: quotation.model,
            imeiOrSerial: quotation.imeiOrSerial,
            problemDescription,
            visibleDamage: "See quotation details",
            estimatedPrice: total,
            status: "Received",
            assignedEmployeeId: quotation.employeeId,
            customerId: customer.id,
            quotationId: quotation.id
          }
        });

        // Update Quotation Status to Accepted
        await tx.quotation.update({
          where: { id: quotation.id },
          data: { status: "Accepted" }
        });

        return ro;
      });

      await ensureDirectory(getRepairOrderStorageDir(userId, repairOrder.repairOrderNumber));

      // Auto-trigger PDF generation for Repair Order
      try {
        const shopSettings = await getShopSettingsForUser(userId);
        const roPdfPath = await generateRepairOrderPdf(repairOrder as any, shopSettingsToPdf(shopSettings));
        await prisma.repairOrder.update({
          where: { id: repairOrder.id },
          data: { pdfPath: roPdfPath }
        });
      } catch (pdfErr) {
        console.error("[quotation] Failed to generate PDF for converted Repair Order:", pdfErr);
      }

      // Re-trigger Quotation PDF update to show new status
      try {
        await attachQuotationPdf(quotation.id, userId);
      } catch (pdfErr) {
        console.error("[quotation] Failed to regenerate Quotation PDF:", pdfErr);
      }

      return repairOrder;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new HttpError(500, "Unable to generate repair order number");
};

export const deleteQuotation = async (id: string, userId: string, isAdmin = false) => {
  const quotation = await getQuotationOrThrow(id, userId, isAdmin);

  await prisma.quotation.delete({ where: { id } });
  await fs.promises.rm(getQuotationStorageDir(quotation.userId, quotation.quotationNumber), {
    recursive: true,
    force: true
  });

  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber
  };
};

export const searchQuotations = async (userId: string, query: Record<string, unknown>) => {
  // Expire stale quotations before listing so statuses are always current
  await autoExpireQuotations(userId);

  const parsed = searchQuotationsSchema.parse(query);
  const where: Record<string, unknown> = { userId };

  if (parsed.q) {
    where.OR = [
      { quotationNumber: { contains: parsed.q, mode: "insensitive" } },
      { customerName: { contains: parsed.q, mode: "insensitive" } },
      { customerPhone: { contains: parsed.q, mode: "insensitive" } },
      { model: { contains: parsed.q, mode: "insensitive" } }
    ];
  }

  if (parsed.quotationNumber) where.quotationNumber = { contains: parsed.quotationNumber, mode: "insensitive" };
  if (parsed.customerName) where.customerName = { contains: parsed.customerName, mode: "insensitive" };
  if (parsed.phone) where.customerPhone = { contains: parsed.phone, mode: "insensitive" };
  if (parsed.model) where.model = { contains: parsed.model, mode: "insensitive" };
  if (parsed.status) where.status = parsed.status;

  return prisma.quotation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: includeItems
  });
};

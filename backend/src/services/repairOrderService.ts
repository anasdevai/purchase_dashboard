import fs from "node:fs";
import { prisma } from "../config/prisma.js";
import { getDayRange } from "../utils/date.js";
import { HttpError } from "../utils/httpError.js";
import { ensureDirectory, getRepairOrderStorageDir } from "../utils/paths.js";
import { generateRepairOrderNumber } from "./numberingService.js";
import { generateRepairOrderPdf } from "./pdfService.js";
import {
  repairOrderSchema,
  repairOrderStatusSchema,
  searchRepairOrdersSchema
} from "../validators/repairOrderValidators.js";
import { getShopSettingsForUser, shopSettingsToPdf } from "./settingsService.js";

const toData = (input: Record<string, unknown>) => repairOrderSchema.parse(input);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getRepairOrderOrThrow = async (idOrNumber: string, userId: string, isAdmin = false) => {
  const repairOrder = await prisma.repairOrder.findFirst({
    where: UUID_RE.test(idOrNumber)
      ? (isAdmin ? { id: idOrNumber } : { id: idOrNumber, userId })
      : (isAdmin ? { repairOrderNumber: idOrNumber } : { repairOrderNumber: idOrNumber, userId }),
    include: { invoices: { select: { id: true, invoiceNumber: true, pdfPath: true } } }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }

  return repairOrder;
};

export const createRepairOrder = async (userId: string, input: Record<string, unknown>) => {
  const parsed = toData(input);
  const { repairOrderNumber: _ignored, ...orderData } = parsed;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const repairOrderNumber = await generateRepairOrderNumber(userId);

    try {
      const repairOrder = await prisma.repairOrder.create({
        data: {
          userId,
          ...orderData,
          repairOrderNumber
        }
      });

      await ensureDirectory(getRepairOrderStorageDir(userId, repairOrder.repairOrderNumber));
      return repairOrder;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new HttpError(500, "Unable to generate repair order number");
};

export const updateRepairOrder = async (id: string, userId: string, input: Record<string, unknown>, isAdmin = false) => {
  await getRepairOrderOrThrow(id, userId, isAdmin);
  const parsed = toData(input);
  const { repairOrderNumber: _ignored, ...orderData } = parsed;

  await prisma.repairOrder.update({
    where: { id },
    data: orderData
  });

  return getRepairOrderOrThrow(id, userId, isAdmin);
};

export const updateRepairOrderStatus = async (
  id: string,
  userId: string,
  input: Record<string, unknown>,
  isAdmin = false
) => {
  await getRepairOrderOrThrow(id, userId, isAdmin);
  const parsed = repairOrderStatusSchema.parse(input);

  await prisma.repairOrder.update({
    where: { id },
    data: { status: parsed.status }
  });

  return getRepairOrderOrThrow(id, userId, isAdmin);
};

export const generatePdfForRepairOrder = async (id: string, userId: string, isAdmin = false) => {
  const repairOrder = await getRepairOrderOrThrow(id, userId, isAdmin);
  const shopSettings = await getShopSettingsForUser(repairOrder.userId);
  const pdfPath = await generateRepairOrderPdf(repairOrder, shopSettingsToPdf(shopSettings));

  return prisma.repairOrder.update({
    where: { id },
    data: { pdfPath }
  });
};

export const deleteRepairOrder = async (id: string, userId: string, isAdmin = false) => {
  const repairOrder = await getRepairOrderOrThrow(id, userId, isAdmin);

  await prisma.repairOrder.delete({ where: { id } });
  await fs.promises.rm(getRepairOrderStorageDir(repairOrder.userId, repairOrder.repairOrderNumber), {
    recursive: true,
    force: true
  });

  return {
    id: repairOrder.id,
    repairOrderNumber: repairOrder.repairOrderNumber
  };
};

export const searchRepairOrders = async (userId: string, query: Record<string, unknown>) => {
  const parsed = searchRepairOrdersSchema.parse(query);
  const where: Record<string, unknown> = { userId };

  if (parsed.q) {
    where.OR = [
      { repairOrderNumber: { contains: parsed.q, mode: "insensitive" } },
      { customerName: { contains: parsed.q, mode: "insensitive" } },
      { customerPhone: { contains: parsed.q, mode: "insensitive" } },
      { model: { contains: parsed.q, mode: "insensitive" } },
      { imeiOrSerial: { contains: parsed.q, mode: "insensitive" } }
    ];
  }

  if (parsed.repairOrderNumber) where.repairOrderNumber = { contains: parsed.repairOrderNumber, mode: "insensitive" };
  if (parsed.customerName) where.customerName = { contains: parsed.customerName, mode: "insensitive" };
  if (parsed.phone) where.customerPhone = { contains: parsed.phone, mode: "insensitive" };
  if (parsed.model) where.model = { contains: parsed.model, mode: "insensitive" };
  if (parsed.imeiOrSerial) where.imeiOrSerial = { contains: parsed.imeiOrSerial, mode: "insensitive" };
  if (parsed.status) where.status = parsed.status;

  return prisma.repairOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100
  });
};

export const getRepairOrderStats = async (userId: string) => {
  const range = getDayRange();

  return prisma.repairOrder.count({
    where: {
      userId,
      ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {})
    }
  });
};

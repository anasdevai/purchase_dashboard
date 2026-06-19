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
import * as emailService from "./emailService.js";
import { findOrCreateCustomerForRepair } from "./customerService.js";
import { createPickupAppointmentFromOrder } from "./appointmentService.js";

const toData = (input: Record<string, unknown>) => repairOrderSchema.parse(input);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getRepairOrderOrThrow = async (idOrNumber: string, userId: string, isAdmin = false) => {
  const repairOrder = await prisma.repairOrder.findFirst({
    where: UUID_RE.test(idOrNumber)
      ? (isAdmin ? { id: idOrNumber } : { id: idOrNumber, userId })
      : (isAdmin ? { repairOrderNumber: idOrNumber } : { repairOrderNumber: idOrNumber, userId }),
    include: {
      invoices: { select: { id: true, invoiceNumber: true, pdfPath: true } },
      history: { orderBy: { createdAt: "asc" } },
      assignedEmployee: { select: { id: true, name: true, email: true } },
      customer: true
    }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }

  return repairOrder;
};

export const createRepairOrder = async (userId: string, input: Record<string, unknown>) => {
  const parsed = toData(input);
  const { repairOrderNumber: _ignored, ...orderData } = parsed;

  const customer = await findOrCreateCustomerForRepair(
    userId,
    orderData.customerName,
    orderData.customerPhone,
    orderData.customerEmail,
    orderData.customerAddress
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const repairOrderNumber = await generateRepairOrderNumber(userId);

    try {
      const repairOrder = await prisma.repairOrder.create({
        data: {
          userId,
          ...orderData,
          repairOrderNumber,
          customerId: customer.id
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

async function triggerStatusChangeEmails(current: any, toStatus: string) {
  try {
    if (toStatus === "Finished" && current.customerEmail) {
      await emailService.sendRepairFinishedEmail(
        current.userId,
        current.customerEmail,
        current.repairOrderNumber,
        current.customerName
      );
    } else if (toStatus === "ReadyForPickup") {
      const shopSettings = await getShopSettingsForUser(current.userId);
      const shopAddress = shopSettings.shopAddress || null;
      const openingHours = "Mo-Fr: 09:00 - 18:00, Sa: 09:00 - 13:00";
      
      if (current.customerEmail) {
        await emailService.sendReadyForPickupEmail(
          current.userId,
          current.customerEmail,
          current.repairOrderNumber,
          current.customerName,
          shopAddress,
          openingHours
        );
      }

      // Automatically create a pickup appointment for tomorrow at 10 AM
      const tomorrowAtTen = new Date();
      tomorrowAtTen.setDate(tomorrowAtTen.getDate() + 1);
      tomorrowAtTen.setHours(10, 0, 0, 0);
      
      await createPickupAppointmentFromOrder(
        current.userId,
        current.id,
        tomorrowAtTen.toISOString()
      );
    } else if (toStatus === "SparePartArrived") {
      const user = await prisma.user.findUnique({
        where: { id: current.userId },
        select: { email: true }
      });
      if (user?.email) {
        await emailService.sendSparePartArrivedNotification(
          current.userId,
          user.email,
          current.repairOrderNumber
        );
      }
    }
  } catch (emailErr) {
    console.error("Failed to send status update email:", emailErr);
  }
}

export const updateRepairOrder = async (id: string, userId: string, input: Record<string, unknown>, employeeName: string, isAdmin = false) => {
  const current = await getRepairOrderOrThrow(id, userId, isAdmin);
  const parsed = toData(input);
  const { repairOrderNumber: _ignored, ...orderData } = parsed;

  const customer = await findOrCreateCustomerForRepair(
    userId,
    orderData.customerName,
    orderData.customerPhone,
    orderData.customerEmail,
    orderData.customerAddress
  );

  await prisma.repairOrder.update({
    where: { id },
    data: {
      ...orderData,
      customerId: customer.id
    }
  });

  if (orderData.status && current.status !== orderData.status) {
    await prisma.repairOrderHistory.create({
      data: {
        repairOrderId: id,
        userId: current.userId,
        employeeName,
        fromStatus: current.status,
        toStatus: orderData.status,
        comment: "Status updated in repair order editor"
      }
    });

    // Trigger auto-notifications
    void triggerStatusChangeEmails(current, orderData.status);
  }

  return getRepairOrderOrThrow(id, userId, isAdmin);
};

export const updateRepairOrderStatus = async (
  id: string,
  userId: string,
  input: Record<string, unknown>,
  employeeName: string,
  isAdmin = false
) => {
  const current = await getRepairOrderOrThrow(id, userId, isAdmin);
  const parsed = repairOrderStatusSchema.parse(input);

  await prisma.repairOrder.update({
    where: { id },
    data: { status: parsed.status }
  });

  if (current.status !== parsed.status) {
    await prisma.repairOrderHistory.create({
      data: {
        repairOrderId: id,
        userId: current.userId,
        employeeName,
        fromStatus: current.status,
        toStatus: parsed.status,
        comment: parsed.comment || null
      }
    });

    // Trigger auto-notifications
    void triggerStatusChangeEmails(current, parsed.status);
  }

  return getRepairOrderOrThrow(id, userId, isAdmin);
};

export const addHistoryComment = async (
  id: string,
  userId: string,
  employeeName: string,
  comment: string,
  isAdmin = false
) => {
  const current = await getRepairOrderOrThrow(id, userId, isAdmin);

  return prisma.repairOrderHistory.create({
    data: {
      repairOrderId: id,
      userId: current.userId,
      employeeName,
      fromStatus: current.status,
      toStatus: current.status,
      comment
    }
  });
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

import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { repairRequestsRoot, ensureDirectory, toRelativeStoragePath } from "../utils/paths.js";
import { findOrCreateCustomerForRepair } from "./customerService.js";
import { generateRepairOrderNumber } from "./numberingService.js";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export const getPublicWidgetSettings = async (shopId: string) => {
  const settings = await prisma.shopSettings.findUnique({
    where: { userId: shopId },
    select: {
      shopName: true,
      logoDataUrl: true,
      widgetPrimaryColor: true,
      widgetAccentColor: true,
      widgetFont: true,
      widgetShowLogo: true
    }
  });
  if (!settings) {
    throw new HttpError(404, "Shop settings not found");
  }
  return settings;
};

export const getPublicBrands = async () => {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
};

export const getPublicDeviceTypes = async (brandId: string) => {
  return prisma.deviceType.findMany({
    where: { brandId, isActive: true },
    orderBy: { name: "asc" }
  });
};

export const getPublicModels = async (deviceTypeId: string) => {
  return prisma.model.findMany({
    where: { deviceTypeId, isActive: true },
    orderBy: { name: "asc" }
  });
};

export const getPublicRepairTypes = async () => {
  return prisma.repairType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
};

export const getRepairPrice = async (modelId: string, repairTypeId: string) => {
  const override = await prisma.priceList.findFirst({
    where: { modelId, repairTypeId, isActive: true }
  });
  if (override) {
    return {
      price: Number(override.price),
      duration: override.duration || 0
    };
  }
  const repairType = await prisma.repairType.findUnique({
    where: { id: repairTypeId }
  });
  if (!repairType) {
    throw new HttpError(404, "Repair type not found");
  }
  return {
    price: repairType.standardPrice ? Number(repairType.standardPrice) : 0,
    duration: repairType.duration || 0
  };
};

export const createRepairRequest = async (data: any, file?: Express.Multer.File) => {
  const user = await prisma.user.findUnique({
    where: { id: data.shopId }
  });
  if (!user) {
    throw new HttpError(404, "Shop not found");
  }

  const request = await prisma.repairRequest.create({
    data: {
      userId: data.shopId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      deviceBrand: data.deviceBrand,
      deviceType: data.deviceType,
      deviceModel: data.deviceModel,
      repairType: data.repairType,
      issueDescription: data.issueDescription,
      photoPath: null,
      preferredAppointment: data.preferredAppointment ? new Date(data.preferredAppointment) : null,
      status: "New"
    }
  });

  if (file) {
    const extension = extensionByMimeType[file.mimetype] || ".jpg";
    const storageDir = path.join(repairRequestsRoot, request.userId, request.id);
    await ensureDirectory(storageDir);
    const absolutePath = path.join(storageDir, `damage_photo${extension}`);
    await fs.promises.writeFile(absolutePath, file.buffer);
    const photoPath = toRelativeStoragePath(absolutePath);

    return prisma.repairRequest.update({
      where: { id: request.id },
      data: { photoPath }
    });
  }

  return request;
};

// Authenticated methods
export const listRepairRequests = async (userId: string, status?: string) => {
  const where: any = { userId };
  if (status) {
    where.status = status;
  }
  return prisma.repairRequest.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
};

export const updateRepairRequestStatus = async (id: string, userId: string, status: string) => {
  const request = await prisma.repairRequest.findFirst({
    where: { id, userId }
  });
  if (!request) {
    throw new HttpError(404, "Repair request not found");
  }
  return prisma.repairRequest.update({
    where: { id },
    data: { status: status as any }
  });
};

export const convertRepairRequestToOrder = async (id: string, userId: string) => {
  const request = await prisma.repairRequest.findFirst({
    where: { id, userId }
  });
  if (!request) {
    throw new HttpError(404, "Repair request not found");
  }
  if (request.repairOrderCreatedId) {
    throw new HttpError(400, "Repair request has already been converted to an order");
  }

  // 1. Find or create customer
  const customer = await findOrCreateCustomerForRepair(
    userId,
    request.customerName,
    request.customerPhone,
    request.customerEmail,
    null // Address is not collected in public widget, let findOrCreateCustomerForRepair handle it
  );

  // 2. Lookup matching price if model & repair type exists
  const modelRecord = await prisma.model.findFirst({
    where: { name: request.deviceModel, isActive: true }
  });
  const repairTypeRecord = await prisma.repairType.findFirst({
    where: { name: request.repairType, isActive: true }
  });

  let estimatedPrice = null;
  if (modelRecord && repairTypeRecord) {
    try {
      const priceInfo = await getRepairPrice(modelRecord.id, repairTypeRecord.id);
      estimatedPrice = priceInfo.price;
    } catch {
      // Fallback if not found
    }
  }

  // 3. Generate sequential repair order number
  const repairOrderNumber = await generateRepairOrderNumber(userId);

  return prisma.$transaction(async (tx) => {
    // A. Create repair order
    const repairOrder = await tx.repairOrder.create({
      data: {
        userId,
        repairOrderNumber,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        deviceType: request.deviceType,
        brand: request.deviceBrand,
        model: request.deviceModel,
        problemDescription: request.issueDescription,
        estimatedPrice,
        customerId: customer.id,
        status: "Received" // Default starting status of a Repair Order
      }
    });

    // B. Update RepairRequest with relations and completed status
    await tx.repairRequest.update({
      where: { id: request.id },
      data: {
        status: "Completed",
        customerCreatedId: customer.id,
        repairOrderCreatedId: repairOrder.id
      }
    });

    // C. Create appointment if preferredAppointment exists
    if (request.preferredAppointment) {
      await tx.appointment.create({
        data: {
          userId,
          title: `Repair Appointment: ${request.customerName} - ${request.deviceModel}`,
          customerId: customer.id,
          deviceBrand: request.deviceBrand,
          deviceModel: request.deviceModel,
          repairOrderId: repairOrder.id,
          startTime: request.preferredAppointment,
          endTime: new Date(new Date(request.preferredAppointment).getTime() + 60 * 60 * 1000), // 1 hour duration
          duration: 60,
          note: `Created from Website Request Widget: ${request.issueDescription}`,
          status: "Booked",
          source: "Website"
        }
      });
    }

    return repairOrder;
  });
};

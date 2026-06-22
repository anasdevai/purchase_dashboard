import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { runInventoryQuery } from "../utils/inventoryPrisma.js";
import { createSparePartSchema, updateSparePartSchema, adjustStockSchema } from "../validators/sparePartValidators.js";

// We will dynamically call the auto-order checker to avoid circular dependencies
let orderCheckTrigger: ((userId: string, partId: string) => Promise<void>) | null = null;
export const registerOrderCheckTrigger = (fn: typeof orderCheckTrigger) => {
  orderCheckTrigger = fn;
};

export const listSpareParts = async (
  userId: string,
  category?: string,
  activeOnly = false
) => {
  const where: any = { userId };
  if (category) where.category = category;
  if (activeOnly) where.isActive = true;

  return runInventoryQuery("listSpareParts", () =>
    prisma.sparePart.findMany({
      where,
      include: { supplier: true },
      orderBy: { itemNumber: "asc" },
    })
  ).then((parts) => parts ?? []);
};

export const getSparePartById = async (id: string, userId: string) => {
  const part = await prisma.sparePart.findFirst({
    where: { id, userId },
    include: { supplier: true }
  });

  if (!part) {
    throw new HttpError(404, "Spare part not found");
  }

  return part;
};

export const createSparePart = async (userId: string, input: Record<string, unknown>) => {
  const parsed = createSparePartSchema.parse(input);

  // If supplierId is provided, assert its existence and user access
  if (parsed.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: parsed.supplierId, userId }
    });
    if (!supplier) {
      throw new HttpError(400, "Invalid supplier selection");
    }
  }

  try {
    const created = await prisma.sparePart.create({
      data: {
        userId,
        itemNumber: parsed.itemNumber,
        name: parsed.name,
        category: parsed.category,
        compatibility: parsed.compatibility,
        stock: parsed.stock,
        minimumStock: parsed.minimumStock,
        supplierId: parsed.supplierId || null,
        purchasePrice: parsed.purchasePrice,
        salePrice: parsed.salePrice,
        storageLocation: parsed.storageLocation || null,
        isActive: parsed.isActive
      },
      include: { supplier: true }
    });

    // Trigger auto order check in case initial stock is below minimum
    if (orderCheckTrigger) {
      void orderCheckTrigger(userId, created.id).catch(err =>
        console.error("Auto-order check failed during part creation:", err)
      );
    }

    return created;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A spare part with this item number already exists");
    }
    throw error;
  }
};

export const updateSparePart = async (id: string, userId: string, input: Record<string, unknown>) => {
  const existing = await getSparePartById(id, userId);
  const parsed = updateSparePartSchema.parse(input);

  if (parsed.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: parsed.supplierId, userId }
    });
    if (!supplier) {
      throw new HttpError(400, "Invalid supplier selection");
    }
  }

  try {
    const updated = await prisma.sparePart.update({
      where: { id },
      data: {
        itemNumber: parsed.itemNumber,
        name: parsed.name,
        category: parsed.category,
        compatibility: parsed.compatibility,
        stock: parsed.stock,
        minimumStock: parsed.minimumStock,
        supplierId: parsed.supplierId,
        purchasePrice: parsed.purchasePrice,
        salePrice: parsed.salePrice,
        storageLocation: parsed.storageLocation,
        isActive: parsed.isActive
      },
      include: { supplier: true }
    });

    // Trigger auto order check in case new parameters make stock below minimum
    if (orderCheckTrigger) {
      void orderCheckTrigger(userId, updated.id).catch(err =>
        console.error("Auto-order check failed during part update:", err)
      );
    }

    return updated;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A spare part with this item number already exists");
    }
    throw error;
  }
};

export const deleteSparePart = async (id: string, userId: string) => {
  const existing = await getSparePartById(id, userId);
  await prisma.sparePart.delete({ where: { id } });
  return { id: existing.id, itemNumber: existing.itemNumber, name: existing.name };
};

export const adjustStock = async (id: string, userId: string, input: Record<string, unknown>) => {
  const part = await getSparePartById(id, userId);
  const parsed = adjustStockSchema.parse(input);

  const newStock = part.stock + parsed.quantityDiff;
  if (newStock < 0) {
    throw new HttpError(400, "Cannot reduce stock below zero");
  }

  const [updatedPart, adjustment] = await prisma.$transaction([
    prisma.sparePart.update({
      where: { id },
      data: { stock: newStock },
      include: { supplier: true }
    }),
    prisma.stockAdjustment.create({
      data: {
        userId,
        sparePartId: id,
        quantityDiff: parsed.quantityDiff,
        reason: parsed.reason
      }
    })
  ]);

  // Trigger auto order check when stock drops
  if (parsed.quantityDiff < 0 && orderCheckTrigger) {
    void orderCheckTrigger(userId, id).catch(err =>
      console.error("Auto-order check failed during stock adjustment:", err)
    );
  }

  return { part: updatedPart, adjustment };
};

export const getStockAdjustmentsHistory = async (userId: string, sparePartId?: string) => {
  const where: any = { userId };
  if (sparePartId) where.sparePartId = sparePartId;

  return runInventoryQuery("getStockAdjustmentsHistory", () =>
    prisma.stockAdjustment.findMany({
      where,
      include: {
        sparePart: {
          select: {
            id: true,
            itemNumber: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  ).then((rows) => rows ?? []);
};

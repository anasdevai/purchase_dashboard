import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { generateInventoryOrderNumber } from "./numberingService.js";
import { registerOrderCheckTrigger } from "./sparePartService.js";

export const listOrders = async (
  userId: string,
  supplierId?: string,
  status?: string
) => {
  const where: any = { userId };
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  return prisma.inventoryOrder.findMany({
    where,
    include: { supplier: true, items: { include: { sparePart: true } } },
    orderBy: { createdAt: "desc" }
  });
};

export const getOrderById = async (id: string, userId: string) => {
  const order = await prisma.inventoryOrder.findFirst({
    where: { id, userId },
    include: {
      supplier: true,
      items: {
        include: {
          sparePart: true
        }
      }
    }
  });

  if (!order) {
    throw new HttpError(404, "Inventory order not found");
  }

  return order;
};

export const createOrder = async (
  userId: string,
  supplierId: string,
  items: { sparePartId: string; quantity: number }[],
  expectedDate?: Date
) => {
  if (!items || items.length === 0) {
    throw new HttpError(400, "Order must contain at least one item");
  }

  // Validate supplier
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, userId }
  });
  if (!supplier) {
    throw new HttpError(400, "Invalid supplier selection");
  }

  // Validate spare parts belong to the user
  const partIds = items.map(i => i.sparePartId);
  const parts = await prisma.sparePart.findMany({
    where: { id: { in: partIds }, userId }
  });

  if (parts.length !== partIds.length) {
    throw new HttpError(400, "One or more selected spare parts are invalid");
  }

  const orderNumber = await generateInventoryOrderNumber(userId);

  return prisma.$transaction(async (tx) => {
    const order = await tx.inventoryOrder.create({
      data: {
        userId,
        orderNumber,
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: "Ordered"
      }
    });

    const itemCreations = items.map(item =>
      tx.inventoryOrderItem.create({
        data: {
          orderId: order.id,
          sparePartId: item.sparePartId,
          quantityOrdered: item.quantity,
          quantityReceived: 0
        }
      })
    );

    await Promise.all(itemCreations);

    return tx.inventoryOrder.findUnique({
      where: { id: order.id },
      include: { supplier: true, items: { include: { sparePart: true } } }
    });
  });
};

export const cancelOrder = async (id: string, userId: string) => {
  const order = await getOrderById(id, userId);

  if (order.status === "Delivered" || order.status === "Cancelled") {
    throw new HttpError(400, `Cannot cancel an order in status: ${order.status}`);
  }

  return prisma.inventoryOrder.update({
    where: { id },
    data: { status: "Cancelled" },
    include: { supplier: true }
  });
};

export const checkAndAutoOrderPart = async (userId: string, sparePartId: string) => {
  const part = await prisma.sparePart.findUnique({
    where: { id: sparePartId },
    select: {
      id: true,
      name: true,
      stock: true,
      minimumStock: true,
      supplierId: true,
      userId: true
    }
  });

  if (!part) return;

  // Check if stock is actually below minimum
  if (part.stock >= part.minimumStock) return;

  // Check if there is already an active order containing this part
  const activeOrderWithPart = await prisma.inventoryOrderItem.findFirst({
    where: {
      sparePartId,
      order: {
        userId,
        status: { in: ["Ordered", "Shipped", "PartiallyDelivered"] }
      }
    }
  });

  if (activeOrderWithPart) {
    // Already ordered and pending delivery, do not duplicate
    return;
  }

  // If no supplier linked, we cannot auto-order
  if (!part.supplierId) {
    console.warn(`[Auto-Order] Cannot trigger auto-order for part "${part.name}" (${part.id}): No supplier linked.`);
    return;
  }

  // Calculate order quantity: Replenish to double the minimum stock (or minimum of 10)
  const replenishQty = Math.max(10, (part.minimumStock * 2) - part.stock);

  console.log(`[Auto-Order] Stock (${part.stock}) below minimum (${part.minimumStock}) for "${part.name}". Triggering replenishment order for ${replenishQty} units.`);

  try {
    const expectedDelivery = new Date();
    // Default expected delivery: 7 days from now
    expectedDelivery.setDate(expectedDelivery.getDate() + 7);

    await createOrder(
      userId,
      part.supplierId,
      [{ sparePartId, quantity: replenishQty }],
      expectedDelivery
    );
  } catch (err) {
    console.error(`[Auto-Order] Failed to create auto-order for part ${sparePartId}:`, err);
  }
};

// Register trigger in sparePartService to close circular dependency loop
registerOrderCheckTrigger(checkAndAutoOrderPart);

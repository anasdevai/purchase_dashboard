import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { getOrderById } from "./inventoryOrderService.js";

export const bookGoodsReceipt = async (
  userId: string,
  orderId: string,
  items: { sparePartId: string; quantityReceived: number }[],
  notes?: string
) => {
  const order = await getOrderById(orderId, userId);

  if (order.status === "Delivered" || order.status === "Cancelled") {
    throw new HttpError(400, `Cannot book goods receipt for an order with status: ${order.status}`);
  }

  if (!items || items.length === 0) {
    throw new HttpError(400, "Goods receipt must contain at least one item");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Process each received item
    for (const item of items) {
      if (item.quantityReceived <= 0) continue;

      // Find the corresponding order item
      const orderItem = order.items.find(i => i.sparePartId === item.sparePartId);
      if (!orderItem) {
        throw new HttpError(400, `Part ${item.sparePartId} is not in this order`);
      }

      const newReceived = orderItem.quantityReceived + item.quantityReceived;

      // Update the Order Item received quantity
      await tx.inventoryOrderItem.update({
        where: { id: orderItem.id },
        data: { quantityReceived: newReceived }
      });

      // Update the Spare Part stock
      await tx.sparePart.update({
        where: { id: item.sparePartId },
        data: {
          stock: {
            increment: item.quantityReceived
          }
        }
      });
    }

    // 2. Create the Goods Receipt record
    const receipt = await tx.goodsReceipt.create({
      data: {
        userId,
        orderId,
        notes: notes || null
      }
    });

    // 3. Re-evaluate order status
    const updatedOrderItems = await tx.inventoryOrderItem.findMany({
      where: { orderId }
    });

    let allFullyReceived = true;
    let anyReceived = false;

    for (const item of updatedOrderItems) {
      if (item.quantityReceived < item.quantityOrdered) {
        allFullyReceived = false;
      }
      if (item.quantityReceived > 0) {
        anyReceived = true;
      }
    }

    let newStatus = order.status;
    if (allFullyReceived) {
      newStatus = "Delivered";
    } else if (anyReceived) {
      newStatus = "PartiallyDelivered";
    }

    await tx.inventoryOrder.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // 4. Calculate deviations for reporting back
    const deviations = updatedOrderItems.map(item => {
      const part = order.items.find(i => i.sparePartId === item.sparePartId)?.sparePart;
      const diff = item.quantityOrdered - item.quantityReceived;
      return {
        sparePartId: item.sparePartId,
        name: part?.name || "Unknown",
        ordered: item.quantityOrdered,
        received: item.quantityReceived,
        deviation: diff > 0 ? diff : 0
      };
    }).filter(d => d.deviation > 0);

    const hasDeviations = deviations.length > 0;

    return {
      receipt,
      orderStatus: newStatus,
      hasDeviations,
      deviations
    };
  });
};

export const getGoodsReceiptsList = async (userId: string, orderId?: string) => {
  const where: any = { userId };
  if (orderId) where.orderId = orderId;

  return prisma.goodsReceipt.findMany({
    where,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          supplier: {
            select: {
              companyName: true
            }
          }
        }
      }
    },
    orderBy: { receivedDate: "desc" }
  });
};

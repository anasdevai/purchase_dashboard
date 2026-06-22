import type { PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "./httpError.js";

type InventoryDelegateName = "supplier" | "sparePart" | "inventoryOrder" | "stockAdjustment";

const INVENTORY_DELEGATES: InventoryDelegateName[] = [
  "supplier",
  "sparePart",
  "inventoryOrder",
  "stockAdjustment",
];

/** Ensures inventory Prisma delegates exist (client was generated after schema update). */
export const assertInventoryPrismaReady = (): void => {
  const missing = INVENTORY_DELEGATES.filter((name) => {
    const delegate = (prisma as PrismaClient)[name];
    return !delegate || typeof (delegate as { findMany?: unknown }).findMany !== "function";
  });

  if (missing.length > 0) {
    console.error(
      `[inventory] Prisma client missing delegates: ${missing.join(", ")}. Run "npm run prisma:generate" in the backend folder.`
    );
    throw new HttpError(
      503,
      "Inventory database client is not ready. Run prisma generate and migrate deploy, then restart the backend server."
    );
  }
};

export const runInventoryQuery = async <T>(
  label: string,
  query: () => Promise<T>
): Promise<T> => {
  assertInventoryPrismaReady();
  try {
    return await query();
  } catch (error) {
    console.error(`[inventory] ${label} failed:`, error);
    throw error;
  }
};

import { z } from "zod";

export const createSparePartSchema = z.object({
  itemNumber: z.string().trim().min(1, "Item number is required").max(100),
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  compatibility: z.string().trim().min(1, "Compatibility description is required").max(500),
  stock: z.number().int().nonnegative().default(0),
  minimumStock: z.number().int().nonnegative().default(0),
  supplierId: z.string().uuid("Invalid supplier ID").optional().nullable(),
  purchasePrice: z.number().nonnegative("Purchase price must be positive"),
  salePrice: z.number().nonnegative("Sale price must be positive"),
  storageLocation: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateSparePartSchema = createSparePartSchema.partial();

export const adjustStockSchema = z.object({
  quantityDiff: z.number().int().refine(val => val !== 0, {
    message: "Adjustment difference cannot be zero"
  }),
  reason: z.string().trim().min(1, "Adjustment reason is required").max(255),
});

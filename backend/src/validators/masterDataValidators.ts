import { z } from "zod";

const requiredString = (max = 100) => z.string().trim().min(1).max(max);
const uuidString = () => z.string().uuid();

export const createBrandSchema = z.object({
  name: requiredString(),
  logoUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateBrandSchema = createBrandSchema.partial();

export const createDeviceTypeSchema = z.object({
  name: requiredString(),
  brandId: uuidString(),
  isActive: z.boolean().optional()
});

export const updateDeviceTypeSchema = createDeviceTypeSchema.partial();

export const createModelSchema = z.object({
  name: requiredString(),
  deviceTypeId: uuidString(),
  brandId: uuidString(),
  generation: z.string().trim().max(100).optional().nullable(),
  storageOptions: z.array(z.string()).optional(),
  colorOptions: z.array(z.string()).optional(),
  releaseYear: z.number().int().min(1990).max(new Date().getFullYear() + 2).optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateModelSchema = createModelSchema.partial();

export const createRepairTypeSchema = z.object({
  name: requiredString(),
  category: z.enum([
    "Display",
    "Battery",
    "WaterDamage",
    "Software",
    "LogicBoard",
    "Camera",
    "ChargingPort",
    "Keyboard",
    "Other"
  ]),
  standardPrice: z.number().nonnegative().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  difficulty: z.enum(["Easy", "Medium", "Difficult", "Expert"]).optional().nullable(),
  isActive: z.boolean().optional()
});

export const updateRepairTypeSchema = createRepairTypeSchema.partial();

export const createPriceListSchema = z.object({
  modelId: uuidString(),
  repairTypeId: uuidString(),
  price: z.number().nonnegative(),
  duration: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional()
});

export const updatePriceListSchema = createPriceListSchema.partial();

import { z } from "zod";

export const repairOrderStatuses = [
  "Received",
  "InProgress",
  "WaitingForParts",
  "ReadyForPickup",
  "Completed",
  "Cancelled"
] as const;

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(1000).optional()
);

const requiredText = (max = 1000) => z.string().trim().min(1).max(max);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional()
);

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce
    .number()
    .min(0, "Amount must be zero or greater")
    .optional()
    .refine((val) => val === undefined || Number.isFinite(val), "Invalid amount")
);

export const repairOrderSchema = z.object({
  repairOrderNumber: optionalText,
  customerName: requiredText(150),
  customerPhone: requiredText(60),
  customerEmail: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.string().trim().email().max(150).optional()
  ),
  customerAddress: optionalText,
  deviceType: requiredText(100),
  brand: requiredText(100),
  model: requiredText(150),
  imeiOrSerial: optionalText,
  passwordPin: optionalText,
  accessoriesReceived: optionalText,
  problemDescription: requiredText(2000),
  visibleDamage: requiredText(2000),
  technicianNotes: optionalText,
  estimatedPrice: optionalMoney,
  depositAmount: optionalMoney,
  expectedCompletionDate: optionalDate,
  status: z.enum(repairOrderStatuses).optional()
});

export const searchRepairOrdersSchema = z.object({
  q: optionalText,
  repairOrderNumber: optionalText,
  customerName: optionalText,
  phone: optionalText,
  model: optionalText,
  imeiOrSerial: optionalText,
  status: z.enum(repairOrderStatuses).optional()
});

export const repairOrderStatusSchema = z.object({
  status: z.enum(repairOrderStatuses)
});

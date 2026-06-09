import { z } from "zod";

export const deviceTypes = [
  "Smartphone",
  "Tablet",
  "Laptop",
  "Desktop PC",
  "Smartwatch",
  "Gaming console",
  "Other"
] as const;

export const conditions = ["Like new", "Very good", "Good", "Used", "Defective"] as const;

export const paymentMethods = ["Cash", "Bank transfer", "Card", "Other"] as const;

const optionalText = z
  .preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(1000).optional());

const optionalImei = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.string().trim().regex(/^\d{15}$/, "IMEI must be exactly 15 digits").optional()
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional()
);

const optionalPrice = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.number().positive().optional()
);

export const draftContractSchema = z.object({
  customerName: optionalText,
  customerAddress: optionalText,
  customerPhone: optionalText,
  customerEmail: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.string().trim().email().max(150).optional()
  ),
  customerDateOfBirth: optionalDate,
  idDocumentNumber: optionalText,
  // Allow arbitrary device types (presets + custom "Other" values).
  deviceType: optionalText,
  brand: optionalText,
  model: optionalText,
  imei: optionalImei,
  serialNumber: optionalText,
  storage: optionalText,
  color: optionalText,
  condition: z.enum(conditions).optional(),
  accessories: optionalText,
  batteryHealth: optionalText,
  damageNotes: optionalText,
  internalNotes: optionalText,
  purchasePrice: optionalPrice,
  paymentMethod: z.enum(paymentMethods).optional(),
  ownershipConfirmed: z.coerce.boolean().optional(),
  notStolenConfirmed: z.coerce.boolean().optional(),
  icloudRemoved: z.coerce.boolean().optional(),
  googleLockRemoved: z.coerce.boolean().optional(),
  otherLockRemoved: z.coerce.boolean().optional(),
  factoryResetConfirmed: z.coerce.boolean().optional()
});

export const completeContractSchema = draftContractSchema
  .extend({
    customerName: z.string().trim().min(1).max(100),
    customerAddress: z.string().trim().min(1).max(500),
    customerPhone: z.string().trim().min(5).max(50),
    customerEmail: z.string().trim().email().max(150),
    customerDateOfBirth: z.coerce.date(),
    idDocumentNumber: z.string().trim().min(1).max(1000),
    deviceType: z.string().trim().min(1).max(1000),
    brand: z.string().trim().min(1).max(100),
    model: z.string().trim().min(1).max(100),
    imei: z.string().trim().regex(/^\d{15}$/, "IMEI must be exactly 15 digits"),
    serialNumber: z.string().trim().min(1).max(1000),
    storage: z.string().trim().min(1).max(1000),
    color: z.string().trim().min(1).max(1000),
    condition: z.enum(conditions),
    accessories: z.string().trim().min(1).max(1000),
    batteryHealth: z.string().trim().min(1).max(1000),
    damageNotes: optionalText,
    internalNotes: optionalText,
    purchasePrice: z.coerce.number().positive(),
    paymentMethod: z.enum(paymentMethods),
    ownershipConfirmed: z.literal(true),
    notStolenConfirmed: z.literal(true),
    icloudRemoved: z.literal(true),
    googleLockRemoved: z.literal(true),
    otherLockRemoved: z.literal(true),
    factoryResetConfirmed: z.literal(true)
  });

export const searchContractsSchema = z.object({
  q: optionalText,
  customerName: optionalText,
  phone: optionalText,
  imei: optionalText,
  serialNumber: optionalText,
  model: optionalText,
  contractNumber: optionalText,
  date: optionalText,
  status: z.enum(["Draft", "Completed", "Cancelled"]).optional()
});

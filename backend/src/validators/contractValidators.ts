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

export const conditions = [
  "New",
  "Like new",
  "Very good",
  "Good",
  "Acceptable",
  "Used",
  "Defective"
] as const;
export const icloudStatuses = ["Unlocked", "Locked"] as const;
export const mdmStatuses = ["Yes", "No"] as const;
export const warrantyOptions = ["AppleCare+", "Manufacturer warranty", "None"] as const;

export const paymentMethods = [
  "Cash",
  "Bank transfer",
  "Card",
  "Debit card",
  "PayPal",
  "Other"
] as const;
export const paymentStatuses = ["Paid", "Pending", "Partial payment"] as const;

const optionalText = z
  .preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(1000).optional());

/**
 * A confirmation checkbox that must be explicitly ticked (true) to complete a
 * contract. Produces a clear, human-readable message instead of Zod's default
 * "Invalid literal value, expected true".
 */
const requiredConfirmation = (message: string) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? false : value),
    z.coerce.boolean().refine((value) => value === true, { message })
  );

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.enum(values).optional()
  );

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

const SALUTATIONS = ["Mr", "Ms", "Diverse"] as const;
const ID_TYPES = ["ID card", "Passport", "Driver's license"] as const;

export const draftContractSchema = z.object({
  salutation: optionalEnum(SALUTATIONS),
  customerFirstName: optionalText,
  customerLastName: optionalText,
  customerName: optionalText,
  customerAddress: optionalText,
  customerStreet: optionalText,
  customerZipCode: optionalText,
  customerCity: optionalText,
  customerPhone: optionalText,
  customerEmail: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.string().trim().email().max(150).optional()
  ),
  customerDateOfBirth: optionalDate,
  idDocumentNumber: optionalText,
  idType: optionalEnum(ID_TYPES),
  deviceType: optionalText,
  brand: optionalText,
  model: optionalText,
  imei: optionalImei,
  serialNumber: optionalText,
  storage: optionalText,
  color: optionalText,
  condition: optionalEnum(conditions),
  accessories: optionalText,
  batteryHealth: optionalText,
  osVersion: optionalText,
  icloudStatus: optionalEnum(icloudStatuses),
  mdmStatus: optionalEnum(mdmStatuses),
  warranty: optionalEnum(warrantyOptions),
  purchaseReceiptAvailable: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.boolean().optional()
  ),
  damageNotes: optionalText,
  internalNotes: optionalText,
  purchasePrice: optionalPrice,
  paymentMethod: optionalEnum(paymentMethods),
  paymentStatus: optionalEnum(paymentStatuses),
  notes: optionalText,
  ownershipConfirmed: z.coerce.boolean().optional(),
  notStolenConfirmed: z.coerce.boolean().optional(),
  icloudRemoved: z.coerce.boolean().optional(),
  googleLockRemoved: z.coerce.boolean().optional(),
  otherLockRemoved: z.coerce.boolean().optional(),
  factoryResetConfirmed: z.coerce.boolean().optional()
});

export const completeContractSchema = draftContractSchema
  .extend({
    customerFirstName: z.string().trim().min(1).max(100),
    customerLastName: z.string().trim().min(1).max(100),
    customerStreet: z.string().trim().min(1).max(200),
    customerZipCode: z.string().trim().min(1).max(20),
    customerCity: z.string().trim().min(1).max(100),
    customerPhone: z.string().trim().min(5).max(50),
    customerEmail: z.string().trim().email().max(150),
    customerDateOfBirth: z.coerce.date().optional(),
    idDocumentNumber: z.string().trim().min(1).max(1000).optional(),
    idType: z.enum(ID_TYPES).optional(),
    deviceType: z.string().trim().min(1).max(1000),
    brand: z.string().trim().min(1).max(100),
    model: z.string().trim().min(1).max(100),
    imei: z.string().trim().regex(/^\d{15}$/, "IMEI must be exactly 15 digits"),
    serialNumber: z.string().trim().min(1).max(1000),
    storage: z.string().trim().min(1).max(1000),
    color: z.string().trim().min(1).max(1000),
    condition: z.enum(conditions),
    accessories: optionalText,
    batteryHealth: optionalText,
    osVersion: optionalText,
    icloudStatus: z.enum(icloudStatuses),
    mdmStatus: z.enum(mdmStatuses).optional(),
    warranty: z.enum(warrantyOptions).optional(),
    purchaseReceiptAvailable: z.coerce.boolean().optional(),
    damageNotes: optionalText,
    internalNotes: optionalText,
    purchasePrice: z.coerce.number().positive(),
    paymentMethod: z.enum(paymentMethods),
    paymentStatus: z.enum(paymentStatuses).optional(),
    notes: optionalText,
    // Universal legal/safety confirmations required for every purchase.
    ownershipConfirmed: requiredConfirmation(
      "Please confirm the seller is the legal owner of the device."
    ),
    notStolenConfirmed: requiredConfirmation(
      "Please confirm the device is not stolen."
    ),
    factoryResetConfirmed: requiredConfirmation(
      "Please confirm the device has been factory reset."
    ),
    // Lock-removal confirmations are platform-specific (iCloud for Apple,
    // Google lock for Android, etc.) so they are optional, not all mandatory.
    icloudRemoved: z.coerce.boolean().optional(),
    googleLockRemoved: z.coerce.boolean().optional(),
    otherLockRemoved: z.coerce.boolean().optional()
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

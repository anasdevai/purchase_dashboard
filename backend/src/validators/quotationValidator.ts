import { z } from "zod";

export const quotationStatuses = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired"
] as const;

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(1000).optional()
);

const requiredText = (max = 1000) => z.string().trim().min(1).max(max);

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce
    .number()
    .min(0, "Amount must be zero or greater")
    .optional()
    .refine((val) => val === undefined || Number.isFinite(val), "Invalid amount")
);

const requiredMoney = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce
    .number()
    .min(0, "Amount must be zero or greater")
    .refine((val) => Number.isFinite(val), "Invalid amount")
);

export const quotationItemSchema = z.object({
  id: z.string().uuid().optional(),
  repairType: requiredText(100),
  description: requiredText(1000),
  unitPrice: requiredMoney,
  quantity: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? 1 : value),
    z.coerce.number().min(0.01, "Quantity must be greater than zero").default(1)
  ),
  discount: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.number().min(0).max(100).optional()
  )
});

export const quotationSchema = z.object({
  quotationNumber: optionalText,
  validUntilDate: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.date()
  ),
  status: z.enum(quotationStatuses).optional(),
  employeeId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  customerName: requiredText(150),
  customerPhone: requiredText(60),
  customerEmail: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.string().trim().email().max(150).optional()
  ),
  customerAddress: optionalText,
  deviceType: requiredText(100),
  brand: optionalText,
  model: requiredText(150),
  imeiOrSerial: optionalText,
  notes: optionalText,
  items: z.array(quotationItemSchema).min(1, "At least one item is required")
});

export const searchQuotationsSchema = z.object({
  q: optionalText,
  quotationNumber: optionalText,
  customerName: optionalText,
  phone: optionalText,
  model: optionalText,
  status: z.enum(quotationStatuses).optional()
});

export const quotationStatusSchema = z.object({
  status: z.enum(quotationStatuses)
});

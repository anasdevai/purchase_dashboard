import { z } from "zod";

export const invoicePaymentMethods = ["Cash", "BankTransfer", "Card", "PayPal", "Other"] as const;
export const invoicePaymentStatuses = ["Draft", "Open", "Sent", "Paid", "PartiallyPaid", "Overdue", "Cancelled"] as const;

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(2000).optional()
);

const requiredText = (max = 1000) => z.string().trim().min(1).max(max);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional()
);

const wholeNumberMessage = "Must be a whole number";

const isWholeNumber = (value: number) => Number.isInteger(value);

const quantitySchema = z.coerce
  .number({ invalid_type_error: wholeNumberMessage })
  .min(1, "Quantity must be at least 1")
  .refine(isWholeNumber, { message: wholeNumberMessage });

const wholeEuroSchema = z.coerce
  .number({ invalid_type_error: wholeNumberMessage })
  .refine(isWholeNumber, { message: wholeNumberMessage });

const wholeVatSchema = z.coerce
  .number({ invalid_type_error: wholeNumberMessage })
  .min(0, "VAT must be zero or greater")
  .max(100, "VAT cannot exceed 100")
  .refine(isWholeNumber, { message: wholeNumberMessage });

export const invoiceItemSchema = z.object({
  description: requiredText(1000),
  quantity: quantitySchema,
  unitPrice: wholeEuroSchema,
  vatPercent: wholeVatSchema
});

const invoiceNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^INV-\d+$/, "Invoice number must match format INV-0001")
    .optional()
);

export const invoiceSchema = z.object({
  repairOrderId: optionalText,
  invoiceNumber: invoiceNumberSchema,
  invoiceDate: optionalDate,
  customerName: requiredText(150),
  customerAddress: requiredText(2000),
  customerPhone: requiredText(200),
  customerEmail: z.string().trim().min(1).email().max(150),
  deviceSummary: optionalText,
  repairSummary: optionalText,
  paymentMethod: z.enum(invoicePaymentMethods).optional(),
  paymentStatus: z.enum(invoicePaymentStatuses).optional(),
  notes: optionalText,
  serviceDate: optionalDate,
  dueDate: optionalDate,
  paymentDate: optionalDate,
  paymentReference: optionalText,
  cancellationReason: optionalText,
  employeeId: z.string().uuid().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1)
});

export const searchInvoicesSchema = z.object({
  q: optionalText,
  invoiceNumber: optionalText,
  customerName: optionalText,
  phone: optionalText,
  date: optionalText
});

export const invoicePaymentStatusSchema = z.object({
  paymentStatus: z.enum(invoicePaymentStatuses),
  cancellationReason: optionalText,
  paymentDate: optionalDate,
  paymentReference: optionalText,
});

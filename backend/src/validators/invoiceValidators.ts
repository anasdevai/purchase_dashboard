import { z } from "zod";

export const invoicePaymentMethods = ["Cash", "BankTransfer", "Card", "Other"] as const;
export const invoicePaymentStatuses = ["Paid", "Open", "Cancelled"] as const;

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(2000).optional()
);

const requiredText = (max = 1000) => z.string().trim().min(1).max(max);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional()
);

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.number().min(0).optional()
);

const positiveNumber = z.coerce.number().positive();
const nonNegativeNumber = z.coerce.number().min(0);

export const invoiceItemSchema = z.object({
  description: requiredText(1000),
  quantity: positiveNumber,
  unitPrice: nonNegativeNumber,
  vatPercent: nonNegativeNumber
});

export const invoiceSchema = z.object({
  repairOrderId: optionalText,
  invoiceNumber: optionalText,
  invoiceDate: optionalDate,
  customerName: requiredText(150),
  customerAddress: optionalText,
  customerPhone: optionalText,
  customerEmail: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.string().trim().email().max(150).optional()
  ),
  deviceSummary: optionalText,
  repairSummary: optionalText,
  paymentMethod: z.enum(invoicePaymentMethods).optional(),
  paymentStatus: z.enum(invoicePaymentStatuses).optional(),
  netAmountOverride: optionalMoney,
  vatAmountOverride: optionalMoney,
  grossTotalOverride: optionalMoney,
  notes: optionalText,
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
  paymentStatus: z.enum(invoicePaymentStatuses)
});

// Original path: backend/src/services/invoiceService.ts
// Extracted: notes + paymentStatus in create/update + dedicated status endpoint

import { invoicePaymentStatusSchema } from "../validators/invoiceValidators.js";

// On create/save — persists parsed.paymentStatus and parsed.notes

export const updateInvoicePaymentStatus = async (
  id: string,
  userId: string,
  input: unknown
) => {
  const parsed = invoicePaymentStatusSchema.parse(input);
  return prisma.invoice.update({
    where: { id },
    data: { paymentStatus: parsed.paymentStatus },
  });
};

import { z } from "zod";

export const createSupplierSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactPerson: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email("Invalid email address").max(150),
  website: z.string().trim().max(255).optional().nullable(),
  deliveryTime: z.number().int().nonnegative().optional().nullable(),
  paymentTerms: z.string().trim().max(255).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

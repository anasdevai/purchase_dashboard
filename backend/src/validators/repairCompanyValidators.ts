import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(1000).optional()
);

export const repairCompanySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  contactInfo: optionalText,
  notes: optionalText
});

export const repairCompanyIdSchema = z.object({
  id: z.string().uuid()
});

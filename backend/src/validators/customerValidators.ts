import { z } from "zod";

export const salutations = ["Mr", "Ms", "Diverse"] as const;

export const createCustomerSchema = z.object({
  salutation: z.enum(salutations).optional().nullable(),
  firstName: z.string().trim().min(1, "First Name is required").max(100),
  lastName: z.string().trim().min(1, "Last Name is required").max(100),
  company: z.string().trim().max(150).optional().nullable(),
  vatId: z.string().trim().max(50).optional().nullable(),
  street: z.string().trim().min(1, "Street is required").max(255),
  zipCode: z.string().trim().min(1, "ZIP Code is required").max(30),
  city: z.string().trim().min(1, "City is required").max(100),
  phone: z.string().trim().min(1, "Phone number is required").max(60),
  email: z.string().trim().email("Invalid email address").max(150),
  dateOfBirth: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() !== "") return new Date(val);
    return val;
  }, z.date().optional().nullable()),
  newsletter: z.boolean().default(false),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const mergeCustomersSchema = z.object({
  keepCustomerId: z.string().uuid("Invalid primary customer ID"),
  mergeCustomerId: z.string().uuid("Invalid duplicate customer ID"),
});

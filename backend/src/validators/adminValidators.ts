import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["admin", "staff"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(128).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["admin", "staff"]).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  sortBy: z.enum(["name", "email", "createdAt", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

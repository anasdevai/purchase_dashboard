import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173,http://192.168.100.29:5173"),
  SHOP_NAME: z.string().min(1).default("Sceleria"),
  SHOP_ADDRESS: z.string().min(1).default("Your shop address"),
  SHOP_PHONE: z.string().default("Your shop phone"),
  SHOP_EMAIL: z.string().default("Your shop email"),
  SHOP_OWNER_NAME: z.string().default("Your owner / manager name"),
  SHOP_LOGO_PATH: z.string().default(""),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(5)
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  corsOrigins: parsed.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};


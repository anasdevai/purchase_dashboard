import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  CORS_ALLOW_LAN: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  SHOP_NAME: z.string().min(1).default("Sceleria"),
  SHOP_ADDRESS: z.string().min(1).default("Your shop address"),
  SHOP_PHONE: z.string().default("Your shop phone"),
  SHOP_EMAIL: z.string().default("Your shop email"),
  SHOP_OWNER_NAME: z.string().default("Your owner / manager name"),
  SHOP_LOGO_PATH: z.string().default(""),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(5),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("noreply@sclera.io")
});

const parsed = envSchema.parse(process.env);

const allowedOriginsStr =
  parsed.ALLOWED_ORIGINS ||
  parsed.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173";

export const env = {
  ...parsed,
  corsOrigins: allowedOriginsStr
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};


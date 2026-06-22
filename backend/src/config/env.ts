import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

// Always load the backend environment file, regardless of the directory used to
// launch the monorepo script (for example `npm --prefix backend`).
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173"),
  CORS_ALLOW_LAN: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
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
  SMTP_FROM: z.string().default("noreply@sclera.io"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash")
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  corsOrigins: parsed.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};


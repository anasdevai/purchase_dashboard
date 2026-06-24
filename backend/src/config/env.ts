import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  CORS_ALLOW_LAN: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  FRONTEND_URL: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_API_KEY: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().optional(),
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

const isProduction = parsed.NODE_ENV === "production";

const defaultCorsOrigins = isProduction
  ? parsed.FRONTEND_URL ?? ""
  : "http://localhost:5173,http://127.0.0.1:5173";

const allowedOriginsStr =
  parsed.ALLOWED_ORIGINS || parsed.CORS_ORIGINS || defaultCorsOrigins;

const corsOrigins = allowedOriginsStr
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (parsed.FRONTEND_URL && !corsOrigins.includes(parsed.FRONTEND_URL)) {
  corsOrigins.push(parsed.FRONTEND_URL);
}

const frontendUrl =
  parsed.FRONTEND_URL ??
  (isProduction ? "" : "http://localhost:5173");

const googleRedirectUri =
  parsed.GOOGLE_REDIRECT_URI ??
  (frontendUrl
    ? `${frontendUrl.replace(/\/+$/, "")}/api/appointments/google/callback`
    : "");

export const env = {
  ...parsed,
  corsOrigins,
  frontendUrl,
  GOOGLE_REDIRECT_URI: googleRedirectUri,
};

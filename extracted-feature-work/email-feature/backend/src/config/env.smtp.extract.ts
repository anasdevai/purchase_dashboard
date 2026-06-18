// Original path: backend/src/config/env.ts
// Extracted: SMTP environment configuration

const envSchema = z.object({
  // ...
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("noreply@sclera.io")
});

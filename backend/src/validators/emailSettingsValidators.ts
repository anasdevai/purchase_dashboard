import { z } from "zod";

export const smtpEncryptions = ["none", "SSL", "TLS", "STARTTLS"] as const;
export const imapEncryptions = ["none", "SSL", "TLS", "STARTTLS"] as const;

export const emailTemplateNames = [
  "Quotation",
  "Invoice",
  "OrderConfirmation",
  "ReadyForPickup",
  "PickupReminder",
  "PaymentReminder",
  "AppointmentConfirmation",
] as const;

export const smtpSettingsSchema = z.object({
  host: z.string().trim().min(1, "SMTP Host is required").max(255),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  encryption: z.enum(smtpEncryptions),
  username: z.string().trim().min(1, "Username is required").max(255),
  password: z.string().max(255).optional(),
});

export const imapSettingsSchema = z.object({
  host: z.string().trim().min(1, "IMAP Host is required").max(255),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  encryption: z.enum(imapEncryptions),
  username: z.string().trim().min(1, "Username is required").max(255),
  password: z.string().max(255).optional(),
});

export const emailTemplateSchema = z.object({
  name: z.enum(emailTemplateNames),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  body: z.string().trim().min(1, "Body is required"),
});

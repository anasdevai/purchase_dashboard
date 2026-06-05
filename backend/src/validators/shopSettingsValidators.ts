import { z } from "zod";

export const shopSettingsSchema = z.object({
  shopName: z.string().trim().max(200).optional().default(""),
  shopAddress: z.string().trim().max(500).optional().default(""),
  shopPhone: z.string().trim().max(50).optional().default(""),
  shopEmail: z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
    return trimmed;
  }, z.string().email().max(150).optional()),
  ownerName: z
    .preprocess((value) => (value === "" || value === undefined || value === null ? undefined : value), z
      .string()
      .trim()
      .max(100)
      .optional()),
  logoDataUrl: z
    .preprocess((value) => (value === "" || value === undefined || value === null ? undefined : value), z
      .string()
      .max(3_000_000)
      .optional())
});

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;

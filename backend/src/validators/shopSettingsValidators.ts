import { z } from "zod";

export const shopSettingsSchema = z.object({
  shopName: z.string().trim().min(1).max(200),
  shopAddress: z.string().trim().min(1).max(500),
  shopPhone: z.string().trim().min(1).max(50),
  shopEmail: z
    .preprocess((value) => (value === "" || value === undefined || value === null ? undefined : value), z
      .string()
      .trim()
      .email()
      .max(150)
      .optional()),
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

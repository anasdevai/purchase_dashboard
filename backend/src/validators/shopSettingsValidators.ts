import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? "" : value),
    z.string().trim().max(max).optional().default("")
  );

const vatRateValues = ["20", "10", "13", "0", "custom"] as const;

export const shopSettingsSchema = z
  .object({
    shopName: optionalText(200),
    shopAddress: optionalText(500),
    street: optionalText(200),
    zipCode: optionalText(20),
    city: optionalText(100),
    country: optionalText(100),
    shopPhone: optionalText(50),
    shopEmail: optionalText(150),
    website: optionalText(200),
    ownerName: optionalText(100),
    vatNumber: optionalText(50),
    companyRegistrationNumber: optionalText(100),
    taxNumber: optionalText(100),
    accountHolder: optionalText(150),
    iban: optionalText(50),
    bicSwift: optionalText(20),
    bankName: optionalText(150),
    defaultVatRate: z.enum(vatRateValues).optional().default("20"),
    defaultVatCustom: optionalText(10),
    logoDataUrl: z.preprocess(
      (value) => (value === "" || value === undefined || value === null ? undefined : value),
      z.string().max(3_000_000).optional()
    )
  })
  .superRefine((data, ctx) => {
    if (data.shopEmail && typeof data.shopEmail === "string" && data.shopEmail !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.shopEmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email address",
          path: ["shopEmail"]
        });
      }
    }

    if (data.defaultVatRate === "custom") {
      const custom = data.defaultVatCustom?.trim() ?? "";
      const parsed = Number(custom);
      if (!custom || !Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom VAT rate must be between 0 and 100",
          path: ["defaultVatCustom"]
        });
      }
    }
  });

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;

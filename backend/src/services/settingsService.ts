import { prisma } from "../config/prisma.js";
import type { PdfShopSettings } from "./pdfService.js";
import { shopSettingsSchema, type ShopSettingsInput } from "../validators/shopSettingsValidators.js";

type ShopSettingsRecord = {
  shopName: string;
  shopAddress: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  shopPhone: string;
  shopEmail: string;
  website: string;
  ownerName: string;
  vatNumber: string;
  companyRegistrationNumber: string;
  taxNumber: string;
  accountHolder: string;
  iban: string;
  bicSwift: string;
  bankName: string;
  defaultVatRate: string;
  defaultVatCustom: string;
  logoDataUrl: string | null;
};

const emptySettings = (): ShopSettingsRecord => ({
  shopName: "",
  shopAddress: "",
  street: "",
  zipCode: "",
  city: "",
  country: "",
  shopPhone: "",
  shopEmail: "",
  website: "",
  ownerName: "",
  vatNumber: "",
  companyRegistrationNumber: "",
  taxNumber: "",
  accountHolder: "",
  iban: "",
  bicSwift: "",
  bankName: "",
  defaultVatRate: "20",
  defaultVatCustom: "",
  logoDataUrl: null
});

const parseLegacyAddress = (shopAddress: string) => {
  const trimmed = shopAddress.trim();
  if (!trimmed) {
    return { street: "", zipCode: "", city: "", country: "" };
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 3) {
    const zipCity = lines[1].match(/^(\S+)\s+(.+)$/);
    return {
      street: lines[0],
      zipCode: zipCity?.[1] ?? "",
      city: zipCity?.[2] ?? lines[1],
      country: lines[2]
    };
  }

  if (lines.length === 2) {
    const zipCity = lines[1].match(/^(\S+)\s+(.+)$/);
    return {
      street: lines[0],
      zipCode: zipCity?.[1] ?? "",
      city: zipCity?.[2] ?? lines[1],
      country: ""
    };
  }

  return { street: trimmed, zipCode: "", city: "", country: "" };
};

export const formatShopAddress = (settings: {
  street?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  shopAddress?: string;
}) => {
  const street = settings.street?.trim() ?? "";
  const zipCode = settings.zipCode?.trim() ?? "";
  const city = settings.city?.trim() ?? "";
  const country = settings.country?.trim() ?? "";

  if (street || zipCode || city || country) {
    const line2 = [zipCode, city].filter(Boolean).join(" ");
    return [street, line2, country].filter(Boolean).join("\n");
  }

  return settings.shopAddress?.trim() ?? "";
};

const enrichSettings = (settings: ShopSettingsRecord): ShopSettingsRecord => {
  if (!settings.street.trim() && settings.shopAddress.trim()) {
    const parsed = parseLegacyAddress(settings.shopAddress);
    return {
      ...settings,
      street: parsed.street,
      zipCode: parsed.zipCode,
      city: parsed.city,
      country: parsed.country
    };
  }

  return {
    ...settings,
    shopAddress: formatShopAddress(settings)
  };
};

const toResponse = (settings: ShopSettingsRecord) => {
  const enriched = enrichSettings(settings);
  return {
    shopName: enriched.shopName,
    shopAddress: enriched.shopAddress,
    street: enriched.street,
    zipCode: enriched.zipCode,
    city: enriched.city,
    country: enriched.country,
    shopPhone: enriched.shopPhone,
    shopEmail: enriched.shopEmail,
    website: enriched.website,
    ownerName: enriched.ownerName,
    vatNumber: enriched.vatNumber,
    companyRegistrationNumber: enriched.companyRegistrationNumber,
    taxNumber: enriched.taxNumber,
    accountHolder: enriched.accountHolder,
    iban: enriched.iban,
    bicSwift: enriched.bicSwift,
    bankName: enriched.bankName,
    defaultVatRate: enriched.defaultVatRate,
    defaultVatCustom: enriched.defaultVatCustom,
    logoDataUrl: enriched.logoDataUrl ?? undefined
  };
};

export const getDefaultVatPercent = (settings: {
  defaultVatRate?: string;
  defaultVatCustom?: string;
}) => {
  if (settings.defaultVatRate === "custom") {
    const custom = settings.defaultVatCustom?.trim() ?? "";
    const parsed = Number(custom);
    return Number.isFinite(parsed) ? parsed : 20;
  }

  const preset = Number(settings.defaultVatRate ?? "20");
  return Number.isFinite(preset) ? preset : 20;
};

export const shopSettingsInputToPdf = (input: ShopSettingsInput): PdfShopSettings =>
  shopSettingsToPdf(
    toResponse({
      ...emptySettings(),
      shopName: input.shopName ?? "",
      shopAddress: formatShopAddress(input),
      street: input.street ?? "",
      zipCode: input.zipCode ?? "",
      city: input.city ?? "",
      country: input.country ?? "",
      shopPhone: input.shopPhone ?? "",
      shopEmail: input.shopEmail ?? "",
      website: input.website ?? "",
      ownerName: input.ownerName ?? "",
      vatNumber: input.vatNumber ?? "",
      companyRegistrationNumber: input.companyRegistrationNumber ?? "",
      taxNumber: input.taxNumber ?? "",
      accountHolder: input.accountHolder ?? "",
      iban: input.iban ?? "",
      bicSwift: input.bicSwift ?? "",
      bankName: input.bankName ?? "",
      defaultVatRate: input.defaultVatRate ?? "20",
      defaultVatCustom: input.defaultVatCustom ?? "",
      logoDataUrl: input.logoDataUrl ?? null
    })
  );

export const shopSettingsToPdf = (settings: ReturnType<typeof toResponse>): PdfShopSettings => ({
  name: settings.shopName,
  address: formatShopAddress(settings),
  phone: settings.shopPhone,
  email: settings.shopEmail,
  ownerName: settings.ownerName,
  logoDataUrl: settings.logoDataUrl,
  website: settings.website,
  vatNumber: settings.vatNumber,
  companyRegistrationNumber: settings.companyRegistrationNumber,
  taxNumber: settings.taxNumber,
  accountHolder: settings.accountHolder,
  iban: settings.iban,
  bicSwift: settings.bicSwift,
  bankName: settings.bankName,
  street: settings.street,
  zipCode: settings.zipCode,
  city: settings.city,
  country: settings.country,
  defaultVatRate: settings.defaultVatRate
});

export const getShopSettingsForUser = async (userId: string) => {
  const settings = await prisma.shopSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    return toResponse(emptySettings());
  }

  return toResponse(settings);
};

export const saveShopSettingsForUser = async (userId: string, input: Record<string, unknown>) => {
  const data = shopSettingsSchema.parse(input);
  const shopAddress = formatShopAddress(data);

  const settings = await prisma.shopSettings.upsert({
    where: { userId },
    create: {
      userId,
      shopName: data.shopName,
      shopAddress,
      street: data.street,
      zipCode: data.zipCode,
      city: data.city,
      country: data.country,
      shopPhone: data.shopPhone,
      shopEmail: data.shopEmail ?? "",
      website: data.website,
      ownerName: data.ownerName ?? "",
      vatNumber: data.vatNumber,
      companyRegistrationNumber: data.companyRegistrationNumber,
      taxNumber: data.taxNumber,
      accountHolder: data.accountHolder,
      iban: data.iban,
      bicSwift: data.bicSwift,
      bankName: data.bankName,
      defaultVatRate: data.defaultVatRate,
      defaultVatCustom: data.defaultVatRate === "custom" ? data.defaultVatCustom : "",
      logoDataUrl: data.logoDataUrl ?? null
    },
    update: {
      shopName: data.shopName,
      shopAddress,
      street: data.street,
      zipCode: data.zipCode,
      city: data.city,
      country: data.country,
      shopPhone: data.shopPhone,
      shopEmail: data.shopEmail ?? "",
      website: data.website,
      ownerName: data.ownerName ?? "",
      vatNumber: data.vatNumber,
      companyRegistrationNumber: data.companyRegistrationNumber,
      taxNumber: data.taxNumber,
      accountHolder: data.accountHolder,
      iban: data.iban,
      bicSwift: data.bicSwift,
      bankName: data.bankName,
      defaultVatRate: data.defaultVatRate,
      defaultVatCustom: data.defaultVatRate === "custom" ? data.defaultVatCustom : "",
      logoDataUrl: data.logoDataUrl ?? null
    }
  });

  return toResponse(settings);
};

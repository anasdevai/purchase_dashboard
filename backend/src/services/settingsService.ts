import { prisma } from "../config/prisma.js";
import { shopSettingsSchema, type ShopSettingsInput } from "../validators/shopSettingsValidators.js";

const toResponse = (settings: {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  ownerName: string;
  logoDataUrl: string | null;
}) => ({
  shopName: settings.shopName,
  shopAddress: settings.shopAddress,
  shopPhone: settings.shopPhone,
  shopEmail: settings.shopEmail,
  ownerName: settings.ownerName,
  logoDataUrl: settings.logoDataUrl ?? undefined
});

export const getShopSettingsForUser = async (userId: string) => {
  const settings = await prisma.shopSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    return toResponse({
      shopName: "",
      shopAddress: "",
      shopPhone: "",
      shopEmail: "",
      ownerName: "",
      logoDataUrl: null
    });
  }

  return toResponse(settings);
};

export const saveShopSettingsForUser = async (userId: string, input: Record<string, unknown>) => {
  const data = shopSettingsSchema.parse(input);

  const settings = await prisma.shopSettings.upsert({
    where: { userId },
    create: {
      userId,
      shopName: data.shopName,
      shopAddress: data.shopAddress,
      shopPhone: data.shopPhone,
      shopEmail: data.shopEmail ?? "",
      ownerName: data.ownerName ?? "",
      logoDataUrl: data.logoDataUrl ?? null
    },
    update: {
      shopName: data.shopName,
      shopAddress: data.shopAddress,
      shopPhone: data.shopPhone,
      shopEmail: data.shopEmail ?? "",
      ownerName: data.ownerName ?? "",
      logoDataUrl: data.logoDataUrl ?? null
    }
  });

  return toResponse(settings);
};

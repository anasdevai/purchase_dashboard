import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

// ─── Brands ──────────────────────────────────────────────────────────
export const getBrands = async (activeOnly = false) => {
  return prisma.brand.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { name: "asc" }
  });
};

export const getBrandById = async (id: string) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new HttpError(404, "Brand not found");
  return brand;
};

export const createBrand = async (data: { name: string; logoUrl?: string | null; isActive?: boolean }) => {
  // Check unique name
  const existing = await prisma.brand.findUnique({ where: { name: data.name } });
  if (existing) throw new HttpError(400, `Brand with name "${data.name}" already exists`);

  return prisma.brand.create({ data });
};

export const updateBrand = async (id: string, data: { name?: string; logoUrl?: string | null; isActive?: boolean }) => {
  await getBrandById(id);

  if (data.name) {
    const existing = await prisma.brand.findFirst({
      where: { name: data.name, NOT: { id } }
    });
    if (existing) throw new HttpError(400, `Brand with name "${data.name}" already exists`);
  }

  return prisma.brand.update({
    where: { id },
    data
  });
};

export const deleteBrand = async (id: string) => {
  await getBrandById(id);
  await prisma.brand.delete({ where: { id } });
  return { success: true };
};

// ─── Device Types ────────────────────────────────────────────────────
export const getDeviceTypes = async (activeOnly = false, brandId?: string) => {
  return prisma.deviceType.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(brandId ? { brandId } : {})
    },
    include: { brand: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });
};

export const getDeviceTypeById = async (id: string) => {
  const type = await prisma.deviceType.findUnique({
    where: { id },
    include: { brand: { select: { id: true, name: true } } }
  });
  if (!type) throw new HttpError(404, "Device type not found");
  return type;
};

export const createDeviceType = async (data: { name: string; brandId: string; isActive?: boolean }) => {
  // Check unique brandId + name
  const existing = await prisma.deviceType.findUnique({
    where: { brandId_name: { brandId: data.brandId, name: data.name } }
  });
  if (existing) throw new HttpError(400, `Device type "${data.name}" already exists for this brand`);

  return prisma.deviceType.create({ data });
};

export const updateDeviceType = async (id: string, data: { name?: string; brandId?: string; isActive?: boolean }) => {
  const current = await getDeviceTypeById(id);
  const brandId = data.brandId || current.brandId;
  const name = data.name || current.name;

  if (data.name || data.brandId) {
    const existing = await prisma.deviceType.findFirst({
      where: { brandId, name, NOT: { id } }
    });
    if (existing) throw new HttpError(400, `Device type "${name}" already exists for this brand`);
  }

  return prisma.deviceType.update({
    where: { id },
    data
  });
};

export const deleteDeviceType = async (id: string) => {
  await getDeviceTypeById(id);
  await prisma.deviceType.delete({ where: { id } });
  return { success: true };
};

// ─── Models ──────────────────────────────────────────────────────────
export const getModels = async (activeOnly = false, brandId?: string, deviceTypeId?: string) => {
  return prisma.model.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(brandId ? { brandId } : {}),
      ...(deviceTypeId ? { deviceTypeId } : {})
    },
    include: {
      brand: { select: { id: true, name: true } },
      deviceType: { select: { id: true, name: true } }
    },
    orderBy: { name: "asc" }
  });
};

export const getModelById = async (id: string) => {
  const model = await prisma.model.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      deviceType: { select: { id: true, name: true } }
    }
  });
  if (!model) throw new HttpError(404, "Model not found");
  return model;
};

export const createModel = async (data: {
  name: string;
  deviceTypeId: string;
  brandId: string;
  generation?: string | null;
  storageOptions?: string[];
  colorOptions?: string[];
  releaseYear?: number | null;
  isActive?: boolean;
}) => {
  return prisma.model.create({ data });
};

export const updateModel = async (
  id: string,
  data: {
    name?: string;
    deviceTypeId?: string;
    brandId?: string;
    generation?: string | null;
    storageOptions?: string[];
    colorOptions?: string[];
    releaseYear?: number | null;
    isActive?: boolean;
  }
) => {
  await getModelById(id);
  return prisma.model.update({
    where: { id },
    data
  });
};

export const deleteModel = async (id: string) => {
  await getModelById(id);
  await prisma.model.delete({ where: { id } });
  return { success: true };
};

// ─── Repair Types ────────────────────────────────────────────────────
export const getRepairTypes = async (activeOnly = false, category?: any) => {
  return prisma.repairType.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(category ? { category } : {})
    },
    orderBy: { name: "asc" }
  });
};

export const getRepairTypeById = async (id: string) => {
  const type = await prisma.repairType.findUnique({ where: { id } });
  if (!type) throw new HttpError(404, "Repair type not found");
  return type;
};

export const createRepairType = async (data: {
  name: string;
  category: any;
  standardPrice?: number | null;
  duration?: number | null;
  difficulty?: any | null;
  isActive?: boolean;
}) => {
  return prisma.repairType.create({ data });
};

export const updateRepairType = async (
  id: string,
  data: {
    name?: string;
    category?: any;
    standardPrice?: number | null;
    duration?: number | null;
    difficulty?: any | null;
    isActive?: boolean;
  }
) => {
  await getRepairTypeById(id);
  return prisma.repairType.update({
    where: { id },
    data
  });
};

export const deleteRepairType = async (id: string) => {
  await getRepairTypeById(id);
  await prisma.repairType.delete({ where: { id } });
  return { success: true };
};

// ─── Price Lists ─────────────────────────────────────────────────────
export const getPriceLists = async (activeOnly = false, modelId?: string, repairTypeId?: string) => {
  return prisma.priceList.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(modelId ? { modelId } : {}),
      ...(repairTypeId ? { repairTypeId } : {})
    },
    include: {
      model: {
        select: {
          id: true,
          name: true,
          brand: { select: { id: true, name: true } },
          deviceType: { select: { id: true, name: true } }
        }
      },
      repairType: { select: { id: true, name: true, category: true } }
    },
    orderBy: { price: "asc" }
  });
};

export const getPriceListById = async (id: string) => {
  const priceList = await prisma.priceList.findUnique({
    where: { id },
    include: {
      model: { select: { id: true, name: true } },
      repairType: { select: { id: true, name: true } }
    }
  });
  if (!priceList) throw new HttpError(404, "Price list entry not found");
  return priceList;
};

export const createPriceList = async (data: {
  modelId: string;
  repairTypeId: string;
  price: number;
  duration?: number | null;
  isActive?: boolean;
}) => {
  const existing = await prisma.priceList.findUnique({
    where: { modelId_repairTypeId: { modelId: data.modelId, repairTypeId: data.repairTypeId } }
  });
  if (existing) {
    throw new HttpError(400, "Price mapping already exists for this Model and Repair Type. Use update instead.");
  }

  return prisma.priceList.create({ data });
};

export const updatePriceList = async (
  id: string,
  data: {
    modelId?: string;
    repairTypeId?: string;
    price?: number;
    duration?: number | null;
    isActive?: boolean;
  }
) => {
  const current = await getPriceListById(id);
  const modelId = data.modelId || current.modelId;
  const repairTypeId = data.repairTypeId || current.repairTypeId;

  if (data.modelId || data.repairTypeId) {
    const existing = await prisma.priceList.findFirst({
      where: { modelId, repairTypeId, NOT: { id } }
    });
    if (existing) throw new HttpError(400, "Price mapping already exists for this Model and Repair Type");
  }

  return prisma.priceList.update({
    where: { id },
    data
  });
};

export const deletePriceList = async (id: string) => {
  await getPriceListById(id);
  await prisma.priceList.delete({ where: { id } });
  return { success: true };
};

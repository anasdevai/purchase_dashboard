import { apiRequest } from "./client.js";
import type { Brand, DeviceType, Model, RepairType, PriceList } from "../types/masterData";

// ─── Brands ──────────────────────────────────────────────────────────
export async function fetchBrands(activeOnly = false): Promise<Brand[]> {
  const response = await apiRequest<{ brands: Brand[] }>(`/api/master-data/brands?activeOnly=${activeOnly}`);
  return response.brands;
}

export async function createBrand(payload: { name: string; logoUrl?: string | null; isActive?: boolean }): Promise<Brand> {
  const response = await apiRequest<{ brand: Brand }>("/api/master-data/brands", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.brand;
}

export async function updateBrand(id: string, payload: Partial<{ name: string; logoUrl?: string | null; isActive: boolean }>): Promise<Brand> {
  const response = await apiRequest<{ brand: Brand }>(`/api/master-data/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.brand;
}

export async function deleteBrand(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/master-data/brands/${id}`, {
    method: "DELETE"
  });
}

// ─── Device Types ────────────────────────────────────────────────────
export async function fetchDeviceTypes(activeOnly = false, brandId?: string): Promise<DeviceType[]> {
  let url = `/api/master-data/device-types?activeOnly=${activeOnly}`;
  if (brandId) url += `&brandId=${brandId}`;
  const response = await apiRequest<{ deviceTypes: DeviceType[] }>(url);
  return response.deviceTypes;
}

export async function createDeviceType(payload: { name: string; brandId: string; isActive?: boolean }): Promise<DeviceType> {
  const response = await apiRequest<{ deviceType: DeviceType }>("/api/master-data/device-types", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.deviceType;
}

export async function updateDeviceType(id: string, payload: Partial<{ name: string; brandId: string; isActive: boolean }>): Promise<DeviceType> {
  const response = await apiRequest<{ deviceType: DeviceType }>(`/api/master-data/device-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.deviceType;
}

export async function deleteDeviceType(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/master-data/device-types/${id}`, {
    method: "DELETE"
  });
}

// ─── Models ──────────────────────────────────────────────────────────
export async function fetchModels(activeOnly = false, brandId?: string, deviceTypeId?: string): Promise<Model[]> {
  let url = `/api/master-data/models?activeOnly=${activeOnly}`;
  if (brandId) url += `&brandId=${brandId}`;
  if (deviceTypeId) url += `&deviceTypeId=${deviceTypeId}`;
  const response = await apiRequest<{ models: Model[] }>(url);
  return response.models;
}

export async function createModel(payload: {
  name: string;
  deviceTypeId: string;
  brandId: string;
  generation?: string | null;
  storageOptions?: string[];
  colorOptions?: string[];
  releaseYear?: number | null;
  isActive?: boolean;
}): Promise<Model> {
  const response = await apiRequest<{ model: Model }>("/api/master-data/models", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.model;
}

export async function updateModel(id: string, payload: Partial<{
  name: string;
  deviceTypeId: string;
  brandId: string;
  generation: string | null;
  storageOptions: string[];
  colorOptions: string[];
  releaseYear: number | null;
  isActive: boolean;
}>): Promise<Model> {
  const response = await apiRequest<{ model: Model }>(`/api/master-data/models/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.model;
}

export async function deleteModel(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/master-data/models/${id}`, {
    method: "DELETE"
  });
}

// ─── Repair Types ────────────────────────────────────────────────────
export async function fetchRepairTypes(activeOnly = false, category?: string): Promise<RepairType[]> {
  let url = `/api/master-data/repair-types?activeOnly=${activeOnly}`;
  if (category) url += `&category=${category}`;
  const response = await apiRequest<{ repairTypes: RepairType[] }>(url);
  return response.repairTypes;
}

export async function createRepairType(payload: {
  name: string;
  category: string;
  standardPrice?: number | null;
  duration?: number | null;
  difficulty?: string | null;
  isActive?: boolean;
}): Promise<RepairType> {
  const response = await apiRequest<{ repairType: RepairType }>("/api/master-data/repair-types", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.repairType;
}

export async function updateRepairType(id: string, payload: Partial<{
  name: string;
  category: string;
  standardPrice: number | null;
  duration: number | null;
  difficulty: string | null;
  isActive: boolean;
}>): Promise<RepairType> {
  const response = await apiRequest<{ repairType: RepairType }>(`/api/master-data/repair-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.repairType;
}

export async function deleteRepairType(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/master-data/repair-types/${id}`, {
    method: "DELETE"
  });
}

// ─── Price Lists ─────────────────────────────────────────────────────
export async function fetchPriceLists(activeOnly = false, modelId?: string, repairTypeId?: string): Promise<PriceList[]> {
  let url = `/api/master-data/price-lists?activeOnly=${activeOnly}`;
  if (modelId) url += `&modelId=${modelId}`;
  if (repairTypeId) url += `&repairTypeId=${repairTypeId}`;
  const response = await apiRequest<{ priceLists: PriceList[] }>(url);
  return response.priceLists;
}

export async function createPriceList(payload: {
  modelId: string;
  repairTypeId: string;
  price: number;
  duration?: number | null;
  isActive?: boolean;
}): Promise<PriceList> {
  const response = await apiRequest<{ priceList: PriceList }>("/api/master-data/price-lists", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.priceList;
}

export async function updatePriceList(id: string, payload: Partial<{
  modelId: string;
  repairTypeId: string;
  price: number;
  duration: number | null;
  isActive: boolean;
}>): Promise<PriceList> {
  const response = await apiRequest<{ priceList: PriceList }>(`/api/master-data/price-lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.priceList;
}

export async function deletePriceList(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/master-data/price-lists/${id}`, {
    method: "DELETE"
  });
}

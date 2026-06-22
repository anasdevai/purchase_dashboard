import type { Request, Response } from "express";
import * as service from "../services/masterDataService.js";
import {
  createBrandSchema,
  updateBrandSchema,
  createDeviceTypeSchema,
  updateDeviceTypeSchema,
  createModelSchema,
  updateModelSchema,
  createRepairTypeSchema,
  updateRepairTypeSchema,
  createPriceListSchema,
  updatePriceListSchema
} from "../validators/masterDataValidators.js";

// Helper to get activeOnly flag
const getActiveOnly = (req: Request) => req.query.active === "true" || req.query.activeOnly === "true";
const paramId = (req: Request) => String(req.params.id);

// ─── Brands ──────────────────────────────────────────────────────────
export const listBrands = async (req: Request, res: Response) => {
  const list = await service.getBrands(getActiveOnly(req));
  res.json({ brands: list });
};

export const getBrand = async (req: Request, res: Response) => {
  const item = await service.getBrandById(paramId(req));
  res.json({ brand: item });
};

export const createBrand = async (req: Request, res: Response) => {
  const data = createBrandSchema.parse(req.body);
  const created = await service.createBrand(data);
  res.status(201).json({ brand: created });
};

export const updateBrand = async (req: Request, res: Response) => {
  const data = updateBrandSchema.parse(req.body);
  const updated = await service.updateBrand(paramId(req), data);
  res.json({ brand: updated });
};

export const removeBrand = async (req: Request, res: Response) => {
  const result = await service.deleteBrand(paramId(req));
  res.json(result);
};

// ─── Device Types ────────────────────────────────────────────────────
export const listDeviceTypes = async (req: Request, res: Response) => {
  const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
  const list = await service.getDeviceTypes(getActiveOnly(req), brandId);
  res.json({ deviceTypes: list });
};

export const getDeviceType = async (req: Request, res: Response) => {
  const item = await service.getDeviceTypeById(paramId(req));
  res.json({ deviceType: item });
};

export const createDeviceType = async (req: Request, res: Response) => {
  const data = createDeviceTypeSchema.parse(req.body);
  const created = await service.createDeviceType(data);
  res.status(201).json({ deviceType: created });
};

export const updateDeviceType = async (req: Request, res: Response) => {
  const data = updateDeviceTypeSchema.parse(req.body);
  const updated = await service.updateDeviceType(paramId(req), data);
  res.json({ deviceType: updated });
};

export const removeDeviceType = async (req: Request, res: Response) => {
  const result = await service.deleteDeviceType(paramId(req));
  res.json(result);
};

// ─── Models ──────────────────────────────────────────────────────────
export const listModels = async (req: Request, res: Response) => {
  const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
  const deviceTypeId = req.query.deviceTypeId ? String(req.query.deviceTypeId) : undefined;
  const list = await service.getModels(getActiveOnly(req), brandId, deviceTypeId);
  res.json({ models: list });
};

export const getModel = async (req: Request, res: Response) => {
  const item = await service.getModelById(paramId(req));
  res.json({ model: item });
};

export const createModel = async (req: Request, res: Response) => {
  const data = createModelSchema.parse(req.body);
  const created = await service.createModel(data);
  res.status(201).json({ model: created });
};

export const updateModel = async (req: Request, res: Response) => {
  const data = updateModelSchema.parse(req.body);
  const updated = await service.updateModel(paramId(req), data);
  res.json({ model: updated });
};

export const removeModel = async (req: Request, res: Response) => {
  const result = await service.deleteModel(paramId(req));
  res.json(result);
};

// ─── Repair Types ────────────────────────────────────────────────────
export const listRepairTypes = async (req: Request, res: Response) => {
  const category = req.query.category ? (req.query.category as any) : undefined;
  const list = await service.getRepairTypes(getActiveOnly(req), category);
  res.json({ repairTypes: list });
};

export const getRepairType = async (req: Request, res: Response) => {
  const item = await service.getRepairTypeById(paramId(req));
  res.json({ repairType: item });
};

export const createRepairType = async (req: Request, res: Response) => {
  const data = createRepairTypeSchema.parse(req.body);
  const created = await service.createRepairType(data);
  res.status(201).json({ repairType: created });
};

export const updateRepairType = async (req: Request, res: Response) => {
  const data = updateRepairTypeSchema.parse(req.body);
  const updated = await service.updateRepairType(paramId(req), data);
  res.json({ repairType: updated });
};

export const removeRepairType = async (req: Request, res: Response) => {
  const result = await service.deleteRepairType(paramId(req));
  res.json(result);
};

// ─── Price Lists ─────────────────────────────────────────────────────
export const listPriceLists = async (req: Request, res: Response) => {
  const modelId = req.query.modelId ? String(req.query.modelId) : undefined;
  const repairTypeId = req.query.repairTypeId ? String(req.query.repairTypeId) : undefined;
  const list = await service.getPriceLists(getActiveOnly(req), modelId, repairTypeId);
  res.json({ priceLists: list });
};

export const getPriceList = async (req: Request, res: Response) => {
  const item = await service.getPriceListById(paramId(req));
  res.json({ priceList: item });
};

export const createPriceList = async (req: Request, res: Response) => {
  const data = createPriceListSchema.parse(req.body);
  const created = await service.createPriceList(data);
  res.status(201).json({ priceList: created });
};

export const updatePriceList = async (req: Request, res: Response) => {
  const data = updatePriceListSchema.parse(req.body);
  const updated = await service.updatePriceList(paramId(req), data);
  res.json({ priceList: updated });
};

export const removePriceList = async (req: Request, res: Response) => {
  const result = await service.deletePriceList(paramId(req));
  res.json(result);
};

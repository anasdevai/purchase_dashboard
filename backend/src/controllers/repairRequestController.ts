import type { Request, Response } from "express";
import * as repairRequestService from "../services/repairRequestService.js";
import { createRepairRequestSchema, updateRepairRequestStatusSchema } from "../validators/repairRequestValidators.js";
import { HttpError } from "../utils/httpError.js";

// Public widget controller methods
export const getWidgetSettings = async (req: Request, res: Response) => {
  const shopId = req.query.shopId as string;
  if (!shopId) {
    throw new HttpError(400, "shopId is required");
  }
  const settings = await repairRequestService.getPublicWidgetSettings(shopId);
  res.json({ settings });
};

export const getBrands = async (_req: Request, res: Response) => {
  const brands = await repairRequestService.getPublicBrands();
  res.json({ brands });
};

export const getDeviceTypes = async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string;
  if (!brandId) {
    throw new HttpError(400, "brandId is required");
  }
  const deviceTypes = await repairRequestService.getPublicDeviceTypes(brandId);
  res.json({ deviceTypes });
};

export const getModels = async (req: Request, res: Response) => {
  const deviceTypeId = req.query.deviceTypeId as string;
  if (!deviceTypeId) {
    throw new HttpError(400, "deviceTypeId is required");
  }
  const models = await repairRequestService.getPublicModels(deviceTypeId);
  res.json({ models });
};

export const getRepairTypes = async (_req: Request, res: Response) => {
  const repairTypes = await repairRequestService.getPublicRepairTypes();
  res.json({ repairTypes });
};

export const getRepairPrice = async (req: Request, res: Response) => {
  const modelId = req.query.modelId as string;
  const repairTypeId = req.query.repairTypeId as string;
  if (!modelId || !repairTypeId) {
    throw new HttpError(400, "modelId and repairTypeId are required");
  }
  const priceInfo = await repairRequestService.getRepairPrice(modelId, repairTypeId);
  res.json({ priceInfo });
};

export const createRequest = async (req: Request, res: Response) => {
  // Parsed body
  const parsed = createRepairRequestSchema.parse(req.body);
  const request = await repairRequestService.createRepairRequest(parsed, req.file);
  res.status(201).json({ success: true, request });
};

// Authenticated controller methods
export const listRequests = async (req: Request, res: Response) => {
  const status = req.query.status as string;
  const requests = await repairRequestService.listRepairRequests(req.user!.id, status);
  res.json({ requests });
};

export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = updateRepairRequestStatusSchema.parse(req.body);
  const request = await repairRequestService.updateRepairRequestStatus(id as string, req.user!.id, status);
  res.json({ success: true, request });
};

export const convertRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const repairOrder = await repairRequestService.convertRepairRequestToOrder(id as string, req.user!.id);
  res.json({ success: true, repairOrder });
};

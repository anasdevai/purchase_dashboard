import type { Request, Response } from "express";
import * as sparePartService from "../services/sparePartService.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const list = async (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const activeOnly = req.query.activeOnly === "true";
  
  const spareParts = await sparePartService.listSpareParts(userId(req), category, activeOnly);
  res.json({ spareParts });
};

export const get = async (req: Request, res: Response) => {
  const sparePart = await sparePartService.getSparePartById(paramId(req), userId(req));
  res.json({ sparePart });
};

export const create = async (req: Request, res: Response) => {
  const sparePart = await sparePartService.createSparePart(userId(req), req.body);
  res.status(201).json({ sparePart });
};

export const update = async (req: Request, res: Response) => {
  const sparePart = await sparePartService.updateSparePart(
    paramId(req),
    userId(req),
    req.body
  );
  res.json({ sparePart });
};

export const remove = async (req: Request, res: Response) => {
  const sparePart = await sparePartService.deleteSparePart(paramId(req), userId(req));
  res.json({ deleted: true, sparePart });
};

export const adjustStock = async (req: Request, res: Response) => {
  const result = await sparePartService.adjustStock(
    paramId(req),
    userId(req),
    req.body
  );
  res.json(result);
};

export const getAdjustmentsHistory = async (req: Request, res: Response) => {
  const sparePartId = req.query.sparePartId ? String(req.query.sparePartId) : undefined;
  const adjustments = await sparePartService.getStockAdjustmentsHistory(userId(req), sparePartId);
  res.json({ adjustments });
};

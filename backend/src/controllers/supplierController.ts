import type { Request, Response } from "express";
import * as supplierService from "../services/supplierService.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const list = async (req: Request, res: Response) => {
  const suppliers = await supplierService.listSuppliers(userId(req));
  res.json({ suppliers });
};

export const get = async (req: Request, res: Response) => {
  const supplier = await supplierService.getSupplierById(paramId(req), userId(req));
  res.json({ supplier });
};

export const create = async (req: Request, res: Response) => {
  const supplier = await supplierService.createSupplier(userId(req), req.body);
  res.status(201).json({ supplier });
};

export const update = async (req: Request, res: Response) => {
  const supplier = await supplierService.updateSupplier(
    paramId(req),
    userId(req),
    req.body
  );
  res.json({ supplier });
};

export const remove = async (req: Request, res: Response) => {
  const supplier = await supplierService.deleteSupplier(paramId(req), userId(req));
  res.json({ deleted: true, supplier });
};

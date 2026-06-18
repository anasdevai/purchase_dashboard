import type { Request, Response } from "express";
import * as repairCompanyService from "../services/repairCompanyService.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const list = async (req: Request, res: Response) => {
  const repairCompanies = await repairCompanyService.listRepairCompanies(userId(req));
  res.json({ repairCompanies });
};

export const create = async (req: Request, res: Response) => {
  const repairCompany = await repairCompanyService.createRepairCompany(userId(req), req.body);
  res.status(201).json({ repairCompany });
};

export const update = async (req: Request, res: Response) => {
  const repairCompany = await repairCompanyService.updateRepairCompany(
    paramId(req),
    userId(req),
    req.body
  );
  res.json({ repairCompany });
};

export const remove = async (req: Request, res: Response) => {
  const repairCompany = await repairCompanyService.deleteRepairCompany(paramId(req), userId(req));
  res.json({ deleted: true, repairCompany });
};

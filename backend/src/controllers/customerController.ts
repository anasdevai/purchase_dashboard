import type { Request, Response } from "express";
import * as customerService from "../services/customerService.js";
import { mergeCustomersSchema } from "../validators/customerValidators.js";

const userId = (req: Request) => req.user!.id;
const paramId = (req: Request) => String(req.params.id);

export const search = async (req: Request, res: Response) => {
  const query = String(req.query.q || "");
  const customers = await customerService.searchCustomers(userId(req), query);
  res.json({ customers });
};

export const list = async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 15;
  const query = String(req.query.q || "");

  const listData = await customerService.getCustomerList(userId(req), page, limit, query);
  res.json(listData);
};

export const create = async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(userId(req), req.body);
  res.status(201).json({ customer });
};

export const getDetails = async (req: Request, res: Response) => {
  const detailData = await customerService.getCustomerDetailsWithHistory(userId(req), paramId(req));
  res.json(detailData);
};

export const update = async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(userId(req), paramId(req), req.body);
  res.json({ customer });
};

export const remove = async (req: Request, res: Response) => {
  const result = await customerService.deleteCustomer(userId(req), paramId(req));
  res.json(result);
};

export const merge = async (req: Request, res: Response) => {
  const parsed = mergeCustomersSchema.parse(req.body);
  const customer = await customerService.mergeCustomers(
    userId(req),
    parsed.keepCustomerId,
    parsed.mergeCustomerId
  );
  res.json({ customer });
};

export const exportData = async (req: Request, res: Response) => {
  const format = String(req.query.format || "csv");
  const result = await customerService.exportCustomersData(userId(req), format);
  
  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.send(result.data);
};

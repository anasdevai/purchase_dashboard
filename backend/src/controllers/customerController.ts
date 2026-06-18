import type { Request, Response } from "express";
import * as customerService from "../services/customerService.js";

const userId = (req: Request) => req.user!.id;

export const search = async (req: Request, res: Response) => {
  const query = String(req.query.q || "");
  const customers = await customerService.searchCustomers(userId(req), query);
  res.json({ customers });
};

export const create = async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(userId(req), req.body);
  res.status(201).json({ customer });
};

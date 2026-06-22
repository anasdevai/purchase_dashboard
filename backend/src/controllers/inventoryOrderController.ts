import type { Request, Response } from "express";
import * as inventoryOrderService from "../services/inventoryOrderService.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const list = async (req: Request, res: Response) => {
  const supplierId = req.query.supplierId ? String(req.query.supplierId) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;

  const orders = await inventoryOrderService.listOrders(userId(req), supplierId, status);
  res.json({ orders });
};

export const get = async (req: Request, res: Response) => {
  const order = await inventoryOrderService.getOrderById(paramId(req), userId(req));
  res.json({ order });
};

export const create = async (req: Request, res: Response) => {
  const { supplierId, items, expectedDate } = req.body;
  if (!supplierId || !items) {
    res.status(400).json({ error: "supplierId and items list are required" });
    return;
  }

  const order = await inventoryOrderService.createOrder(
    userId(req),
    supplierId,
    items,
    expectedDate
  );
  res.status(201).json({ order });
};

export const cancel = async (req: Request, res: Response) => {
  const order = await inventoryOrderService.cancelOrder(paramId(req), userId(req));
  res.json({ order });
};

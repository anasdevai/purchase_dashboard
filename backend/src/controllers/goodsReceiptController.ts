import type { Request, Response } from "express";
import * as goodsReceiptService from "../services/goodsReceiptService.js";

const userId = (req: Request) => req.user!.id;

export const list = async (req: Request, res: Response) => {
  const orderId = req.query.orderId ? String(req.query.orderId) : undefined;
  const receipts = await goodsReceiptService.getGoodsReceiptsList(userId(req), orderId);
  res.json({ receipts });
};

export const create = async (req: Request, res: Response) => {
  const { orderId, items, notes } = req.body;
  if (!orderId || !items) {
    res.status(400).json({ error: "orderId and items are required" });
    return;
  }

  const result = await goodsReceiptService.bookGoodsReceipt(
    userId(req),
    orderId,
    items,
    notes
  );
  res.status(201).json(result);
};

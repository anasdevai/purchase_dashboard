import type { Request, Response } from "express";
import * as repairOrderService from "../services/repairOrderService.js";
import * as emailService from "../services/emailService.js";
import { HttpError } from "../utils/httpError.js";
import { toAbsolutePath } from "../utils/paths.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const create = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.createRepairOrder(userId(req), req.body);
  res.status(201).json({ repairOrder });
};

export const update = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.updateRepairOrder(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const updateStatus = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.updateRepairOrderStatus(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const get = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const search = async (req: Request, res: Response) => {
  const repairOrders = await repairOrderService.searchRepairOrders(userId(req), req.query);
  res.json({ repairOrders });
};

export const generatePdf = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.generatePdfForRepairOrder(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const remove = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.deleteRepairOrder(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ deleted: true, repairOrder });
};

export const openPdf = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!repairOrder.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this repair order");
  }

  res.sendFile(toAbsolutePath(repairOrder.pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!repairOrder.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this repair order");
  }

  res.download(toAbsolutePath(repairOrder.pdfPath), `${repairOrder.repairOrderNumber}.pdf`);
};

export const sendEmail = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!repairOrder.customerEmail) {
    throw new HttpError(400, "Repair order does not have a customer email address configured");
  }

  if (!repairOrder.pdfPath) {
    throw new HttpError(400, "Repair order PDF has not been generated yet");
  }

  await emailService.sendRepairOrderPdfEmail(
    repairOrder.customerEmail,
    repairOrder.repairOrderNumber,
    repairOrder.pdfPath,
    repairOrder.customerName
  );

  res.json({ success: true });
};

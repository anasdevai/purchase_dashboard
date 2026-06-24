import type { Request, Response } from "express";
import fs from "node:fs";
import * as emailService from "../services/emailService.js";
import * as repairOrderService from "../services/repairOrderService.js";
import { HttpError } from "../utils/httpError.js";
import { readOptionalToEmail, resolveCustomerEmail } from "../utils/customerEmail.js";
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
    req.user!.name,
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const updateStatus = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.updateRepairOrderStatus(
    paramId(req),
    userId(req),
    req.body,
    req.user!.name,
    req.user?.role === "admin"
  );
  res.json({ repairOrder });
};

export const addComment = async (req: Request, res: Response) => {
  const { comment } = req.body;
  if (!comment || typeof comment !== "string" || comment.trim() === "") {
    throw new HttpError(400, "Comment is required");
  }

  const historyEntry = await repairOrderService.addHistoryComment(
    paramId(req),
    userId(req),
    req.user!.name,
    comment.trim(),
    req.user?.role === "admin"
  );

  res.status(201).json({ historyEntry });
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
  const result = await repairOrderService.searchRepairOrders(userId(req), req.query);
  res.json({
    repairOrders: result.repairOrders,
    pagination: result.pagination
  });
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

  let pdfPath = repairOrder.pdfPath;
  if (!pdfPath || !fs.existsSync(toAbsolutePath(pdfPath))) {
    pdfPath = (await repairOrderService.generatePdfForRepairOrder(paramId(req), userId(req), req.user?.role === "admin")).pdfPath;
  }
  if (!pdfPath) throw new HttpError(500, "Repair order PDF generation failed");
  res.sendFile(toAbsolutePath(pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  let pdfPath = repairOrder.pdfPath;
  if (!pdfPath || !fs.existsSync(toAbsolutePath(pdfPath))) {
    pdfPath = (await repairOrderService.generatePdfForRepairOrder(paramId(req), userId(req), req.user?.role === "admin")).pdfPath;
  }
  if (!pdfPath) throw new HttpError(500, "Repair order PDF generation failed");
  res.download(toAbsolutePath(pdfPath), `${repairOrder.repairOrderNumber}.pdf`);
};

export const sendEmail = async (req: Request, res: Response) => {
  const id = paramId(req);
  const uid = userId(req);
  const isAdmin = req.user?.role === "admin";
  const toEmailOverride = readOptionalToEmail(req.body);

  let repairOrder = await repairOrderService.getRepairOrderOrThrow(id, uid, isAdmin);

  const toEmail =
    toEmailOverride || resolveCustomerEmail(repairOrder.customerEmail, repairOrder.customer);

  if (!toEmail) {
    throw new HttpError(400, "Repair order does not have a customer email address configured");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    throw new HttpError(400, "Customer email address is invalid");
  }

  if (!repairOrder.pdfPath) {
    await repairOrderService.generatePdfForRepairOrder(id, uid, isAdmin);
    repairOrder = await repairOrderService.getRepairOrderOrThrow(id, uid, isAdmin);
  }

  if (!repairOrder.pdfPath) {
    throw new HttpError(400, "Repair order PDF could not be generated");
  }

  await emailService.sendRepairOrderPdfEmail(
    uid,
    toEmail,
    repairOrder.repairOrderNumber,
    repairOrder.pdfPath,
    repairOrder.customerName
  );

  res.json({ success: true });
};

import type { Request, Response } from "express";
import * as quotationService from "../services/quotationService.js";
import * as emailService from "../services/emailService.js";
import { HttpError } from "../utils/httpError.js";
import { toAbsolutePath } from "../utils/paths.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const create = async (req: Request, res: Response) => {
  const quotation = await quotationService.createQuotation(userId(req), req.body);
  res.status(201).json({ quotation });
};

export const update = async (req: Request, res: Response) => {
  const quotation = await quotationService.updateQuotation(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin"
  );
  res.json({ quotation });
};

export const updateStatus = async (req: Request, res: Response) => {
  const quotation = await quotationService.updateQuotationStatus(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin"
  );
  res.json({ quotation });
};

export const get = async (req: Request, res: Response) => {
  const quotation = await quotationService.getQuotationOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ quotation });
};

export const search = async (req: Request, res: Response) => {
  const quotations = await quotationService.searchQuotations(userId(req), req.query);
  res.json({ quotations });
};

export const generatePdf = async (req: Request, res: Response) => {
  const quotation = await quotationService.generatePdfForQuotation(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ quotation });
};

export const remove = async (req: Request, res: Response) => {
  const quotation = await quotationService.deleteQuotation(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ deleted: true, quotation });
};

export const openPdf = async (req: Request, res: Response) => {
  const quotation = await quotationService.getQuotationOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!quotation.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this quotation");
  }

  res.sendFile(toAbsolutePath(quotation.pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  const quotation = await quotationService.getQuotationOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!quotation.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this quotation");
  }

  res.download(toAbsolutePath(quotation.pdfPath), `${quotation.quotationNumber}.pdf`);
};

export const sendEmail = async (req: Request, res: Response) => {
  const id = paramId(req);
  const uid = userId(req);

  const quotation = await quotationService.getQuotationOrThrow(
    id,
    uid,
    req.user?.role === "admin"
  );

  if (!quotation.customerEmail) {
    throw new HttpError(400, "Quotation does not have a customer email address configured");
  }

  if (!quotation.pdfPath) {
    throw new HttpError(400, "Quotation PDF has not been generated yet");
  }

  await emailService.sendQuotationPdfEmail(
    quotation.customerEmail,
    quotation.quotationNumber,
    quotation.pdfPath,
    quotation.customerName
  );

  // Mark quotation as Sent after successful email delivery
  if (quotation.status === "Draft") {
    await quotationService.updateQuotationStatus(id, uid, { status: "Sent" }, req.user?.role === "admin");
  }

  res.json({ success: true });
};

export const copy = async (req: Request, res: Response) => {
  const quotation = await quotationService.copyQuotation(paramId(req), userId(req));
  res.status(201).json({ quotation });
};

export const convertToRepairOrder = async (req: Request, res: Response) => {
  const repairOrder = await quotationService.convertToRepairOrder(paramId(req), userId(req));
  res.status(201).json({ repairOrder });
};

import type { Request, Response } from "express";
import fs from "node:fs";
import * as quotationService from "../services/quotationService.js";
import * as emailService from "../services/emailService.js";
import { HttpError } from "../utils/httpError.js";
import { readOptionalToEmail, resolveCustomerEmail } from "../utils/customerEmail.js";
import { toAbsolutePath } from "../utils/paths.js";
import { invoicePdfLanguageFromRequest } from "../utils/invoicePdfLanguage.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;
const pdfLanguage = (req: Request) => invoicePdfLanguageFromRequest(req);

export const create = async (req: Request, res: Response) => {
  const quotation = await quotationService.createQuotation(userId(req), req.body, pdfLanguage(req));
  res.status(201).json({ quotation });
};

export const update = async (req: Request, res: Response) => {
  const quotation = await quotationService.updateQuotation(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin",
    pdfLanguage(req)
  );
  res.json({ quotation });
};

export const updateStatus = async (req: Request, res: Response) => {
  const quotation = await quotationService.updateQuotationStatus(
    paramId(req),
    userId(req),
    req.body,
    req.user?.role === "admin",
    pdfLanguage(req)
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
    req.user?.role === "admin",
    pdfLanguage(req)
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
  let quotation = await quotationService.getQuotationOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!quotation.pdfPath || !fs.existsSync(toAbsolutePath(quotation.pdfPath))) {
    quotation = await quotationService.generatePdfForQuotation(paramId(req), userId(req), req.user?.role === "admin", pdfLanguage(req));
  }
  if (!quotation.pdfPath) throw new HttpError(500, "Quotation PDF generation failed");
  res.sendFile(toAbsolutePath(quotation.pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  let quotation = await quotationService.getQuotationOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!quotation.pdfPath || !fs.existsSync(toAbsolutePath(quotation.pdfPath))) {
    quotation = await quotationService.generatePdfForQuotation(paramId(req), userId(req), req.user?.role === "admin", pdfLanguage(req));
  }
  if (!quotation.pdfPath) throw new HttpError(500, "Quotation PDF generation failed");
  res.download(toAbsolutePath(quotation.pdfPath), `${quotation.quotationNumber}.pdf`);
};

export const sendEmail = async (req: Request, res: Response) => {
  const id = paramId(req);
  const uid = userId(req);
  const isAdmin = req.user?.role === "admin";
  const toEmailOverride = readOptionalToEmail(req.body);

  let quotation = await quotationService.getQuotationOrThrow(id, uid, isAdmin);

  const toEmail =
    toEmailOverride || resolveCustomerEmail(quotation.customerEmail, quotation.customer);

  if (!toEmail) {
    throw new HttpError(400, "Quotation does not have a customer email address configured");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    throw new HttpError(400, "Customer email address is invalid");
  }

  if (!quotation.pdfPath) {
    quotation = await quotationService.generatePdfForQuotation(id, uid, isAdmin, pdfLanguage(req));
  }

  if (!quotation.pdfPath) {
    throw new HttpError(400, "Quotation PDF could not be generated");
  }

  await emailService.sendQuotationPdfEmail(
    uid,
    toEmail,
    quotation.quotationNumber,
    quotation.pdfPath,
    quotation.customerName
  );

  if (quotation.status === "Draft") {
    await quotationService.updateQuotationStatus(id, uid, { status: "Sent" }, isAdmin, pdfLanguage(req));
  }

  res.json({ success: true });
};

export const copy = async (req: Request, res: Response) => {
  const quotation = await quotationService.copyQuotation(paramId(req), userId(req), pdfLanguage(req));
  res.status(201).json({ quotation });
};

export const convertToRepairOrder = async (req: Request, res: Response) => {
  const repairOrder = await quotationService.convertToRepairOrder(paramId(req), userId(req), pdfLanguage(req));
  res.status(201).json({ repairOrder });
};

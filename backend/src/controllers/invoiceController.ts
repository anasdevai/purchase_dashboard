import type { Request, Response } from "express";
import * as emailService from "../services/emailService.js";
import * as invoiceService from "../services/invoiceService.js";
import { HttpError } from "../utils/httpError.js";
import { invoicePdfLanguageFromRequest } from "../utils/invoicePdfLanguage.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;
const pdfLanguage = (req: Request) => invoicePdfLanguageFromRequest(req);

export const create = async (req: Request, res: Response) => {
  const language = invoicePdfLanguageFromRequest(req);
  const invoice = await invoiceService.createInvoice(userId(req), req.body, language);
  res.status(201).json({ invoice });
};

export const createFromRepairOrder = async (req: Request, res: Response) => {
  const language = invoicePdfLanguageFromRequest(req);
  const invoice = await invoiceService.createInvoiceFromRepairOrder(
    userId(req),
    String(req.params.repairOrderId),
    language
  );
  res.status(201).json({ invoice });
};

export const update = async (req: Request, res: Response) => {
  const language = invoicePdfLanguageFromRequest(req);
  const invoice = await invoiceService.updateInvoice(paramId(req), userId(req), req.body, language);
  res.json({ invoice });
};

export const updateStatus = async (req: Request, res: Response) => {
  const invoice = await invoiceService.updateInvoicePaymentStatus(paramId(req), userId(req), req.body);
  res.json({ invoice });
};

export const get = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ invoice });
};

export const search = async (req: Request, res: Response) => {
  const invoices = await invoiceService.searchInvoices(userId(req), req.query);
  res.json({ invoices });
};

export const generatePdf = async (req: Request, res: Response) => {
  const language = invoicePdfLanguageFromRequest(req);
  const invoice = await invoiceService.generatePdfForInvoice(paramId(req), userId(req), language);
  res.json({ invoice });
};

export const remove = async (req: Request, res: Response) => {
  const invoice = await invoiceService.deleteInvoice(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ deleted: true, invoice });
};

export const openPdf = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  const language = invoicePdfLanguageFromRequest(req);
  const pdfBuffer = await invoiceService.streamInvoicePdf(
    paramId(req),
    userId(req),
    language,
    req.user?.role === "admin"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
};

export const downloadPdf = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  const language = invoicePdfLanguageFromRequest(req);
  const pdfBuffer = await invoiceService.streamInvoicePdf(
    paramId(req),
    userId(req),
    language,
    req.user?.role === "admin"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
};

export const sendEmail = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!invoice.customerEmail) {
    throw new HttpError(400, "Invoice does not have a customer email address configured");
  }

  if (!invoice.pdfPath) {
    await invoiceService.generatePdfForInvoice(paramId(req), userId(req), pdfLanguage(req));
  }

  const updatedInvoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  await emailService.sendInvoicePdfEmail(
    updatedInvoice.customerEmail!,
    updatedInvoice.invoiceNumber,
    updatedInvoice.pdfPath,
    updatedInvoice.customerName
  );

  res.json({ success: true });
};

import type { Request, Response } from "express";
import * as emailService from "../services/emailService.js";
import * as invoiceService from "../services/invoiceService.js";
import { HttpError } from "../utils/httpError.js";
import { readOptionalToEmail, resolveCustomerEmail } from "../utils/customerEmail.js";
import { invoicePdfLanguageFromRequest } from "../utils/invoicePdfLanguage.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;
const pdfLanguage = (req: Request) => invoicePdfLanguageFromRequest(req);

export const create = async (req: Request, res: Response) => {
  const language = pdfLanguage(req);
  const invoice = await invoiceService.createInvoice(userId(req), req.body, language);
  res.status(201).json({ invoice });
};

export const createFromRepairOrder = async (req: Request, res: Response) => {
  const language = pdfLanguage(req);
  const invoice = await invoiceService.createInvoiceFromRepairOrder(
    userId(req),
    String(req.params.repairOrderId),
    language
  );
  res.status(201).json({ invoice });
};

export const update = async (req: Request, res: Response) => {
  const language = pdfLanguage(req);
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
  const language = pdfLanguage(req);
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

  const pdfBuffer = await invoiceService.streamInvoicePdf(
    paramId(req),
    userId(req),
    pdfLanguage(req),
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

  const pdfBuffer = await invoiceService.streamInvoicePdf(
    paramId(req),
    userId(req),
    pdfLanguage(req),
    req.user?.role === "admin"
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
};

export const sendEmail = async (req: Request, res: Response) => {
  const id = paramId(req);
  const uid = userId(req);
  const language = pdfLanguage(req);
  const toEmailOverride = readOptionalToEmail(req.body);

  let invoice = await invoiceService.getInvoiceOrThrow(id, uid, req.user?.role === "admin");

  const toEmail =
    toEmailOverride || resolveCustomerEmail(invoice.customerEmail, invoice.customer);

  if (!toEmail) {
    throw new HttpError(400, "Invoice does not have a customer email address configured");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    throw new HttpError(400, "Customer email address is invalid");
  }

  if (!invoice.pdfPath) {
    invoice = await invoiceService.generatePdfForInvoice(id, uid, language);
  }

  if (!invoice.pdfPath) {
    throw new HttpError(400, "Invoice PDF could not be generated");
  }

  await emailService.sendInvoicePdfEmail(
    uid,
    toEmail,
    invoice.invoiceNumber,
    invoice.pdfPath,
    invoice.customerName
  );

  if (["Draft", "Open"].includes(invoice.paymentStatus || "")) {
    await invoiceService.updateInvoicePaymentStatus(id, uid, {
      paymentStatus: "Sent"
    });
  }

  res.json({ success: true });
};

export const copy = async (req: Request, res: Response) => {
  const invoice = await invoiceService.copyInvoice(paramId(req), userId(req));
  res.status(201).json({ invoice });
};

export const cancel = async (req: Request, res: Response) => {
  const reason = req.body.cancellationReason;
  const invoice = await invoiceService.cancelInvoice(paramId(req), userId(req), reason);
  res.json({ invoice });
};

export const sendReminder = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(paramId(req), userId(req));

  if (!invoice.customerEmail) {
    throw new HttpError(400, "Invoice does not have a customer email address configured");
  }

  await emailService.sendPaymentReminderEmail(
    userId(req),
    invoice.customerEmail,
    invoice.invoiceNumber,
    invoice.calculatedGrossTotal,
    invoice.customerName
  );

  if (["Open", "Sent"].includes(invoice.paymentStatus || "")) {
    await invoiceService.updateInvoicePaymentStatus(paramId(req), userId(req), {
      paymentStatus: "Overdue"
    });
  }

  res.json({ success: true });
};

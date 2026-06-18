import type { Request } from "express";
import {
  parseInvoicePdfLanguage,
  type InvoicePdfLanguage
} from "../pdf/i18n/invoicePdfI18n.js";

export const invoicePdfLanguageFromRequest = (req: Request): InvoicePdfLanguage =>
  parseInvoicePdfLanguage(
    req.query.lang ||
    req.body?.lang ||
    req.body?.language ||
    req.headers["x-app-language"] ||
    req.headers["accept-language"]
  );

export { parseInvoicePdfLanguage, type InvoicePdfLanguage };

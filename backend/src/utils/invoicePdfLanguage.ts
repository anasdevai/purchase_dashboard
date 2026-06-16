import type { Request } from "express";
import {
  parseInvoicePdfLanguage,
  resolveInvoicePdfLanguage,
  type InvoicePdfLanguage
} from "../pdf/i18n/invoicePdfI18n.js";

export const invoicePdfLanguageFromRequest = (req: Request): InvoicePdfLanguage =>
  resolveInvoicePdfLanguage(
    req.query.lang,
    req.body?.lang,
    req.body?.language,
    req.headers["x-app-language"],
    req.headers["accept-language"]
  );

export { parseInvoicePdfLanguage, type InvoicePdfLanguage };

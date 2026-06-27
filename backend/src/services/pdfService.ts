import {
  ensureDirectory,
  getContractStorageDir,
  getInvoiceStorageDir,
  getRepairOrderStorageDir,
  getQuotationStorageDir,
  toRelativeStoragePath
} from "../utils/paths.js";
import type { InvoicePdfLanguage } from "../pdf/i18n/invoicePdfI18n.js";
import { renderHtmlToPdf, renderHtmlToPdfBuffer } from "../pdf/htmlToPdf.js";
import { renderContractHtml } from "../pdf/templates/contractTemplate.js";
import { renderInvoiceHtml } from "../pdf/templates/invoiceTemplate.js";
import { renderRepairOrderHtml } from "../pdf/templates/repairOrderTemplate.js";
import { renderQuotationHtml } from "../pdf/templates/quotationTemplate.js";
import { renderCustomerListHtml } from "../pdf/templates/customerListTemplate.js";
import type {
  ContractForPdf,
  InvoiceForPdf,
  PdfShopSettings,
  RepairOrderForPdf,
  QuotationForPdf
} from "../pdf/types.js";

export type { PdfShopSettings } from "../pdf/types.js";
export type { InvoicePdfLanguage } from "../pdf/i18n/invoicePdfI18n.js";

export const generateQuotationPdf = async (
  quotation: QuotationForPdf,
  shopSettings?: PdfShopSettings,
  language: "de" | "en" = "de"
) => {
  const storageDir = getQuotationStorageDir(quotation.userId, quotation.quotationNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/quotation.pdf`;
  const html = renderQuotationHtml(quotation, shopSettings, language);
  await renderHtmlToPdf(html, absolutePdfPath, { fullBleed: true });

  return toRelativeStoragePath(absolutePdfPath);
};


export const generateContractPdf = async (
  contract: ContractForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "de"
) => {
  const storageDir = getContractStorageDir(contract.userId, contract.contractNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/contract.pdf`;
  const html = renderContractHtml(contract, shopSettings, language);
  await renderHtmlToPdf(html, absolutePdfPath, { fullBleed: true });

  return toRelativeStoragePath(absolutePdfPath);
};

export const generateRepairOrderPdf = async (
  repairOrder: RepairOrderForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "de"
) => {
  const storageDir = getRepairOrderStorageDir(repairOrder.userId, repairOrder.repairOrderNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/repair-order.pdf`;
  const html = renderRepairOrderHtml(repairOrder, shopSettings, language);
  await renderHtmlToPdf(html, absolutePdfPath, { fullBleed: true });

  return toRelativeStoragePath(absolutePdfPath);
};

export const renderInvoicePdfBuffer = async (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "en"
) => {
  const html = renderInvoiceHtml(invoice, shopSettings, language);
  return renderHtmlToPdfBuffer(html, { fullBleed: true });
};

export const generateInvoicePdf = async (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "en"
) => {
  const storageDir = getInvoiceStorageDir(invoice.userId, invoice.invoiceNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/invoice.pdf`;
  const html = renderInvoiceHtml(invoice, shopSettings, language);

  if (process.env.NODE_ENV !== "production") {
    console.log("[invoice:pdf] Rendering invoice PDF", {
      invoiceNumber: invoice.invoiceNumber,
      outputPath: absolutePdfPath,
      language,
    });
  }

  try {
    await renderHtmlToPdf(html, absolutePdfPath, { fullBleed: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[invoice:pdf] Puppeteer render failed", { invoiceNumber: invoice.invoiceNumber, message });
    }
    throw error;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[invoice:pdf] Invoice PDF written", { outputPath: absolutePdfPath });
  }

  return toRelativeStoragePath(absolutePdfPath);
};

export type CustomerForPdfExport = {
  customerNumber: string | null;
  salutation: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string;
  company: string | null;
  street: string | null;
  zipCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  newsletter: boolean | null;
  createdAt: Date;
};

export const generateCustomersPdf = async (
  customers: CustomerForPdfExport[],
  shopSettings?: PdfShopSettings
): Promise<Buffer> => {
  const html = renderCustomerListHtml(customers, shopSettings);
  return renderHtmlToPdfBuffer(html);
};


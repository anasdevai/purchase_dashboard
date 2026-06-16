import {
  ensureDirectory,
  getContractStorageDir,
  getInvoiceStorageDir,
  getRepairOrderStorageDir,
  toRelativeStoragePath
} from "../utils/paths.js";
import type { InvoicePdfLanguage } from "../pdf/i18n/invoicePdfI18n.js";
import { renderHtmlToPdf, renderHtmlToPdfBuffer } from "../pdf/htmlToPdf.js";
import { renderContractHtml } from "../pdf/templates/contractTemplate.js";
import { renderInvoiceHtml } from "../pdf/templates/invoiceTemplate.js";
import { renderRepairOrderHtml } from "../pdf/templates/repairOrderTemplate.js";
import type {
  ContractForPdf,
  InvoiceForPdf,
  PdfShopSettings,
  RepairOrderForPdf
} from "../pdf/types.js";

export type { PdfShopSettings } from "../pdf/types.js";
export type { InvoicePdfLanguage } from "../pdf/i18n/invoicePdfI18n.js";

export const generateContractPdf = async (
  contract: ContractForPdf,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getContractStorageDir(contract.userId, contract.contractNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/contract.pdf`;
  const html = renderContractHtml(contract, shopSettings);
  await renderHtmlToPdf(html, absolutePdfPath);

  return toRelativeStoragePath(absolutePdfPath);
};

export const generateRepairOrderPdf = async (
  repairOrder: RepairOrderForPdf,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getRepairOrderStorageDir(repairOrder.userId, repairOrder.repairOrderNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/repair-order.pdf`;
  const html = renderRepairOrderHtml(repairOrder, shopSettings);
  await renderHtmlToPdf(html, absolutePdfPath);

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
  await renderHtmlToPdf(html, absolutePdfPath, { fullBleed: true });

  return toRelativeStoragePath(absolutePdfPath);
};

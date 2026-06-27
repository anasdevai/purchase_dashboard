import {
  getInvoicePdfLabels,
  translateInvoicePaymentMethod,
  translateInvoicePaymentStatus,
  type InvoicePdfLanguage
} from "../i18n/invoicePdfI18n.js";
import type { InvoiceForPdf, PdfShopSettings } from "../types.js";
import { displayValue, formatDateEuropean, formatMoneyDecimal, hasText, numericValue } from "../utils.js";
import { renderReferenceDocument, type ReferenceItem, type ReferenceRow } from "./referenceLayout.js";

export const renderInvoiceHtml = (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "en"
) => {
  const de = language === "de";
  const t = getInvoicePdfLabels(language);
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const serviceText =
    [invoice.deviceSummary, invoice.repairSummary]
      .map((value) => (hasText(value) ? String(value).trim() : ""))
      .filter(Boolean)
      .join(" – ") ||
    (items[0] ? String(displayValue(items[0].description)).split(/\r?\n/)[0]?.trim() : "") ||
    t.service;

  const referenceItems: ReferenceItem[] = items.map((item, index) => {
    const lines = String(displayValue(item.description))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      position: index + 1,
      description: lines[0] || "-",
      detail: lines.slice(1).join(" · ") || undefined,
      quantity: numericValue(item.quantity),
      amount: formatMoneyDecimal(item.lineTotal)
    };
  });

  // VAT grouped per rate so each appears as its own totals line (e.g. "+ 20% MwSt.").
  const vatBreakdown = new Map<string, number>();
  items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    vatBreakdown.set(key, (vatBreakdown.get(key) ?? 0) + Number(item.lineVat?.toString() ?? 0));
  });

  const vatWord = de ? "MwSt." : "VAT";
  const totals: ReferenceRow[] = [
    { label: de ? "Netto-Betrag:" : "Net amount:", value: formatMoneyDecimal(invoice.calculatedNetAmount) },
    ...Array.from(vatBreakdown.entries()).map(([percent, vat]) => ({
      label: `+ ${percent}% ${vatWord}:`,
      value: formatMoneyDecimal(vat)
    }))
  ];

  const customer: ReferenceRow[] = [
    { label: `${t.customer}:`, value: invoice.customerName },
    { label: `${t.phoneLabel}:`, value: invoice.customerPhone },
    { label: `${t.emailLabel}:`, value: invoice.customerEmail },
    { label: `${t.addressLabel}:`, value: invoice.customerAddress }
  ];

  const details: ReferenceRow[] = [
    { label: "", value: `${t.service}: ${serviceText}` },
    { label: t.serviceDate, value: invoice.serviceDate ? formatDateEuropean(invoice.serviceDate) : null },
    { label: t.dueDate, value: invoice.dueDate ? formatDateEuropean(invoice.dueDate) : null },
    {
      label: t.paymentStatus,
      value: hasText(invoice.paymentStatus)
        ? translateInvoicePaymentStatus(invoice.paymentStatus, language)
        : null
    },
    {
      label: t.paymentMethod,
      value: hasText(invoice.paymentMethod)
        ? translateInvoicePaymentMethod(invoice.paymentMethod, language)
        : null
    }
  ];

  const paymentRows: ReferenceRow[] = [
    { label: t.accountHolder, value: shopSettings?.accountHolder },
    { label: t.iban, value: shopSettings?.iban },
    { label: t.bic, value: shopSettings?.bicSwift },
    { label: t.bank, value: shopSettings?.bankName },
    { label: t.paymentDate, value: invoice.paymentDate ? formatDateEuropean(invoice.paymentDate) : null },
    { label: t.paymentReference, value: invoice.paymentReference }
  ];

  return renderReferenceDocument({
    pageTitle: `${de ? "Rechnung" : "Invoice"} ${invoice.invoiceNumber}`,
    title: t.documentTitle,
    numberLabel: `${t.invoiceNumber}:`,
    number: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    shopSettings,
    language,
    customer,
    details,
    items: referenceItems,
    totals,
    grandLabel: de ? "Gesamtbetrag (Brutto):" : "Total (gross):",
    grandValue: formatMoneyDecimal(invoice.calculatedGrossTotal),
    paymentTitle: t.paymentTitle,
    paymentRows,
    notesTitle: de ? "Leistungsbeschreibung:" : "Service description:",
    notes: hasText(invoice.notes) ? String(invoice.notes).trim() : null,
    showSignatures: false
  });
};

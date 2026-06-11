import { getInvoicePdfLabels, type InvoicePdfLanguage } from "../i18n/invoicePdfI18n.js";
import { getPdfStyles } from "../styles/pdfStyles.js";
import type { InvoiceForPdf, PdfShopSettings } from "../types.js";
import {
  buildCompanyHeaderHtml,
  buildLegalFooterHtml,
  buildPaymentSectionHtml,
  displayValue,
  escapeHtml,
  formatAmountDecimal,
  formatDateEuropean,
  formatMoneyDecimal,
  hasText,
  numericValue,
  wrapHtmlDocument
} from "../utils.js";

export const renderInvoiceHtml = (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "de"
) => {
  const t = getInvoicePdfLabels(language);
  const serviceSummary = invoice.repairSummary?.trim() || invoice.deviceSummary?.trim();

  const customerLine = [
    escapeHtml(invoice.customerName),
    hasText(invoice.customerAddress) ? escapeHtml(String(invoice.customerAddress).trim()) : ""
  ]
    .filter(Boolean)
    .join(", ");

  const vatBreakdown = new Map<string, { net: number; vat: number }>();
  invoice.items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    const current = vatBreakdown.get(key) ?? { net: 0, vat: 0 };
    current.net += Number(item.lineNet?.toString() ?? 0);
    current.vat += Number(item.lineVat?.toString() ?? 0);
    vatBreakdown.set(key, current);
  });

  const vatLines = Array.from(vatBreakdown.entries())
    .map(
      ([percent, totals]) =>
        `<div class="invoice-totals__line">+ ${escapeHtml(percent)}% ${escapeHtml(t.vatOn)}: ${formatMoneyDecimal(totals.vat)}</div>`
    )
    .join("");

  const itemRows = invoice.items
    .map(
      (item, index) => `<tr>
        <td class="pos">${index + 1}</td>
        <td>${escapeHtml(displayValue(item.description))}</td>
        <td class="num">${escapeHtml(numericValue(item.quantity))}</td>
        <td class="num">${formatAmountDecimal(item.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const serviceDescription = hasText(invoice.notes)
    ? String(invoice.notes).trim()
    : serviceSummary || "";

  const body = `
    ${buildCompanyHeaderHtml(shopSettings, { largeLogo: true, hideMeta: true })}

    <section class="invoice-meta avoid-break">
      <div class="meta-line"><strong>${escapeHtml(t.invoiceNumber)}:</strong> ${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="meta-line"><strong>${escapeHtml(t.date)}:</strong> ${formatDateEuropean(invoice.invoiceDate)}</div>
      <div class="meta-line"><strong>${escapeHtml(t.customer)}:</strong> ${customerLine}</div>
    </section>

    <hr class="divider" />

    ${
      serviceSummary
        ? `<div class="subject-line avoid-break"><strong>${escapeHtml(t.service)}:</strong> ${escapeHtml(serviceSummary)}</div>`
        : ""
    }

    <section class="section avoid-break">
      <table class="data-table invoice-table">
        <thead>
          <tr>
            <th class="pos">${escapeHtml(t.position)}</th>
            <th>${escapeHtml(t.description)}</th>
            <th class="num">${escapeHtml(t.quantity)}</th>
            <th class="num">${escapeHtml(t.gross)}</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="4">-</td></tr>`}
        </tbody>
      </table>
    </section>

    <hr class="divider" />

    <section class="invoice-totals avoid-break">
      <div class="invoice-totals__line"><strong>${escapeHtml(t.netAmount)}:</strong> ${formatMoneyDecimal(invoice.calculatedNetAmount)}</div>
      ${vatLines}
      <div class="invoice-totals__line invoice-totals__line--gross"><strong>${escapeHtml(t.grossTotal)}:</strong> ${formatMoneyDecimal(invoice.calculatedGrossTotal)}</div>
    </section>

  ${
    serviceDescription
      ? `<hr class="divider" />
         <section class="service-description avoid-break">
           <strong>${escapeHtml(t.serviceDescription)}:</strong> ${escapeHtml(serviceDescription)}
         </section>`
      : ""
  }

    ${buildPaymentSectionHtml(shopSettings, {
      paymentTitle: t.paymentTitle,
      accountHolder: t.accountHolder,
      iban: t.iban,
      bic: t.bic,
      bank: t.bank
    })}

    ${buildLegalFooterHtml(shopSettings, {
      alignLeft: true,
      labels: {
        uid: t.uid,
        companyRegistration: t.companyRegistration,
        taxNumber: t.taxNumber
      }
    })}
  `;

  const pageTitle =
    language === "en"
      ? `Invoice ${invoice.invoiceNumber}`
      : `Rechnung ${invoice.invoiceNumber}`;

  return wrapHtmlDocument(pageTitle, getPdfStyles(), body, language);
};

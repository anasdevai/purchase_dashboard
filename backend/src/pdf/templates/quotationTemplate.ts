import { getPdfStyles } from "../styles/pdfStyles.js";
import type { PdfShopSettings, QuotationForPdf } from "../types.js";
import {
  buildCompanyHeaderHtml,
  buildKvGridHtml,
  displayValue,
  escapeHtml,
  formatDateEuropean,
  formatDateShort,
  formatMoneyDecimal,
  numericValue,
  wrapHtmlDocument
} from "../utils.js";

const labels = {
  de: {
    documentTitle: "ANGEBOT",
    quotationNumber: "Angebot Nr.",
    date: "Datum",
    validUntil: "Gültig bis",
    customerInfo: "Kundeninformationen",
    deviceInfo: "Geräteinformationen",
    quotationItems: "Angebotsdetails",
    name: "Name:",
    phone: "Telefon:",
    email: "E-Mail:",
    address: "Adresse:",
    deviceType: "Gerätetyp:",
    brand: "Marke:",
    model: "Modell:",
    imeiOrSerial: "IMEI/Seriennummer:",
    position: "Pos",
    repairType: "Reparaturart",
    description: "Beschreibung",
    unitPrice: "Einzelpreis",
    quantity: "Menge",
    discount: "Rabatt",
    totalPrice: "Gesamtpreis",
    netAmount: "Netto-Betrag",
    vatAmount: "MwSt.",
    grossTotal: "Brutto-Gesamtsumme",
    terms: "Geschäftsbedingungen & Hinweise",
    termsText: "Dieses Angebot ist ab dem Ausstellungsdatum 14 Tage gültig. Die Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Bei Annahme des Angebots kann dieses in einen kostenpflichtigen Reparaturauftrag umgewandelt werden.",
    signature: "Kundenunterschrift bei Annahme",
    signatureLine: "Unterschrift Kunde",
    dateLine: "Datum"
  },
  en: {
    documentTitle: "QUOTATION",
    quotationNumber: "Quotation No.",
    date: "Date",
    validUntil: "Valid Until",
    customerInfo: "Customer Information",
    deviceInfo: "Device Information",
    quotationItems: "Quotation Items",
    name: "Name:",
    phone: "Phone:",
    email: "Email:",
    address: "Address:",
    deviceType: "Device Type:",
    brand: "Brand:",
    model: "Model:",
    imeiOrSerial: "IMEI/Serial No:",
    position: "Pos",
    repairType: "Repair Type",
    description: "Description",
    unitPrice: "Unit Price",
    quantity: "Qty",
    discount: "Discount",
    totalPrice: "Line Total",
    netAmount: "Net Amount",
    vatAmount: "VAT",
    grossTotal: "Gross Total",
    terms: "Terms & Conditions",
    termsText: "This quotation is valid for 14 days from the date of issue. Prices include applicable taxes. Upon acceptance, this quotation can be converted into a repair order.",
    signature: "Customer Signature on Acceptance",
    signatureLine: "Customer Signature",
    dateLine: "Date"
  }
};

export const renderQuotationHtml = (
  quotation: QuotationForPdf,
  shopSettings?: PdfShopSettings,
  language: "de" | "en" = "de"
) => {
  const t = labels[language];

  // Financial Calculations
  const grossTotal = quotation.items.reduce(
    (sum, item) => sum + Number(item.lineTotal?.toString() ?? 0),
    0
  );

  const vatPercent = shopSettings?.defaultVatRate ? Number(shopSettings.defaultVatRate) : 20;
  const netAmount = Math.round(grossTotal / (1 + vatPercent / 100));
  const vatAmount = grossTotal - netAmount;

  const itemRows = quotation.items
    .map((item, index) => {
      const discountText = item.discount && Number(item.discount) > 0
        ? `${numericValue(item.discount)}%`
        : "-";

      return `<tr>
        <td class="pos">${index + 1}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(item.repairType)}</div>
          <div style="color: #64748b; font-size: 7.5pt; margin-top: 2px;">${escapeHtml(item.description)}</div>
        </td>
        <td class="num">${formatMoneyDecimal(item.unitPrice)}</td>
        <td class="num" style="text-align: center;">${numericValue(item.quantity)}</td>
        <td class="num" style="text-align: center;">${discountText}</td>
        <td class="num">${formatMoneyDecimal(item.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const body = `
    <div class="compact">
      ${buildCompanyHeaderHtml(shopSettings, {
        compactLogo: true,
        meta: {
          numberLabel: t.quotationNumber,
          numberValue: quotation.quotationNumber,
          dateLabel: t.date,
          date: quotation.createdAt,
          europeanDate: true
        }
      })}

      <h1 class="doc-title doc-title--center">${t.documentTitle}</h1>

      <div class="avoid-break" style="display: flex; justify-content: center; margin-bottom: 12px;">
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 6px 16px; font-size: 8.5pt; color: #0369a1; font-weight: 600;">
          ${t.validUntil}: ${formatDateEuropean(new Date(quotation.validUntilDate))}
        </div>
      </div>

      <section class="section avoid-break">
        <h2 class="section-title">${t.customerInfo}</h2>
        ${buildKvGridHtml([
          { label: t.name, value: quotation.customerName, half: true },
          { label: t.phone, value: quotation.customerPhone, half: true },
          { label: t.email, value: quotation.customerEmail },
          { label: t.address, value: quotation.customerAddress }
        ])}
      </section>

      <section class="section avoid-break">
        <h2 class="section-title">${t.deviceInfo}</h2>
        ${buildKvGridHtml([
          { label: t.deviceType, value: quotation.deviceType, half: true },
          { label: t.brand, value: quotation.brand, half: true },
          { label: t.model, value: quotation.model, half: true },
          { label: t.imeiOrSerial, value: quotation.imeiOrSerial, half: true }
        ])}
      </section>

      <section class="section avoid-break">
        <h2 class="section-title">${t.quotationItems}</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th class="pos">${t.position}</th>
              <th>${t.repairType} / ${t.description}</th>
              <th class="num" style="width: 80px;">${t.unitPrice}</th>
              <th class="num" style="width: 50px; text-align: center;">${t.quantity}</th>
              <th class="num" style="width: 60px; text-align: center;">${t.discount}</th>
              <th class="num" style="width: 80px;">${t.totalPrice}</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || `<tr><td colspan="6" style="text-align: center;">-</td></tr>`}
          </tbody>
        </table>
      </section>

      <div class="totals-block avoid-break" style="margin-bottom: 12px;">
        <div class="vat-breakdown">
          <div class="vat-breakdown__title">${t.terms}</div>
          <div class="vat-breakdown__line" style="font-size: 7.5pt; line-height: 1.4;">
            ${t.termsText}
          </div>
          ${quotation.notes ? `<div style="margin-top: 6px; font-weight: 700; font-size: 8pt; color: #111827;">${t.quotationItems}: <span style="font-weight: 400; color: #374151;">${escapeHtml(quotation.notes)}</span></div>` : ""}
        </div>
        <div class="totals-panel">
          <div class="totals-row">
            <span>${t.netAmount}</span>
            <span>${formatMoneyDecimal(netAmount)}</span>
          </div>
          <div class="totals-row">
            <span>${t.vatAmount} (${numericValue(vatPercent)}%)</span>
            <span>${formatMoneyDecimal(vatAmount)}</span>
          </div>
          <div class="totals-row totals-row--gross">
            <span>Brutto</span>
            <span>${formatMoneyDecimal(grossTotal)}</span>
          </div>
        </div>
      </div>

      <section class="panel avoid-break">
        <div class="panel__title">${t.signature}</div>
        <div class="signature-line-row">
          <div class="signature-line">${t.signatureLine}</div>
          <div class="signature-line">${t.dateLine}</div>
        </div>
      </section>
    </div>
  `;

  const pageTitle = `${t.documentTitle} ${quotation.quotationNumber}`;

  return wrapHtmlDocument(pageTitle, getPdfStyles(), body, language);
};

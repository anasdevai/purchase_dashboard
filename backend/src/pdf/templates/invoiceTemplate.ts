import {
  getInvoicePdfLabels,
  translateInvoicePaymentMethod,
  translateInvoicePaymentStatus,
  type InvoicePdfLanguage
} from "../i18n/invoicePdfI18n.js";
import type { InvoiceForPdf, PdfShopSettings } from "../types.js";
import { getPdfStyles } from "../styles/pdfStyles.js";
import {
  displayValue,
  escapeHtml,
  formatDateEuropean,
  formatMoneyDecimal,
  getScleraLogoDataUrl,
  getStructuredAddressLines,
  hasText,
  numericValue,
  wrapHtmlDocument
} from "../utils.js";

const INK = "#111111";

const getInvoiceStyles = () => `
  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  .pdf-body {
    font-family: Helvetica, Arial, "Segoe UI", sans-serif;
    font-size: 9pt;
    line-height: 1.4;
    color: ${INK};
    background: #ffffff;
  }

  .pdf-page {
    width: 210mm;
    min-height: 296mm;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  .inv {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  /* ----- Header ----- */
  .inv-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    background: #f3f4f6;
    padding: 16mm 14mm 12mm;
  }

  .inv-header__brand {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    max-width: 60%;
  }

  .inv-logo {
    display: block;
    max-width: 240px;
    max-height: 110px;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .inv-logo--placeholder {
    width: 200px;
    height: 90px;
  }

  .inv-company {
    font-size: 15pt;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: ${INK};
  }

  .inv-title {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 160px;
    margin: -16mm -14mm -12mm 0;
    padding: 0 26px;
    background: ${INK};
    color: #ffffff;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  /* ----- Info section ----- */
  .inv-info {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 10mm 14mm 6mm;
  }

  .inv-info__col {
    flex: 1 1 0;
  }

  .inv-info__col--right {
    text-align: left;
  }

  .inv-info__row {
    display: flex;
    gap: 10px;
    margin: 4px 0;
    font-size: 8.5pt;
  }

  .inv-info__label {
    flex: 0 0 92px;
    font-weight: 700;
    color: ${INK};
  }

  .inv-info__value {
    flex: 1 1 auto;
    min-width: 0;
    word-break: break-word;
  }

  .inv-info__value strong {
    font-weight: 700;
  }

  .inv-info__value-line {
    display: block;
  }

  /* ----- Items table ----- */
  .inv-table-wrap {
    padding: 4mm 14mm 0;
  }

  .inv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }

  .inv-table thead th {
    background: ${INK};
    color: #ffffff;
    text-align: left;
    font-weight: 700;
    padding: 10px 12px;
  }

  .inv-table thead th.num {
    text-align: right;
  }

  .inv-table tbody td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
    background: #fbfbfc;
  }

  .inv-table tbody td.num {
    text-align: right;
    white-space: nowrap;
  }

  .inv-table .pos {
    width: 64px;
    text-align: center;
  }

  .inv-table td.pos {
    text-align: center;
    font-weight: 600;
  }

  .inv-table .col-qty {
    width: 80px;
  }

  .inv-table .col-unit {
    width: 95px;
  }

  .inv-table .col-amount {
    width: 95px;
  }

  .inv-item__name {
    font-weight: 700;
    color: ${INK};
  }

  .inv-item__sub {
    margin-top: 2px;
    font-size: 7.5pt;
    color: #6b7280;
  }

  .inv-table tbody tr.inv-table__spacer td {
    height: 26px;
    background: #f3f4f6;
    border-bottom: 0;
  }

  .inv-notes {
    padding: 6mm 14mm 0;
    font-size: 8.5pt;
    color: #374151;
  }

  .inv-notes__title {
    font-weight: 700;
    color: ${INK};
    margin-bottom: 4px;
  }

  .inv-summary {
    display: flex;
    justify-content: space-between;
    gap: 28px;
    padding: 10mm 14mm 0;
  }

  .inv-summary__left {
    flex: 1 1 0;
  }

  .inv-summary__right {
    flex: 0 0 46%;
    max-width: 46%;
  }

  .inv-pay__title {
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .inv-pay__row {
    font-size: 8.5pt;
    margin: 3px 0;
    color: #374151;
  }

  .inv-pay__row strong {
    color: ${INK};
    font-weight: 700;
  }

  .inv-total__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 8px 0;
    font-size: 9pt;
    border-bottom: 1px solid #d1d5db;
  }

  .inv-total__row span:last-child {
    font-weight: 600;
    white-space: nowrap;
  }

  .inv-total__row--grand {
    border-bottom: 0;
    padding-top: 10px;
    font-size: 11pt;
    font-weight: 800;
  }

  .inv-total__row--grand span:last-child {
    font-weight: 800;
  }

  /* ----- Signature ----- */
  .inv-signature {
    display: flex;
    justify-content: flex-end;
    padding: 10mm 14mm 0;
  }

  .inv-signature__box {
    width: 200px;
    text-align: center;
  }

  .inv-signature__img {
    display: block;
    max-width: 180px;
    max-height: 60px;
    margin: 0 auto 4px;
    object-fit: contain;
  }

  .inv-signature__line {
    border-top: 1px solid ${INK};
    padding-top: 4px;
    font-size: 8pt;
    color: #374151;
  }

  /* ----- Footer contact bar ----- */
  .inv-footer {
    margin-top: auto;
    display: flex;
    align-items: stretch;
    gap: 0;
    padding: 7mm 12mm 9mm;
    border-top: 1px solid #e5e7eb;
  }

  .inv-footer__item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 0 14px;
    font-size: 7.5pt;
    color: #374151;
    flex: 1 1 0;
    min-width: 0;
  }

  .inv-footer__sep {
    flex: 0 0 auto;
    align-self: center;
    width: 1px;
    height: 44px;
    background: ${INK};
  }

  .inv-footer__icon {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${INK};
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .inv-footer__icon svg {
    width: 11px;
    height: 11px;
    fill: #ffffff;
  }

  .inv-footer__text {
    min-width: 0;
    word-break: break-word;
  }
`;

const FOOTER_ICONS = {
  location:
    '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>'
};

const renderDescriptionCell = (description: unknown) => {
  const raw = String(displayValue(description));
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const main = lines[0] ?? "-";
  const sub = lines.slice(1).join(" ");

  return `<div class="inv-item__name">${escapeHtml(main)}</div>${
    sub ? `<div class="inv-item__sub">${escapeHtml(sub)}</div>` : ""
  }`;
};

export const renderInvoiceHtml = (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "en"
) => {
  const t = getInvoicePdfLabels(language);
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const customerName = hasText(invoice.customerName) ? String(invoice.customerName).trim() : "-";

  const addressLines = getStructuredAddressLines(shopSettings);
  const addressText = addressLines.join(", ");

  const logoSrc = shopSettings?.logoDataUrl || getScleraLogoDataUrl() || "";
  const logoHtml = logoSrc
    ? `<img class="inv-logo" src="${logoSrc}" alt="Logo" />`
    : `<div class="inv-logo inv-logo--placeholder"></div>`;

  const companyNameHtml = hasText(shopSettings?.name)
    ? `<div class="inv-company">${escapeHtml(String(shopSettings?.name).trim())}</div>`
    : "";

  const companyInfoRows: string[] = [];
  if (addressLines.length > 0) {
    companyInfoRows.push(`<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.addressLabel)}</span>
      <span class="inv-info__value">${addressLines
        .map((line) => `<span class="inv-info__value-line">${escapeHtml(line)}</span>`)
        .join("")}</span>
    </div>`);
  }
  if (hasText(shopSettings?.email)) {
    companyInfoRows.push(`<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.emailLabel)}</span>
      <span class="inv-info__value">${escapeHtml(String(shopSettings?.email).trim())}</span>
    </div>`);
  }
  if (hasText(shopSettings?.vatNumber)) {
    companyInfoRows.push(`<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.uid)}</span>
      <span class="inv-info__value">${escapeHtml(String(shopSettings?.vatNumber).trim())}</span>
    </div>`);
  }

  const invoiceToValue = [
    `<span class="inv-info__value-line"><strong>${escapeHtml(customerName)}</strong></span>`,
    hasText(invoice.customerAddress)
      ? `<span class="inv-info__value-line">${escapeHtml(String(invoice.customerAddress).trim())}</span>`
      : ""
  ]
    .filter(Boolean)
    .join("");

  const invoiceInfoRows = [
    `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.invoiceTo)}</span>
      <span class="inv-info__value">${invoiceToValue}</span>
    </div>`,
    hasText(invoice.customerPhone)
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.phoneLabel)}</span>
      <span class="inv-info__value">${escapeHtml(String(invoice.customerPhone).trim())}</span>
    </div>`
      : "",
    hasText(invoice.customerEmail)
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.emailLabel)}</span>
      <span class="inv-info__value">${escapeHtml(String(invoice.customerEmail).trim())}</span>
    </div>`
      : "",
    `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.invoiceNumber ?? t.invoiceShort)}</span>
      <span class="inv-info__value">${escapeHtml(invoice.invoiceNumber)}</span>
    </div>`,
    `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.date)}</span>
      <span class="inv-info__value">${formatDateEuropean(invoice.invoiceDate)}</span>
    </div>`,
    invoice.serviceDate
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.serviceDate)}</span>
      <span class="inv-info__value">${formatDateEuropean(invoice.serviceDate)}</span>
    </div>`
      : "",
    invoice.dueDate
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.dueDate)}</span>
      <span class="inv-info__value">${formatDateEuropean(invoice.dueDate)}</span>
    </div>`
      : "",
    hasText(invoice.paymentStatus)
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.paymentStatus)}</span>
      <span class="inv-info__value">${escapeHtml(translateInvoicePaymentStatus(invoice.paymentStatus, language))}</span>
    </div>`
      : "",
    hasText(invoice.paymentMethod)
      ? `<div class="inv-info__row">
      <span class="inv-info__label">${escapeHtml(t.paymentMethod)}</span>
      <span class="inv-info__value">${escapeHtml(translateInvoicePaymentMethod(invoice.paymentMethod, language))}</span>
    </div>`
      : ""
  ].filter(Boolean).join("");

  const itemRows = items
    .map(
      (item, index) => `<tr>
        <td class="pos">${index + 1}</td>
        <td>${renderDescriptionCell(item.description)}</td>
        <td class="num col-qty">${escapeHtml(numericValue(item.quantity))}</td>
        <td class="num col-unit">${formatMoneyDecimal(item.unitPrice)}</td>
        <td class="num col-amount">${formatMoneyDecimal(item.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const spacerRow = `<tr class="inv-table__spacer"><td colspan="5"></td></tr>`;

  // Group VAT by percentage so the totals reflect each rate (e.g. "VAT 20%").
  const vatBreakdown = new Map<string, number>();
  items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    vatBreakdown.set(key, (vatBreakdown.get(key) ?? 0) + Number(item.lineVat?.toString() ?? 0));
  });

  const vatRows = Array.from(vatBreakdown.entries())
    .map(
      ([percent, vat]) => `<div class="inv-total__row">
        <span>${escapeHtml(t.vatOn)} ${escapeHtml(percent)}%</span>
        <span>${formatMoneyDecimal(vat)}</span>
      </div>`
    )
    .join("");

  const paymentRows: string[] = [];
  const addPaymentRow = (label: string, value: unknown) => {
    if (hasText(value)) {
      paymentRows.push(
        `<div class="inv-pay__row"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value).trim())}</div>`
      );
    }
  };
  addPaymentRow(t.accountHolder, shopSettings?.accountHolder);
  addPaymentRow(t.iban, shopSettings?.iban);
  addPaymentRow(t.bic, shopSettings?.bicSwift);
  addPaymentRow(t.bank, shopSettings?.bankName);
  addPaymentRow(t.paymentDate, invoice.paymentDate ? formatDateEuropean(invoice.paymentDate) : null);
  addPaymentRow(t.paymentReference, invoice.paymentReference);

  const paymentBlock =
    paymentRows.length > 0
      ? `<div class="inv-pay__title">${escapeHtml(t.paymentTitle)}</div>${paymentRows.join("")}`
      : "";

  // Signature block only renders when explicitly provided for this invoice.
  const signatureBlock = hasText(invoice.signatureDataUrl)
    ? `<section class="inv-signature avoid-break">
        <div class="inv-signature__box">
          <img class="inv-signature__img" src="${invoice.signatureDataUrl}" alt="Signature" />
          <div class="inv-signature__line">${escapeHtml(
            hasText(invoice.signatureName) ? String(invoice.signatureName).trim() : t.signatureRole
          )}</div>
        </div>
      </section>`
    : "";

  const footerItems: string[] = [];
  if (hasText(addressText)) {
    footerItems.push(`<div class="inv-footer__item">
      <span class="inv-footer__icon">${FOOTER_ICONS.location}</span>
      <span class="inv-footer__text">${escapeHtml(addressText)}</span>
    </div>`);
  }
  if (hasText(shopSettings?.phone)) {
    footerItems.push(`<div class="inv-footer__item">
      <span class="inv-footer__icon">${FOOTER_ICONS.phone}</span>
      <span class="inv-footer__text">${escapeHtml(String(shopSettings?.phone).trim())}</span>
    </div>`);
  }
  if (hasText(shopSettings?.email)) {
    footerItems.push(`<div class="inv-footer__item">
      <span class="inv-footer__icon">${FOOTER_ICONS.email}</span>
      <span class="inv-footer__text">${escapeHtml(String(shopSettings?.email).trim())}</span>
    </div>`);
  }

  const footerHtml =
    footerItems.length > 0
      ? `<footer class="inv-footer avoid-break">${footerItems.join(
          '<span class="inv-footer__sep"></span>'
        )}</footer>`
      : "";

  const notesBlock = hasText(invoice.notes)
    ? `<section class="inv-notes avoid-break">
        <div class="inv-notes__title">${escapeHtml(t.notes)}</div>
        <div>${escapeHtml(String(invoice.notes).trim())}</div>
      </section>`
    : "";

  const titleText = t.titleBlock;

  const body = `
    <div class="inv">
      <header class="inv-header">
        <div class="inv-header__brand">
          ${logoHtml}
          ${companyNameHtml}
        </div>
        <div class="inv-title">${escapeHtml(titleText)}</div>
      </header>

      <section class="inv-info">
        <div class="inv-info__col">
          ${companyInfoRows.join("")}
        </div>
        <div class="inv-info__col inv-info__col--right">
          ${invoiceInfoRows}
        </div>
      </section>

      <section class="inv-table-wrap avoid-break">
        <table class="inv-table">
          <thead>
            <tr>
              <th class="pos">${escapeHtml(t.position)}</th>
              <th>${escapeHtml(t.serviceDescription)}</th>
              <th class="num col-qty">${escapeHtml(t.quantity)}</th>
              <th class="num col-unit">${escapeHtml(t.unitPrice)}</th>
              <th class="num col-amount">${escapeHtml(t.gross)}</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || `<tr><td colspan="5">-</td></tr>`}
            ${spacerRow}
          </tbody>
        </table>
      </section>

      ${notesBlock}

      <section class="inv-summary avoid-break">
        <div class="inv-summary__left">
          ${paymentBlock}
        </div>
        <div class="inv-summary__right">
          <div class="inv-total__row">
            <span>${escapeHtml(t.netAmount)}</span>
            <span>${formatMoneyDecimal(invoice.calculatedNetAmount)}</span>
          </div>
          ${vatRows}
          <div class="inv-total__row inv-total__row--grand">
            <span>${escapeHtml(t.total)}</span>
            <span>${formatMoneyDecimal(invoice.calculatedGrossTotal)}</span>
          </div>
        </div>
      </section>

      ${signatureBlock}

      ${footerHtml}
    </div>
  `;

  const pageTitle =
    language === "en" ? `Invoice ${invoice.invoiceNumber}` : `Rechnung ${invoice.invoiceNumber}`;

  return wrapHtmlDocument(pageTitle, `${getInvoiceStyles()}\n${getPdfStyles()}`, body, language);
};

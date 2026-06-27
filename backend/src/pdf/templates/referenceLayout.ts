import type { PdfShopSettings } from "../types.js";
import {
  displayValue,
  escapeHtml,
  formatDateEuropean,
  getStructuredAddressLines,
  hasText,
  wrapHtmlDocument
} from "../utils.js";
import {
  getInvoicePdfLabels,
  resolveInvoicePdfLanguage,
  type InvoicePdfLanguage
} from "../i18n/invoicePdfI18n.js";

export type ReferenceRow = { label: string; value: unknown };
export type ReferenceItem = {
  position: number;
  description: string;
  detail?: string;
  quantity?: string;
  amount?: string;
};

const INK = "#111111";

/**
 * Self-contained styles for the shared document layout. Kept independent from
 * the global pdfStyles master sheet so the fixed sample structure can never be
 * overridden by other layouts.
 */
const getReferenceStyles = () => `
  @page { size: A4; margin: 0; }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body { margin: 0; padding: 0; }

  .pdf-body {
    font-family: Helvetica, Arial, "Segoe UI", sans-serif;
    font-size: 9pt;
    line-height: 1.45;
    color: ${INK};
    background: #ffffff;
  }

  .pdf-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 14mm 15mm 12mm;
    display: flex;
    flex-direction: column;
  }

  .ref-doc {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  .avoid-break { page-break-inside: avoid; break-inside: avoid; }

  /* ---- Header: title left, logo + company + legal right ---- */
  .ref-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .ref-title {
    font-size: 26pt;
    font-weight: 800;
    letter-spacing: 0.01em;
    margin: 0;
    padding-top: 2px;
  }

  .ref-header__right {
    flex: 0 0 auto;
    max-width: 58%;
    text-align: right;
  }

  .ref-logo {
    display: inline-block;
    max-width: 280px;
    max-height: 96px;
    width: auto;
    height: auto;
    object-fit: contain;
    margin-bottom: 10px;
  }

  .ref-company {
    font-size: 8.5pt;
    color: #1f2937;
    line-height: 1.4;
  }

  .ref-company__name { font-weight: 800; color: ${INK}; }

  .ref-legal-head {
    margin-top: 6px;
    font-size: 8pt;
    font-weight: 700;
    color: ${INK};
    line-height: 1.45;
  }

  .ref-divider {
    border: 0;
    border-top: 1px solid ${INK};
    margin: 10px 0 12px;
  }

  /* ---- Metadata ---- */
  .ref-meta { margin-bottom: 14px; }

  .ref-meta__row {
    font-size: 9pt;
    margin: 2px 0;
  }

  .ref-meta__row strong { font-weight: 700; }

  /* ---- Service heading + detail rows ---- */
  .ref-service { margin-bottom: 12px; }

  .ref-service__title {
    font-size: 11pt;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .ref-kv {
    font-size: 8.5pt;
    margin: 2px 0;
    color: #374151;
  }

  .ref-kv strong { color: ${INK}; font-weight: 700; }

  /* ---- Items table ---- */
  .ref-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin-bottom: 4px;
  }

  .ref-table thead th {
    text-align: left;
    font-weight: 800;
    color: ${INK};
    padding: 6px 8px;
    border-bottom: 1.5px solid ${INK};
  }

  .ref-table thead th.num { text-align: right; }

  .ref-table tbody td {
    padding: 9px 8px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }

  .ref-table tbody td.num { text-align: right; white-space: nowrap; }
  .ref-table td.pos { width: 64px; text-align: left; }
  .ref-table .col-qty { width: 80px; }
  .ref-table .col-amount { width: 110px; }

  .ref-item__name { font-weight: 700; color: ${INK}; }
  .ref-item__detail {
    margin-top: 2px;
    font-size: 8pt;
    color: #6b7280;
  }

  /* ---- Totals (right aligned) ---- */
  .ref-totals {
    display: flex;
    justify-content: flex-end;
    margin: 14px 0 6px;
  }

  .ref-totals__box { width: 52%; max-width: 52%; }

  .ref-total__row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 9pt;
    padding: 4px 0;
  }

  .ref-total__row span:last-child { font-weight: 600; white-space: nowrap; }

  .ref-total__divider {
    border: 0;
    border-top: 1px solid ${INK};
    margin: 6px 0;
  }

  .ref-grand {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 11pt;
    font-weight: 800;
    padding-top: 2px;
  }

  /* ---- Payment (invoice only, optional) ---- */
  .ref-payment { margin: 12px 0; }

  .ref-section__title {
    font-size: 9.5pt;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .ref-payment__row { font-size: 8.5pt; margin: 2px 0; color: #374151; }
  .ref-payment__row strong { color: ${INK}; font-weight: 700; }

  /* ---- Notes ---- */
  .ref-notes { margin: 14px 0; }
  .ref-notes__body { font-size: 8.5pt; color: #374151; white-space: pre-line; }

  /* ---- Signatures ---- */
  .ref-signatures {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 26px;
  }

  .ref-signatures > div {
    flex: 1 1 0;
    border-top: 1px solid ${INK};
    padding-top: 4px;
    font-size: 8pt;
    color: #374151;
  }

  /* ---- Photos / attachments grid (contract) ---- */
  .ref-photos { margin: 16px 0; }

  .ref-photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ref-photo {
    flex: 0 0 calc(33.333% - 7px);
    max-width: calc(33.333% - 7px);
    border: 1px solid #d1d5db;
    border-radius: 4px;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .ref-photo__img {
    display: block;
    width: 100%;
    height: 150px;
    object-fit: contain;
    background: #f8fafc;
  }

  .ref-photo__caption {
    font-size: 7.5pt;
    color: #374151;
    text-align: center;
    padding: 3px 4px;
    border-top: 1px solid #e5e7eb;
  }

  /* ---- Signature images (contract) ---- */
  .ref-sign-grid {
    display: flex;
    gap: 32px;
    margin-top: 8px;
  }

  .ref-sign-box { flex: 1 1 0; min-width: 0; }

  .ref-sign-box__img {
    display: block;
    width: 100%;
    height: 90px;
    object-fit: contain;
    margin-bottom: 4px;
  }

  .ref-sign-box__line {
    border-top: 1px solid ${INK};
    padding-top: 4px;
    font-size: 8pt;
    color: #374151;
  }

  .ref-sign-box__meta { font-size: 7.5pt; color: #6b7280; margin-top: 2px; }

  /* ---- Footer (pinned bottom, two columns) ---- */
  .ref-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding-top: 8px;
    border-top: 1px solid ${INK};
    font-size: 7.5pt;
    color: #374151;
    line-height: 1.5;
  }

  .ref-footer__col { flex: 1 1 0; min-width: 0; }
  .ref-footer__col--right { text-align: right; }
  .ref-footer strong { color: ${INK}; font-weight: 700; }
`;

/** Company block (logo + name/address/email/UID) for the header right side. */
const buildHeaderCompany = (
  shop: PdfShopSettings | undefined,
  t: ReturnType<typeof getInvoicePdfLabels>
) => {
  // Only render the logo the shop actually uploaded — never a built-in sample.
  const logoSrc = hasText(shop?.logoDataUrl) ? String(shop?.logoDataUrl) : "";
  const logoHtml = logoSrc ? `<img class="ref-logo" src="${logoSrc}" alt="Logo" />` : "";

  const lines: string[] = [];
  if (hasText(shop?.name)) {
    lines.push(`<div class="ref-company__name">${escapeHtml(String(shop?.name).trim())}</div>`);
  }
  getStructuredAddressLines(shop).forEach((line) => lines.push(`<div>${escapeHtml(line)}</div>`));
  if (hasText(shop?.email)) {
    lines.push(`<div>${escapeHtml(t.emailLabel)}: ${escapeHtml(String(shop?.email).trim())}</div>`);
  }
  if (hasText(shop?.phone)) {
    lines.push(`<div>${escapeHtml(t.phone)}: ${escapeHtml(String(shop?.phone).trim())}</div>`);
  }
  if (hasText(shop?.vatNumber)) {
    lines.push(`<div>${escapeHtml(t.uid)}: ${escapeHtml(String(shop?.vatNumber).trim())}</div>`);
  }

  // Bold legal identifiers grouped below the company block.
  const glnGisa = [
    hasText(shop?.gln) ? `${escapeHtml(t.gln)}: ${escapeHtml(String(shop?.gln).trim())}` : "",
    hasText(shop?.gisaNumber)
      ? `${escapeHtml(t.gisaNumber)}: ${escapeHtml(String(shop?.gisaNumber).trim())}`
      : ""
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;&nbsp;");

  const legalLines = [
    hasText(shop?.companyRegistrationNumber)
      ? `${escapeHtml(t.companyRegistration)}: ${escapeHtml(String(shop?.companyRegistrationNumber).trim())}`
      : "",
    hasText(shop?.companyRegisterCourt)
      ? `${escapeHtml(t.companyRegisterCourt)}: ${escapeHtml(String(shop?.companyRegisterCourt).trim())}`
      : "",
    glnGisa,
    hasText(shop?.taxNumber)
      ? `${escapeHtml(t.taxNumber)}: ${escapeHtml(String(shop?.taxNumber).trim())}`
      : ""
  ].filter(Boolean);

  const legalHtml =
    legalLines.length > 0
      ? `<div class="ref-legal-head">${legalLines.map((line) => `<div>${line}</div>`).join("")}</div>`
      : "";

  return `${logoHtml}<div class="ref-company">${lines.join("")}</div>${legalHtml}`;
};

/** Two-column legal footer with graceful skipping of empty fields. */
const buildFooter = (
  shop: PdfShopSettings | undefined,
  t: ReturnType<typeof getInvoicePdfLabels>
) => {
  const leftLines: string[] = [];
  if (hasText(shop?.name)) {
    leftLines.push(`<strong>${escapeHtml(String(shop?.name).trim())}</strong>`);
  }
  getStructuredAddressLines(shop).forEach((line) => leftLines.push(escapeHtml(line)));
  if (hasText(shop?.email)) {
    leftLines.push(`${escapeHtml(t.emailLabel)}: ${escapeHtml(String(shop?.email).trim())}`);
  }

  const regUidLine = [
    hasText(shop?.companyRegistrationNumber)
      ? `${escapeHtml(t.companyRegistration)}: ${escapeHtml(String(shop?.companyRegistrationNumber).trim())}`
      : "",
    hasText(shop?.vatNumber) ? `${escapeHtml(t.uid)}: ${escapeHtml(String(shop?.vatNumber).trim())}` : ""
  ]
    .filter(Boolean)
    .join(", ");

  const glnGisaLine = [
    hasText(shop?.gln) ? `${escapeHtml(t.gln)}: ${escapeHtml(String(shop?.gln).trim())}` : "",
    hasText(shop?.gisaNumber)
      ? `${escapeHtml(t.gisaNumber)}: ${escapeHtml(String(shop?.gisaNumber).trim())}`
      : ""
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;");

  const rightLines = [
    regUidLine,
    hasText(shop?.companyRegisterCourt)
      ? `${escapeHtml(t.companyRegisterCourt)}: ${escapeHtml(String(shop?.companyRegisterCourt).trim())}`
      : "",
    glnGisaLine,
    hasText(shop?.taxNumber)
      ? `${escapeHtml(t.taxNumber)}: ${escapeHtml(String(shop?.taxNumber).trim())}`
      : ""
  ].filter(Boolean);

  if (leftLines.length === 0 && rightLines.length === 0) return "";

  return `<footer class="ref-footer avoid-break">
    <div class="ref-footer__col">${leftLines.join("<br/>")}</div>
    <div class="ref-footer__col ref-footer__col--right">${rightLines.join("<br/>")}</div>
  </footer>`;
};

const metaRow = (label: string, value: unknown) =>
  `<div class="ref-meta__row"><strong>${escapeHtml(label)}</strong> ${escapeHtml(displayValue(value))}</div>`;

const kvRow = (label: string, value: unknown) =>
  `<div class="ref-kv"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(displayValue(value))}</div>`;

export const itemsHtml = (items: ReferenceItem[], t: ReturnType<typeof getInvoicePdfLabels>) =>
  `<table class="ref-table">
    <thead>
      <tr>
        <th class="pos">${escapeHtml(t.position)}</th>
        <th>${escapeHtml(t.description)}</th>
        <th class="num col-qty">${escapeHtml(t.quantity)}</th>
        <th class="num col-amount">${escapeHtml(t.gross)}</th>
      </tr>
    </thead>
    <tbody>
      ${
        items
          .map(
            (item) => `<tr>
        <td class="pos">${item.position}</td>
        <td>
          <div class="ref-item__name">${escapeHtml(item.description)}</div>
          ${item.detail ? `<div class="ref-item__detail">${escapeHtml(item.detail)}</div>` : ""}
        </td>
        <td class="num col-qty">${escapeHtml(item.quantity || "1")}</td>
        <td class="num col-amount">${escapeHtml(item.amount || "-")}</td>
      </tr>`
          )
          .join("") || `<tr><td colspan="4">-</td></tr>`
      }
    </tbody>
  </table>`;

export const renderReferenceDocument = (input: {
  pageTitle: string;
  title: string;
  numberLabel: string;
  number: string;
  date: Date;
  customer: ReferenceRow[];
  details: ReferenceRow[];
  items: ReferenceItem[];
  totals: ReferenceRow[];
  grandLabel: string;
  grandValue: string;
  notesTitle: string;
  notes?: string | null;
  signatureLeft?: string;
  signatureRight?: string;
  shopSettings?: PdfShopSettings;
  language?: string;
  showSignatures?: boolean;
  paymentTitle?: string;
  paymentRows?: ReferenceRow[];
  /** Raw HTML inserted after the notes block (e.g. contract photos + signatures). */
  bodyExtras?: string;
}) => {
  const lang: InvoicePdfLanguage = resolveInvoicePdfLanguage(input.language);
  const t = getInvoicePdfLabels(lang);

  const serviceHeading = hasText(input.details[0]?.value)
    ? String(input.details[0]?.value)
    : input.title;
  const detailRows = input.details
    .slice(1)
    .filter((row) => hasText(row.value))
    .map((row) => kvRow(row.label.replace(/:$/, ""), row.value))
    .join("");

  const customerRows = input.customer
    .filter((row) => hasText(row.value))
    .map((row) => metaRow(row.label, row.value))
    .join("");

  const totalsRows = input.totals
    .filter((row) => hasText(row.value))
    .map(
      (row) =>
        `<div class="ref-total__row"><span>${escapeHtml(row.label)}</span><span>${escapeHtml(
          displayValue(row.value)
        )}</span></div>`
    )
    .join("");

  const paymentRows = (input.paymentRows ?? []).filter((row) => hasText(row.value));
  const paymentBlock =
    paymentRows.length > 0
      ? `<section class="ref-payment avoid-break">
          <div class="ref-section__title">${escapeHtml(input.paymentTitle ?? t.paymentTitle)}</div>
          ${paymentRows
            .map(
              (row) =>
                `<div class="ref-payment__row"><strong>${escapeHtml(
                  row.label.replace(/:$/, "")
                )}:</strong> ${escapeHtml(displayValue(row.value))}</div>`
            )
            .join("")}
        </section>`
      : "";

  const notesBlock = hasText(input.notes)
    ? `<section class="ref-notes avoid-break">
        <div class="ref-section__title">${escapeHtml(input.notesTitle)}</div>
        <div class="ref-notes__body">${escapeHtml(String(input.notes).trim())}</div>
      </section>`
    : "";

  const signaturesBlock =
    input.showSignatures === false
      ? ""
      : `<section class="ref-signatures avoid-break">
          <div>${escapeHtml(input.signatureLeft || "Customer signature")}</div>
          <div>${escapeHtml(input.signatureRight || "Date")}</div>
        </section>`;

  const body = `<div class="ref-doc">
    <header class="ref-header avoid-break">
      <h1 class="ref-title">${escapeHtml(input.title)}</h1>
      <div class="ref-header__right">${buildHeaderCompany(input.shopSettings, t)}</div>
    </header>
    <hr class="ref-divider" />

    <section class="ref-meta avoid-break">
      ${metaRow(input.numberLabel, input.number)}
      ${metaRow(`${t.date}:`, formatDateEuropean(input.date))}
      ${customerRows}
    </section>

    <section class="ref-service avoid-break">
      <h2 class="ref-service__title">${escapeHtml(serviceHeading)}</h2>
      ${detailRows}
    </section>

    ${itemsHtml(input.items, t)}

    <section class="ref-totals avoid-break">
      <div class="ref-totals__box">
        ${totalsRows}
        <hr class="ref-total__divider" />
        <div class="ref-grand"><span>${escapeHtml(input.grandLabel)}</span><span>${escapeHtml(
          input.grandValue
        )}</span></div>
      </div>
    </section>

    ${paymentBlock}
    ${notesBlock}
    ${input.bodyExtras ?? ""}
    ${signaturesBlock}
    ${buildFooter(input.shopSettings, t)}
  </div>`;

  return wrapHtmlDocument(input.pageTitle, getReferenceStyles(), body, lang);
};

import { getPdfStyles } from "../styles/pdfStyles.js";
import type { PdfShopSettings } from "../types.js";
import {
  buildCompanyHeaderHtml,
  buildLegalFooterHtml,
  escapeHtml,
  wrapHtmlDocument,
  formatDateEuropean
} from "../utils.js";

type CustomerForExport = {
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

export const renderCustomerListHtml = (
  customers: CustomerForExport[],
  shopSettings?: PdfShopSettings
) => {
  const exportDate = formatDateEuropean(new Date());

  const rows = customers
    .map(
      (c, i) => `<tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="cell-id">${escapeHtml(c.customerNumber ?? "-")}</td>
        <td class="cell-name">
          <div class="name-primary">${escapeHtml(c.name || "-")}</div>
          ${c.company ? `<div class="name-secondary">${escapeHtml(c.company)}</div>` : ""}
        </td>
        <td class="cell-address">${escapeHtml(
          [c.street, [c.zipCode, c.city].filter(Boolean).join(" ")]
            .filter(Boolean)
            .join(", ") || "-"
        )}</td>
        <td class="cell-phone">${escapeHtml(c.phone ?? "-")}</td>
        <td class="cell-email">${escapeHtml(c.email ?? "-")}</td>
        <td class="cell-newsletter cell-center">${c.newsletter ? "✓" : "–"}</td>
        <td class="cell-date">${formatDateEuropean(new Date(c.createdAt))}</td>
      </tr>`
    )
    .join("");

  const body = `
    <div>
      ${buildCompanyHeaderHtml(shopSettings, {
        compactLogo: true,
        hideMeta: true
      })}

      <div class="export-header">
        <h1 class="export-title">Kundenliste</h1>
        <div class="export-meta">
          <span class="export-meta-count">${customers.length} Kunden</span>
          <span class="export-meta-date">Stand: ${exportDate}</span>
        </div>
      </div>

      <table class="customer-table">
        <thead>
          <tr>
            <th class="cell-id">Kunden-Nr.</th>
            <th class="cell-name">Name / Firma</th>
            <th class="cell-address">Adresse</th>
            <th class="cell-phone">Telefon</th>
            <th class="cell-email">E-Mail</th>
            <th class="cell-newsletter cell-center">NL</th>
            <th class="cell-date">Erstellt</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="7" class="empty-row">Keine Kunden vorhanden.</td></tr>`}
        </tbody>
      </table>

      ${buildLegalFooterHtml(shopSettings, { poweredBySclera: true })}
    </div>
  `;

  const styles = getPdfStyles() + `
    .export-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin: 6px 0 10px;
    }
    .export-title {
      font-size: 14pt;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .export-meta {
      display: flex;
      gap: 14px;
      font-size: 7.5pt;
      color: #64748b;
    }
    .export-meta-count {
      font-weight: 600;
    }
    .customer-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      margin-bottom: 16px;
    }
    .customer-table thead tr {
      background: #1e293b;
    }
    .customer-table thead th {
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 5px;
      font-size: 6.5pt;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .customer-table tbody td {
      padding: 5px 5px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
      line-height: 1.3;
    }
    .row-even { background: #ffffff; }
    .row-odd  { background: #f8fafc; }

    .cell-id      { width: 62px; white-space: nowrap; font-weight: 600; color: #475569; }
    .cell-name    { min-width: 90px; }
    .cell-address { min-width: 100px; }
    .cell-phone   { width: 80px; white-space: nowrap; }
    .cell-email   { min-width: 100px; word-break: break-all; }
    .cell-newsletter { width: 26px; font-size: 8pt; }
    .cell-date    { width: 58px; white-space: nowrap; font-size: 6.5pt; color: #64748b; }
    .cell-center  { text-align: center; }

    .name-primary  { font-weight: 600; }
    .name-secondary { font-size: 6.5pt; color: #64748b; margin-top: 1px; }

    .empty-row {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 9pt;
    }
  `;

  return wrapHtmlDocument("Kundenliste", styles, body);
};

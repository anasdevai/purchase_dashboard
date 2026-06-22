import type { PdfShopSettings } from "../types.js";
import { buildCompanyHeaderHtml, displayValue, escapeHtml, formatDateEuropean, wrapHtmlDocument } from "../utils.js";
import { getPdfStyles } from "../styles/pdfStyles.js";

export type ReferenceRow = { label: string; value: unknown };
export type ReferenceItem = { position: number; description: string; detail?: string; quantity?: string; amount?: string };

export const rowsHtml = (rows: ReferenceRow[]) => `<div class="reference-rows">${rows.map(({label,value}) => `<div class="reference-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(displayValue(value))}</span></div>`).join("")}</div>`;

export const itemsHtml = (items: ReferenceItem[]) => `<table class="reference-table"><thead><tr><th>Position</th><th>Description</th><th class="num">Quantity</th><th class="num">Gross</th></tr></thead><tbody>${items.map(item => `<tr><td>${item.position}</td><td><strong>${escapeHtml(item.description)}</strong>${item.detail ? `<div>${escapeHtml(item.detail)}</div>` : ""}</td><td class="num">${escapeHtml(item.quantity || "1")}</td><td class="num">${escapeHtml(item.amount || "-")}</td></tr>`).join("") || `<tr><td colspan="4">-</td></tr>`}</tbody></table>`;

export const renderReferenceDocument = (input: {
  pageTitle: string; title: string; numberLabel: string; number: string; date: Date;
  customer: ReferenceRow[]; details: ReferenceRow[]; items: ReferenceItem[];
  totals: ReferenceRow[]; grandLabel: string; grandValue: string;
  notesTitle: string; notes?: string | null; signatureLeft?: string; signatureRight?: string;
  shopSettings?: PdfShopSettings; language?: string; showSignatures?: boolean;
}) => wrapHtmlDocument(input.pageTitle, getPdfStyles(), `<div class="reference-document">
  ${buildCompanyHeaderHtml(input.shopSettings, { includeRegistration: true })}
  <h1 class="doc-title">${escapeHtml(input.title)}</h1>
  <section class="reference-meta avoid-break">${rowsHtml([{label:input.numberLabel,value:input.number},{label:"Date:",value:formatDateEuropean(input.date)},...input.customer])}</section>
  <section class="reference-service avoid-break"><h2>${escapeHtml(input.details[0]?.value || input.title)}</h2>${rowsHtml(input.details.slice(1))}</section>
  ${itemsHtml(input.items)}
  <section class="reference-totals avoid-break"><div>${rowsHtml(input.totals)}</div><div class="reference-grand"><strong>${escapeHtml(input.grandLabel)}</strong><strong>${escapeHtml(input.grandValue)}</strong></div></section>
  <section class="reference-notes avoid-break"><h2>${escapeHtml(input.notesTitle)}</h2><div>${escapeHtml(displayValue(input.notes))}</div></section>
  ${input.showSignatures === false ? "" : `<section class="reference-signatures"><div><span>${escapeHtml(input.signatureLeft || "Customer signature")}</span></div><div><span>${escapeHtml(input.signatureRight || "Date")}</span></div></section>`}
  <footer class="reference-footer"><div>${input.shopSettings?.name ? `<strong>${escapeHtml(input.shopSettings.name)}</strong><br/>` : ""}${input.shopSettings?.address ? `${escapeHtml(input.shopSettings.address)}<br/>` : ""}${input.shopSettings?.email ? escapeHtml(input.shopSettings.email) : ""}</div><div>${input.shopSettings?.companyRegistrationNumber ? `<strong>Company registration:</strong> ${escapeHtml(input.shopSettings.companyRegistrationNumber)}<br/>` : ""}${input.shopSettings?.vatNumber ? `<strong>VAT:</strong> ${escapeHtml(input.shopSettings.vatNumber)}` : ""}</div></footer>
</div>`, input.language);

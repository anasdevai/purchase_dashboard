import fs from "node:fs";
import path from "node:path";
import { projectRoot, toAbsolutePath } from "../utils/paths.js";
import type { DocumentMeta, MoneyLike, PdfShopSettings } from "./types.js";

export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

export const displayValue = (input: unknown) =>
  input === null || input === undefined || input === "" ? "-" : String(input);

export const hasText = (value: unknown) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const formatEuropeanNumber = (amount: number, decimals: number) =>
  amount.toFixed(decimals).replace(".", ",");

export const formatMoneyDecimal = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "€ 0,00";
  return `€ ${formatEuropeanNumber(Number(input.toString()), 2)}`;
};

export const formatMoneyWhole = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "€ 0";
  return `€ ${Math.round(Number(input.toString()))}`;
};

export const formatAmountDecimal = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "0,00";
  return Number(input.toString()).toFixed(2).replace(".", ",");
};

export const formatDateShort = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

export const formatDateEuropean = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const numericValue = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "0";
  return Number(input.toString()).toFixed(2).replace(/\.00$/, "");
};

const imageMimeTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const absoluteFileToDataUrl = (absolutePath: string): string | null => {
  if (!fs.existsSync(absolutePath)) return null;

  const extension = path.extname(absolutePath).toLowerCase();
  const mime = imageMimeTypes[extension];
  if (!mime) return null;

  const buffer = fs.readFileSync(absolutePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

export const filePathToDataUrl = (storedPath: string | null | undefined): string | null => {
  if (!storedPath) return null;
  return absoluteFileToDataUrl(toAbsolutePath(storedPath));
};

let cachedScleraLogoDataUrl: string | null | undefined;

export const getScleraLogoDataUrl = (): string | null => {
  if (cachedScleraLogoDataUrl !== undefined) return cachedScleraLogoDataUrl;

  const candidates = [
    path.join(projectRoot, "assets", "sclera-logo.png"),
    path.join(projectRoot, "..", "frontend", "public", "assets", "sclera-logo.png"),
    path.join(projectRoot, "..", "frontend", "public", "scelra-logo.png")
  ];

  for (const candidate of candidates) {
    const dataUrl = absoluteFileToDataUrl(path.resolve(candidate));
    if (dataUrl) {
      cachedScleraLogoDataUrl = dataUrl;
      return dataUrl;
    }
  }

  cachedScleraLogoDataUrl = null;
  return null;
};

export const getStructuredAddressLines = (shopSettings?: PdfShopSettings) => {
  if (!shopSettings) return [] as string[];

  const lines: string[] = [];
  if (shopSettings.street?.trim()) lines.push(shopSettings.street.trim());

  const zipCity = [shopSettings.zipCode?.trim(), shopSettings.city?.trim()].filter(Boolean).join(" ");
  const country = shopSettings.country?.trim();
  if (zipCity && country) lines.push(`${zipCity} – ${country}`);
  else if (zipCity) lines.push(zipCity);
  else if (country) lines.push(country);

  if (lines.length === 0 && shopSettings.address?.trim()) {
    return shopSettings.address
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return lines;
};

type HeaderOptions = {
  includeOwner?: boolean;
  includeRegistration?: boolean;
  meta?: DocumentMeta;
  compactLogo?: boolean;
  largeLogo?: boolean;
  contractLogo?: boolean;
  hideMeta?: boolean;
};

export const buildCompanyHeaderHtml = (
  shopSettings: PdfShopSettings | undefined,
  options?: HeaderOptions
) => {
  const logoSrc = shopSettings?.logoDataUrl ?? "";
  const logoClass = options?.contractLogo
    ? "logo logo--contract"
    : options?.largeLogo
      ? "logo logo--large"
      : options?.compactLogo
        ? "logo logo--compact"
        : "logo";
  const headerClass = options?.contractLogo ? "doc-header doc-header--contract" : "doc-header";
  const addressLines = getStructuredAddressLines(shopSettings);

  const companyLines: string[] = [];
  if (shopSettings?.name?.trim()) companyLines.push(`<div class="company-name">${escapeHtml(shopSettings.name.trim())}</div>`);
  if (options?.includeOwner && shopSettings?.ownerName?.trim()) {
    companyLines.push(`<div>${escapeHtml(shopSettings.ownerName.trim())}</div>`);
  }
  addressLines.forEach((line) => companyLines.push(`<div>${escapeHtml(line)}</div>`));
  if (shopSettings?.email?.trim()) companyLines.push(`<div>${escapeHtml(shopSettings.email.trim())}</div>`);
  if (shopSettings?.phone?.trim()) companyLines.push(`<div>Tel.: ${escapeHtml(shopSettings.phone.trim())}</div>`);
  if (shopSettings?.website?.trim()) companyLines.push(`<div>${escapeHtml(shopSettings.website.trim())}</div>`);
  if (shopSettings?.vatNumber?.trim()) {
    companyLines.push(`<div>UID: ${escapeHtml(shopSettings.vatNumber.trim())}</div>`);
  }
  if (options?.includeRegistration) {
    if (shopSettings?.companyRegistrationNumber?.trim()) {
      companyLines.push(
        `<div>Firmenbuchnummer: ${escapeHtml(shopSettings.companyRegistrationNumber.trim())}</div>`
      );
    }
    if (shopSettings?.taxNumber?.trim()) {
      companyLines.push(`<div>Steuernummer: ${escapeHtml(shopSettings.taxNumber.trim())}</div>`);
    }
  }

  const meta = options?.hideMeta ? undefined : options?.meta;
  const metaHtml = meta
    ? `<div class="doc-meta-block">
        <div class="meta-label">${escapeHtml(meta.numberLabel)}</div>
        <div class="meta-value">${escapeHtml(meta.numberValue)}</div>
        ${
          meta.date
            ? `<div class="meta-label">${escapeHtml(meta.dateLabel ?? "Datum")}</div>
               <div class="meta-value">${
                 meta.europeanDate ? formatDateEuropean(meta.date) : formatDateShort(meta.date)
               }</div>`
            : ""
        }
      </div>`
    : "";

  const placeholderClass = options?.contractLogo
    ? " logo--contract"
    : options?.largeLogo
      ? " logo--large"
      : "";

  const logoHtml = logoSrc
    ? `<img class="${logoClass}" src="${logoSrc}" alt="Logo" />`
    : `<div class="${logoClass} logo--placeholder${placeholderClass}"></div>`;

  return `<header class="${headerClass} avoid-break">
    <div class="doc-header__left">${logoHtml}</div>
    <div class="doc-header__right">
      ${metaHtml}
      <div class="company-details">${companyLines.join("")}</div>
    </div>
  </header>
  <hr class="divider" />`;
};

type LegalFooterLabels = {
  uid: string;
  companyRegistration: string;
  taxNumber: string;
};

export const buildLegalFooterHtml = (
  shopSettings: PdfShopSettings | undefined,
  options?: { poweredBySclera?: boolean; labels?: LegalFooterLabels; alignLeft?: boolean }
) => {
  const parts: string[] = [];
  if (shopSettings?.vatNumber?.trim()) {
    parts.push(`${options?.labels?.uid ?? "UID"}: ${escapeHtml(shopSettings.vatNumber.trim())}`);
  }
  if (shopSettings?.companyRegistrationNumber?.trim()) {
    parts.push(
      `${options?.labels?.companyRegistration ?? "Firmenbuchnummer"}: ${escapeHtml(shopSettings.companyRegistrationNumber.trim())}`
    );
  }
  if (shopSettings?.taxNumber?.trim()) {
    parts.push(
      `${options?.labels?.taxNumber ?? "Steuernummer"}: ${escapeHtml(shopSettings.taxNumber.trim())}`
    );
  }

  if (parts.length === 0 && !options?.poweredBySclera) return "";

  const alignClass = options?.alignLeft ? " legal-footer--left" : "";

  const scleraLogo = options?.poweredBySclera ? getScleraLogoDataUrl() : null;
  const poweredByHtml = options?.poweredBySclera
    ? `<div class="legal-footer__powered">
        <span class="legal-footer__powered-text">Powered by</span>
        ${
          scleraLogo
            ? `<img class="sclera-brand-logo" src="${scleraLogo}" alt="Sclera" />`
            : `<span class="legal-footer__powered-text">Sclera</span>`
        }
      </div>`
    : "";

  return `<footer class="legal-footer avoid-break${alignClass}">
    ${parts.length > 0 ? `<div class="legal-footer__text">${parts.join("<br />")}</div>` : ""}
    ${poweredByHtml}
  </footer>`;
};

export const buildPaymentSectionHtml = (
  shopSettings: PdfShopSettings | undefined,
  labels?: {
    paymentTitle: string;
    accountHolder: string;
    iban: string;
    bic: string;
    bank: string;
  }
) => {
  const rows: Array<[string, string | undefined]> = [
    [labels?.accountHolder ?? "Kontoinhaber", shopSettings?.accountHolder],
    [labels?.iban ?? "IBAN", shopSettings?.iban],
    [labels?.bic ?? "BIC / SWIFT", shopSettings?.bicSwift],
    [labels?.bank ?? "Bank", shopSettings?.bankName]
  ];

  const visibleRows = rows.filter(([, value]) => hasText(value));
  if (visibleRows.length === 0) return "";

  return `<section class="payment-section avoid-break">
    <h2 class="section-title">${escapeHtml(labels?.paymentTitle ?? "Zahlungsinformationen")}</h2>
    <table class="kv-table">
      <tbody>
        ${visibleRows
          .map(
            ([label, value]) => `<tr>
              <th>${escapeHtml(label)}</th>
              <td>${escapeHtml(String(value).trim())}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </section>`;
};

export const buildKvGridHtml = (
  rows: Array<{ label: string; value: unknown; half?: boolean }>
) => {
  const items = rows
    .map(
      (row) => `<div class="kv-item${row.half ? " kv-item--half" : ""}">
        <span class="kv-label">${escapeHtml(row.label)}</span>
        <span class="kv-value">${escapeHtml(displayValue(row.value))}</span>
      </div>`
    )
    .join("");

  return `<div class="kv-grid">${items}</div>`;
};

export const wrapHtmlDocument = (title: string, styles: string, body: string, lang = "de") =>
  `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body class="pdf-body">
  <main class="pdf-page">${body}</main>
</body>
</html>`;

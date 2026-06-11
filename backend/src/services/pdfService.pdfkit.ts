import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import {
  ensureDirectory,
  getContractStorageDir,
  getInvoiceStorageDir,
  getRepairOrderStorageDir,
  toAbsolutePath,
  toRelativeStoragePath
} from "../utils/paths.js";

type ContractWithFiles = {
  userId: string;
  contractNumber: string;
  status: string;
  updatedAt: Date;
  customerName: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerDateOfBirth: Date | null;
  idDocumentNumber: string | null;
  deviceType: string | null;
  brand: string | null;
  model: string | null;
  imei: string | null;
  serialNumber: string | null;
  storage: string | null;
  color: string | null;
  condition: string | null;
  accessories: string | null;
  batteryHealth: string | null;
  damageNotes: string | null;
  purchasePrice: { toString: () => string } | null;
  paymentMethod: string | null;
  ownershipConfirmed: boolean;
  notStolenConfirmed: boolean;
  icloudRemoved: boolean;
  googleLockRemoved: boolean;
  otherLockRemoved: boolean;
  factoryResetConfirmed: boolean;
  signaturePath: string | null;
  shopkeeperSignaturePath: string | null;
  files: Array<{ fileType: string; filePath: string }>;
};

const page = {
  margin: 34,
  width: 595.28,
  height: 841.89
};

const LAYOUT = { padding: 20, innerPad: 20, pageBottom: 786, sectionGap: 8 };

const contentBox = () => {
  const left = page.margin;
  const right = page.width - page.margin;
  const width = right - left;
  return {
    left,
    right,
    width,
    innerX: left + LAYOUT.innerPad,
    sectionWidth: width - LAYOUT.innerPad * 2,
    halfWidth: Math.floor((width - LAYOUT.innerPad * 2) / 2) - 8
  };
};

const ensureSpace = (doc: PDFKit.PDFDocument, y: number, neededHeight: number) => {
  if (y + neededHeight <= LAYOUT.pageBottom) return y;
  doc.addPage();
  return page.margin + 36;
};

const colors = {
  blue: "#2563eb",
  ink: "#111827",
  muted: "#64748b",
  border: "#dbe3ef",
  panel: "#f8fafc",
  green: "#16a34a"
};

const value = (input: unknown) =>
  input === null || input === undefined || input === "" ? "-" : String(input);

type MoneyLike = { toString: () => string } | number | null | undefined;

// Standard PDF fonts (Helvetica) use WinAnsiEncoding where 0x80 is the euro sign.
const PDF_EURO_SIGN = "\x80";

const formatPdfMoney = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return `${PDF_EURO_SIGN}0.00`;
  return `${PDF_EURO_SIGN}${Number(input.toString()).toFixed(2)}`;
};

const formatPdfWholeMoney = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return `${PDF_EURO_SIGN}0`;
  return `${PDF_EURO_SIGN}${Math.round(Number(input.toString()))}`;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

const formatPdfDateEuropean = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const hasText = (value: unknown) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const sectionTitle = (doc: PDFKit.PDFDocument, title: string, x: number, y: number, width: number) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(colors.ink)
    .text(title, x, y);
  doc
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .moveTo(x, y + 15)
    .lineTo(x + width, y + 15)
    .stroke();
};

const row = (
  doc: PDFKit.PDFDocument,
  label: string,
  rowValue: unknown,
  x: number,
  y: number,
  width: number
) => {
  doc.font("Helvetica-Bold").fontSize(7.2).fillColor(colors.muted).text(label, x, y, { width: 58 });
  doc.font("Helvetica").fontSize(7.4).fillColor(colors.ink).text(value(rowValue), x + 64, y, {
    width: width - 64,
    ellipsis: true
  });
};

const drawHorizontalRule = (doc: PDFKit.PDFDocument, x: number, y: number, width: number) => {
  doc.strokeColor(colors.border).lineWidth(0.8).moveTo(x, y).lineTo(x + width, y).stroke();
};

const optionalTextRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  rowValue: unknown,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number,
  lineHeight = 14
) => {
  if (!hasText(rowValue)) return y;
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text(label, x, y, { width: labelWidth });
  doc.font("Helvetica").fontSize(8.5).fillColor(colors.ink).text(String(rowValue).trim(), x + labelWidth, y, {
    width: valueWidth,
    ellipsis: true
  });
  return y + lineHeight;
};

const addPanel = (doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number) => {
  doc.roundedRect(x, y, width, height, 7).fillAndStroke("#ffffff", colors.border);
};

export type PdfShopSettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  ownerName?: string;
  logoDataUrl?: string;
  website?: string;
  vatNumber?: string;
  companyRegistrationNumber?: string;
  taxNumber?: string;
  accountHolder?: string;
  iban?: string;
  bicSwift?: string;
  bankName?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  country?: string;
};

const getStructuredAddressLines = (shopSettings?: PdfShopSettings) => {
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

type DocumentHeaderMeta = {
  numberLabel: string;
  numberValue: string;
  dateLabel?: string;
  date?: Date;
  europeanDate?: boolean;
};

const renderDocumentHeader = (
  doc: PDFKit.PDFDocument,
  shopSettings: PdfShopSettings | undefined,
  options?: {
    logoWidth?: number;
    logoHeight?: number;
    includeOwner?: boolean;
    includeRegistration?: boolean;
    meta?: DocumentHeaderMeta;
  }
) => {
  const box = contentBox();
  const logoWidth = options?.logoWidth ?? 88;
  const logoHeight = options?.logoHeight ?? 62;
  const logoX = box.innerX;
  const logoY = 38;

  if (shopSettings?.logoDataUrl) {
    addShopLogo(doc, logoX, logoY, shopSettings, logoWidth, logoHeight);
  }

  if (options?.meta) {
    const metaX = box.right - LAYOUT.padding - 128;
    let metaY = 40;
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(colors.muted)
      .text(options.meta.numberLabel, metaX, metaY, { width: 128, align: "right", lineBreak: false });
    metaY += 10;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(colors.ink)
      .text(options.meta.numberValue, metaX, metaY, { width: 128, align: "right", lineBreak: false });
    if (options.meta.date) {
      metaY += 14;
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(colors.muted)
        .text(options.meta.dateLabel ?? "Date", metaX, metaY, { width: 128, align: "right", lineBreak: false });
      metaY += 10;
      const formattedDate = options.meta.europeanDate
        ? formatPdfDateEuropean(options.meta.date)
        : formatDate(options.meta.date);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(colors.ink)
        .text(formattedDate, metaX, metaY, { width: 128, align: "right", lineBreak: false });
    }
  }

  const textWidth = box.width - logoWidth - LAYOUT.padding * 2 - 24;
  const textX = box.right - LAYOUT.padding - textWidth;
  let y = 42;

  const addRightLine = (text: string, lineOpts?: { bold?: boolean; size?: number }) => {
    if (!text.trim()) return;
    const size = lineOpts?.size ?? 7.5;
    doc
      .font(lineOpts?.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(colors.ink)
      .text(text, textX, y, { width: textWidth, align: "right", lineBreak: false });
    y += size + 2;
  };

  addRightLine(shopSettings?.name?.trim() ?? "", { bold: true, size: 11 });
  if (options?.includeOwner && shopSettings?.ownerName?.trim()) {
    addRightLine(shopSettings.ownerName.trim());
  }
  getStructuredAddressLines(shopSettings).forEach((line) => addRightLine(line));
  if (shopSettings?.email?.trim()) addRightLine(shopSettings.email.trim());
  if (shopSettings?.phone?.trim()) addRightLine(`Tel.: ${shopSettings.phone.trim()}`);
  if (shopSettings?.website?.trim()) addRightLine(shopSettings.website.trim());
  if (shopSettings?.vatNumber?.trim()) addRightLine(`UID: ${shopSettings.vatNumber.trim()}`);
  if (options?.includeRegistration) {
    if (shopSettings?.companyRegistrationNumber?.trim()) {
      addRightLine(`Firmenbuchnummer: ${shopSettings.companyRegistrationNumber.trim()}`);
    }
    if (shopSettings?.taxNumber?.trim()) {
      addRightLine(`Steuernummer: ${shopSettings.taxNumber.trim()}`);
    }
  }

  const headerBottom = Math.max(y + 6, logoY + logoHeight + 8);
  drawHorizontalRule(doc, box.innerX, headerBottom, box.sectionWidth);
  return headerBottom + 12;
};

const drawSectionTitle = (
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number
) => {
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text(title, x, y, { lineBreak: false });
  drawHorizontalRule(doc, x, y + 12, width);
  return y + 18;
};

const drawKvRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  rowValue: unknown,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number
) => {
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text(label, x, y, { width: labelWidth, lineBreak: false });
  doc.font("Helvetica").fontSize(7.2).fillColor(colors.ink).text(value(rowValue), x + labelWidth, y, {
    width: valueWidth,
    ellipsis: true,
    lineBreak: false
  });
  return y + 11;
};

const drawOptionalRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  rowValue: unknown,
  x: number,
  y: number,
  labelWidth: number,
  valueWidth: number
) => {
  if (!hasText(rowValue)) return y;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text(label, x, y, { width: labelWidth, lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(String(rowValue).trim(), x + labelWidth, y, {
    width: valueWidth,
    ellipsis: true,
    lineBreak: false
  });
  return y + 13;
};

const drawMultilineRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  rowValue: unknown,
  x: number,
  y: number,
  width: number,
  maxHeight = 24
) => {
  if (!hasText(rowValue)) return y;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text(label, x, y, { width: 52, lineBreak: false });
  doc.font("Helvetica").fontSize(7.2).fillColor(colors.ink).text(value(rowValue), x + 54, y, {
    width: width - 54,
    height: maxHeight,
    ellipsis: true
  });
  return y + maxHeight + 4;
};

const renderInvoicePaymentSection = (
  doc: PDFKit.PDFDocument,
  shopSettings: PdfShopSettings | undefined,
  startY: number,
  innerX: number,
  sectionWidth: number
) => {
  const hasBank =
    hasText(shopSettings?.accountHolder) ||
    hasText(shopSettings?.iban) ||
    hasText(shopSettings?.bicSwift) ||
    hasText(shopSettings?.bankName);

  if (!hasBank) return startY;

  let y = startY;
  drawHorizontalRule(doc, innerX, y, sectionWidth);
  y += 10;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("Zahlungsinformationen", innerX, y, {
    lineBreak: false
  });
  y += 12;

  const bankRows: Array<[string, string | undefined]> = [
    ["Kontoinhaber:", shopSettings?.accountHolder],
    ["IBAN:", shopSettings?.iban],
    ["BIC / SWIFT:", shopSettings?.bicSwift],
    ["Bank:", shopSettings?.bankName]
  ];

  bankRows.forEach(([label, bankValue]) => {
    if (!hasText(bankValue)) return;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor(colors.ink).text(label, innerX, y, { width: 78, lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(7.2)
      .fillColor(colors.ink)
      .text(String(bankValue).trim(), innerX + 78, y, { width: sectionWidth - 78, lineBreak: false });
    y += 11;
  });

  return y + 4;
};

const renderLegalFooter = (
  doc: PDFKit.PDFDocument,
  shopSettings: PdfShopSettings | undefined,
  startY: number,
  innerX: number,
  sectionWidth: number,
  options?: { poweredBySclera?: boolean }
) => {
  const legalParts: string[] = [];
  if (shopSettings?.vatNumber?.trim()) legalParts.push(`UID: ${shopSettings.vatNumber.trim()}`);
  if (shopSettings?.companyRegistrationNumber?.trim()) {
    legalParts.push(`Firmenbuchnummer: ${shopSettings.companyRegistrationNumber.trim()}`);
  }
  if (shopSettings?.taxNumber?.trim()) {
    legalParts.push(`Steuernummer: ${shopSettings.taxNumber.trim()}`);
  }

  if (legalParts.length === 0 && !options?.poweredBySclera) return startY;

  let y = startY;
  drawHorizontalRule(doc, innerX, y, sectionWidth);
  y += 8;

  if (legalParts.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(colors.muted)
      .text(legalParts.join("   |   "), innerX, y, { width: sectionWidth, lineBreak: false });
    y += 10;
  }

  if (options?.poweredBySclera) {
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(colors.muted)
      .text("Powered by Sclera", innerX, y, { width: sectionWidth, align: "center", lineBreak: false });
    y += 10;
  }

  return y;
};

const parseLogoDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  return Buffer.from(match[2], "base64");
};

const addShopLogo = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  shop: PdfShopSettings,
  fitWidth = 88,
  fitHeight = 62
) => {
  if (!shop.logoDataUrl) return;
  const buffer = parseLogoDataUrl(shop.logoDataUrl);
  if (!buffer) return;
  try {
    doc.image(buffer, x, y, { fit: [fitWidth, fitHeight], align: "center", valign: "center" });
  } catch {
    // Only the customer's uploaded logo is shown.
  }
};

const addImage = (
  doc: PDFKit.PDFDocument,
  storedPath: string | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackLabel: string
) => {
  doc.roundedRect(x, y, width, height, 4).fillAndStroke("#ffffff", colors.border);
  if (!storedPath) return;

  const absolutePath = toAbsolutePath(storedPath);
  if (!fs.existsSync(absolutePath)) return;

  const extension = path.extname(absolutePath).toLowerCase();
  const supportedImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  if (!supportedImageExtensions.includes(extension)) {
    doc.font("Helvetica").fontSize(6.6).fillColor(colors.muted).text(fallbackLabel, x + 4, y + height / 2 - 4, {
      width: width - 8,
      align: "center"
    });
    return;
  }

  try {
    doc.image(absolutePath, x + 4, y + 4, {
      fit: [width - 8, height - 8],
      align: "center",
      valign: "center"
    });
  } catch {
    doc.font("Helvetica").fontSize(6.6).fillColor(colors.muted).text(fallbackLabel, x + 4, y + height / 2 - 4, {
      width: width - 8,
      align: "center"
    });
  }
};

const addCheck = (doc: PDFKit.PDFDocument, label: string, checked: boolean, x: number, y: number) => {
  doc.circle(x + 5, y + 5, 5).fill(checked ? colors.green : "#cbd5e1");
  doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#ffffff").text(checked ? "✓" : "", x + 1.7, y + 1, {
    width: 7,
    align: "center"
  });
  doc.font("Helvetica").fontSize(7.2).fillColor(colors.ink).text(label, x + 15, y + 1, { width: 180 });
};

export const generateContractPdf = async (
  contract: ContractWithFiles,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getContractStorageDir(contract.userId, contract.contractNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/contract.pdf`;
  const doc = new PDFDocument({ margin: page.margin, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const box = contentBox();
  const shopOwner = shopSettings?.ownerName?.trim() || "";

  doc.roundedRect(box.left, 30, box.width, 762, 10).fillAndStroke("#ffffff", colors.border);

  let y = renderDocumentHeader(doc, shopSettings, {
    includeRegistration: true,
    meta: {
      numberLabel: "Contract No.",
      numberValue: contract.contractNumber,
      dateLabel: "Date",
      date: contract.updatedAt
    }
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.ink)
    .text("DEVICE PURCHASE CONTRACT", box.innerX, y, { width: box.sectionWidth, align: "center", lineBreak: false });
  y += 20;

  y = drawSectionTitle(doc, "Customer / Seller Information", box.innerX, y, box.sectionWidth);
  let rowY = y;
  drawKvRow(doc, "Name:", contract.customerName, box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(doc, "Phone:", contract.customerPhone, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  drawKvRow(doc, "Email:", contract.customerEmail, box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(
    doc,
    "DOB:",
    contract.customerDateOfBirth ? contract.customerDateOfBirth.toISOString().slice(0, 10) : "-",
    box.innerX + box.halfWidth + 16,
    rowY,
    52,
    box.halfWidth - 52
  );
  y = rowY + 11;
  y = drawKvRow(doc, "Address:", contract.customerAddress, box.innerX, y, 52, box.sectionWidth - 52);
  rowY = y;
  drawKvRow(doc, "ID Type:", contract.idDocumentNumber ? "Document" : "-", box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(doc, "ID Number:", contract.idDocumentNumber, box.innerX + box.halfWidth + 16, rowY, 64, box.halfWidth - 64);
  y = rowY + 11 + LAYOUT.sectionGap;

  y = drawSectionTitle(doc, "Device Information", box.innerX, y, box.sectionWidth);
  rowY = y;
  drawKvRow(doc, "Device Type:", contract.deviceType, box.innerX, rowY, 64, box.halfWidth - 64);
  drawKvRow(doc, "Brand:", contract.brand, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  drawKvRow(doc, "Model:", contract.model, box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(doc, "Storage:", contract.storage, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  drawKvRow(doc, "IMEI / Serial:", contract.imei || contract.serialNumber, box.innerX, rowY, 64, box.halfWidth - 64);
  drawKvRow(doc, "Color:", contract.color, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  drawKvRow(doc, "Condition:", contract.condition, box.innerX, rowY, 64, box.halfWidth - 64);
  drawKvRow(doc, "Battery:", contract.batteryHealth, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  y = drawKvRow(doc, "Accessories:", contract.accessories, box.innerX, y, 64, box.sectionWidth - 64);
  y = drawMultilineRow(doc, "Damage:", contract.damageNotes, box.innerX, y, box.sectionWidth, 20);
  y += LAYOUT.sectionGap;

  const purchasePanelHeight = 54;
  y = ensureSpace(doc, y, purchasePanelHeight + 8);
  addPanel(doc, box.innerX, y, box.sectionWidth, purchasePanelHeight);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text("Purchase Details", box.innerX + 12, y + 10, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Purchase Price", box.innerX + 12, y + 26, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).text("Payment Method", box.innerX + 12, y + 38, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(colors.ink)
    .text(formatPdfMoney(contract.purchasePrice), box.innerX + box.sectionWidth - 168, y + 10, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.ink)
    .text(value(contract.paymentMethod), box.innerX + box.sectionWidth - 168, y + 36, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  y += purchasePanelHeight + 10;

  const lowerPanelHeight = 118;
  y = ensureSpace(doc, y, lowerPanelHeight + 8);
  const leftPanelWidth = Math.floor(box.sectionWidth * 0.46);
  const rightPanelWidth = box.sectionWidth - leftPanelWidth - 12;
  const lowerY = y;

  addPanel(doc, box.innerX, lowerY, leftPanelWidth, lowerPanelHeight);
  addPanel(doc, box.innerX + leftPanelWidth + 12, lowerY, rightPanelWidth, lowerPanelHeight);

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text("Confirmations", box.innerX + 12, lowerY + 10, {
    lineBreak: false
  });
  [
    ["Ownership Confirmed", contract.ownershipConfirmed],
    ["Not Stolen", contract.notStolenConfirmed],
    ["iCloud Lock Removed", contract.icloudRemoved],
    ["Google Lock Removed", contract.googleLockRemoved],
    ["Other Account Lock Removed", contract.otherLockRemoved],
    ["Factory Reset Confirmed", contract.factoryResetConfirmed]
  ].forEach(([label, checked], index) => {
    addCheck(doc, String(label), Boolean(checked), box.innerX + 12, lowerY + 28 + index * 14);
  });

  const photosX = box.innerX + leftPanelWidth + 24;
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text("Photos", photosX, lowerY + 10, {
    lineBreak: false
  });
  contract.files.slice(0, 6).forEach((file, index) => {
    const col = index % 3;
    const fileRow = Math.floor(index / 3);
    addImage(doc, file.filePath, photosX + col * 52, lowerY + 28 + fileRow * 44, 46, 40, file.fileType);
  });
  y = lowerY + lowerPanelHeight + 10;

  const signaturePanelHeight = 86;
  y = ensureSpace(doc, y, signaturePanelHeight + 36);
  addPanel(doc, box.innerX, y, box.sectionWidth, signaturePanelHeight);
  const sigY = y + 10;
  const sigColWidth = Math.floor((box.sectionWidth - 36) / 2);

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.ink)
    .text("Customer / Seller Signature", box.innerX + 12, sigY, { lineBreak: false });
  const shopkeeperLabel = shopOwner ? `Shopkeeper / Buyer (${shopOwner})` : "Shopkeeper / Buyer Signature";
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.ink)
    .text(shopkeeperLabel, box.innerX + 18 + sigColWidth, sigY, { lineBreak: false });

  addImage(doc, contract.signaturePath, box.innerX + 12, sigY + 16, sigColWidth, 42, "Customer signature");
  addImage(
    doc,
    contract.shopkeeperSignaturePath,
    box.innerX + 18 + sigColWidth,
    sigY + 16,
    sigColWidth,
    42,
    "Shopkeeper signature"
  );

  doc.font("Helvetica-Bold").fontSize(6.8).fillColor(colors.ink).text("Date:", box.innerX + 12, sigY + 62, {
    lineBreak: false
  });
  doc
    .font("Helvetica")
    .fontSize(6.8)
    .fillColor(colors.ink)
    .text(formatDate(contract.updatedAt), box.innerX + 34, sigY + 62, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(6.8)
    .fillColor(colors.ink)
    .text("Date:", box.innerX + 18 + sigColWidth, sigY + 62, { lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(6.8)
    .fillColor(colors.ink)
    .text(formatDate(contract.updatedAt), box.innerX + 40 + sigColWidth, sigY + 62, { lineBreak: false });

  y += signaturePanelHeight + 8;
  y = ensureSpace(doc, y, 28);
  renderLegalFooter(doc, shopSettings, y, box.innerX, box.sectionWidth, { poweredBySclera: true });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return toRelativeStoragePath(absolutePdfPath);
};

type RepairOrderForPdf = {
  userId: string;
  repairOrderNumber: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string | null;
  deviceType: string;
  brand: string | null;
  model: string;
  imeiOrSerial: string | null;
  passwordPin: string | null;
  accessoriesReceived: string | null;
  problemDescription: string;
  visibleDamage: string | null;
  technicianNotes: string | null;
  estimatedPrice: MoneyLike;
  depositAmount: MoneyLike;
  expectedCompletionDate: Date | null;
  status: string;
};

type InvoiceForPdf = {
  userId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deviceSummary: string | null;
  repairSummary: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  calculatedNetAmount: MoneyLike;
  calculatedVatAmount: MoneyLike;
  calculatedGrossTotal: MoneyLike;
  netAmountOverride: MoneyLike;
  vatAmountOverride: MoneyLike;
  grossTotalOverride: MoneyLike;
  notes: string | null;
  items: Array<{
    description: string;
    quantity: MoneyLike;
    unitPrice: MoneyLike;
    vatPercent: MoneyLike;
    lineNet: MoneyLike;
    lineVat: MoneyLike;
    lineTotal: MoneyLike;
  }>;
};

const numericValue = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "0";
  return Number(input.toString()).toFixed(2).replace(/\.00$/, "");
};

const repairAccessoryLabels: Record<string, string> = {
  charger: "Charger",
  powerSupply: "Power Supply",
  controller: "Controller",
  cable: "Cable",
  carryingCase: "Carrying Case",
  other: "Other"
};

const formatAccessoriesReceived = (value: string | null | undefined) => {
  if (!value?.trim()) return "-";

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("other:")) {
        return part.slice(6).trim() || repairAccessoryLabels.other;
      }
      return repairAccessoryLabels[part] ?? part;
    })
    .join(", ");
};

export const generateRepairOrderPdf = async (
  repairOrder: RepairOrderForPdf,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getRepairOrderStorageDir(repairOrder.userId, repairOrder.repairOrderNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/repair-order.pdf`;
  const doc = new PDFDocument({ margin: page.margin, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const box = contentBox();

  doc.roundedRect(box.left, 30, box.width, 762, 10).fillAndStroke("#ffffff", colors.border);

  let y = renderDocumentHeader(doc, shopSettings, {
    logoWidth: 72,
    logoHeight: 50,
    meta: {
      numberLabel: "Order No.",
      numberValue: repairOrder.repairOrderNumber,
      dateLabel: "Date",
      date: repairOrder.createdAt,
      europeanDate: true
    }
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.ink)
    .text("REPAIR ORDER", box.innerX, y, { width: box.sectionWidth, align: "center", lineBreak: false });
  y += 20;

  y = drawSectionTitle(doc, "Customer Information", box.innerX, y, box.sectionWidth);
  let rowY = y;
  drawKvRow(doc, "Name:", repairOrder.customerName, box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(doc, "Phone:", repairOrder.customerPhone, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  y = drawKvRow(doc, "Email:", repairOrder.customerEmail, box.innerX, y, 52, box.sectionWidth - 52);
  y = drawKvRow(doc, "Address:", repairOrder.customerAddress, box.innerX, y, 52, box.sectionWidth - 52);
  y += LAYOUT.sectionGap;

  y = drawSectionTitle(doc, "Device Information", box.innerX, y, box.sectionWidth);
  rowY = y;
  drawKvRow(doc, "Device Type:", repairOrder.deviceType, box.innerX, rowY, 64, box.halfWidth - 64);
  drawKvRow(doc, "Brand:", repairOrder.brand, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  drawKvRow(doc, "Model:", repairOrder.model, box.innerX, rowY, 52, box.halfWidth - 52);
  drawKvRow(doc, "IMEI/Serial:", repairOrder.imeiOrSerial, box.innerX + box.halfWidth + 16, rowY, 64, box.halfWidth - 64);
  y = rowY + 11;
  y = drawKvRow(doc, "Password/PIN:", repairOrder.passwordPin, box.innerX, y, 64, box.halfWidth - 64);
  y = drawKvRow(
    doc,
    "Accessories:",
    formatAccessoriesReceived(repairOrder.accessoriesReceived),
    box.innerX,
    y,
    64,
    box.sectionWidth - 64
  );
  y += LAYOUT.sectionGap;

  y = drawSectionTitle(doc, "Repair Details", box.innerX, y, box.sectionWidth);
  y = drawMultilineRow(doc, "Problem:", repairOrder.problemDescription, box.innerX, y, box.sectionWidth, 28);
  y = drawMultilineRow(doc, "Damage:", repairOrder.visibleDamage, box.innerX, y, box.sectionWidth, 20);
  y = drawMultilineRow(doc, "Notes:", repairOrder.technicianNotes, box.innerX, y, box.sectionWidth, 20);
  rowY = y;
  drawKvRow(
    doc,
    "Expected:",
    repairOrder.expectedCompletionDate ? formatDate(repairOrder.expectedCompletionDate) : "-",
    box.innerX,
    rowY,
    64,
    box.halfWidth - 64
  );
  drawKvRow(doc, "Status:", repairOrder.status, box.innerX + box.halfWidth + 16, rowY, 52, box.halfWidth - 52);
  y = rowY + 11 + LAYOUT.sectionGap;

  const estimatePanelHeight = 54;
  y = ensureSpace(doc, y, estimatePanelHeight + 8);
  addPanel(doc, box.innerX, y, box.sectionWidth, estimatePanelHeight);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text("Estimate", box.innerX + 12, y + 10, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Estimated Price", box.innerX + 12, y + 26, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).text("Deposit / Advance", box.innerX + 12, y + 38, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(colors.ink)
    .text(formatPdfMoney(repairOrder.estimatedPrice), box.innerX + box.sectionWidth - 168, y + 12, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.ink)
    .text(formatPdfMoney(repairOrder.depositAmount), box.innerX + box.sectionWidth - 168, y + 36, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  y += estimatePanelHeight + 10;

  const signaturePanelHeight = 68;
  y = ensureSpace(doc, y, signaturePanelHeight);
  addPanel(doc, box.innerX, y, box.sectionWidth, signaturePanelHeight);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(colors.ink)
    .text("Customer Signature", box.innerX + 12, y + 10, { lineBreak: false });
  doc
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .moveTo(box.innerX + 12, y + 48)
    .lineTo(box.innerX + 220, y + 48)
    .stroke();
  doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text("Signature", box.innerX + 12, y + 54, {
    lineBreak: false
  });
  doc
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .moveTo(box.innerX + 248, y + 48)
    .lineTo(box.innerX + box.sectionWidth - 12, y + 48)
    .stroke();
  doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text("Date", box.innerX + 248, y + 54, {
    lineBreak: false
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return toRelativeStoragePath(absolutePdfPath);
};

export const generateInvoicePdf = async (
  invoice: InvoiceForPdf,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getInvoiceStorageDir(invoice.userId, invoice.invoiceNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/invoice.pdf`;
  const doc = new PDFDocument({ margin: page.margin, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const box = contentBox();

  doc.roundedRect(box.left, 30, box.width, 782, 10).fillAndStroke("#ffffff", colors.border);

  let y = renderDocumentHeader(doc, shopSettings, {
    meta: {
      numberLabel: "Rechnungsnr.",
      numberValue: invoice.invoiceNumber,
      dateLabel: "Datum",
      date: invoice.invoiceDate,
      europeanDate: true
    }
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(colors.ink)
    .text("RECHNUNG", box.innerX, y, { width: box.sectionWidth, lineBreak: false });
  y += 22;

  const customerBlockHeight = 72;
  y = ensureSpace(doc, y, customerBlockHeight);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.muted)
    .text("Rechnungsempfänger", box.innerX, y, { lineBreak: false });
  y += 12;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text(invoice.customerName, box.innerX, y, {
    lineBreak: false
  });
  y += 12;
  y = drawOptionalRow(doc, "", invoice.customerAddress, box.innerX, y, 0, box.sectionWidth);
  y = drawOptionalRow(doc, "Tel.:", invoice.customerPhone, box.innerX, y, 28, box.sectionWidth - 28);
  y = drawOptionalRow(doc, "E-Mail:", invoice.customerEmail, box.innerX, y, 40, box.sectionWidth - 40);
  y += LAYOUT.sectionGap;

  const serviceSummary = invoice.repairSummary?.trim() || invoice.deviceSummary?.trim();
  if (serviceSummary) {
    y = ensureSpace(doc, y, 28);
    y = drawOptionalRow(doc, "Leistung:", serviceSummary, box.innerX, y, 56, box.sectionWidth - 56);
    y += 4;
  }

  const tableCols = {
    pos: box.innerX,
    desc: box.innerX + 20,
    qty: box.innerX + 138,
    unit: box.innerX + 164,
    vatPct: box.innerX + 196,
    net: box.innerX + 232,
    vat: box.innerX + 288,
    gross: box.innerX + 344
  };
  const colWidths = {
    pos: 16,
    desc: 114,
    qty: 22,
    unit: 28,
    vatPct: 32,
    net: 52,
    vat: 52,
    gross: box.sectionWidth - 344
  };

  const items = invoice.items.slice(0, 20);
  const tableHeaderHeight = 20;
  const rowHeight = 16;
  y = ensureSpace(doc, y, tableHeaderHeight + Math.min(items.length, 1) * rowHeight + 8);

  const tableY = y;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.ink);
  doc.text("Pos.", tableCols.pos, tableY, { width: colWidths.pos, lineBreak: false });
  doc.text("Beschreibung", tableCols.desc, tableY, { width: colWidths.desc, lineBreak: false });
  doc.text("Menge", tableCols.qty, tableY, { width: colWidths.qty, align: "right", lineBreak: false });
  doc.text("Einh.", tableCols.unit, tableY, { width: colWidths.unit, lineBreak: false });
  doc.text("MwSt %", tableCols.vatPct, tableY, { width: colWidths.vatPct, align: "right", lineBreak: false });
  doc.text("Netto", tableCols.net, tableY, { width: colWidths.net, align: "right", lineBreak: false });
  doc.text("MwSt", tableCols.vat, tableY, { width: colWidths.vat, align: "right", lineBreak: false });
  doc.text("Brutto", tableCols.gross, tableY, { width: colWidths.gross, align: "right", lineBreak: false });
  drawHorizontalRule(doc, box.innerX, tableY + 12, box.sectionWidth);

  y = tableY + tableHeaderHeight;
  items.forEach((item, index) => {
    if (index > 0) {
      y = ensureSpace(doc, y, rowHeight);
    }
    doc.font("Helvetica").fontSize(7).fillColor(colors.ink);
    doc.text(String(index + 1), tableCols.pos, y, { width: colWidths.pos, lineBreak: false });
    doc.text(value(item.description), tableCols.desc, y, { width: colWidths.desc, ellipsis: true, lineBreak: false });
    doc.text(numericValue(item.quantity), tableCols.qty, y, { width: colWidths.qty, align: "right", lineBreak: false });
    doc.text("Stk.", tableCols.unit, y, { width: colWidths.unit, lineBreak: false });
    doc.text(numericValue(item.vatPercent), tableCols.vatPct, y, { width: colWidths.vatPct, align: "right", lineBreak: false });
    doc.text(formatPdfWholeMoney(item.lineNet), tableCols.net, y, { width: colWidths.net, align: "right", lineBreak: false });
    doc.text(formatPdfWholeMoney(item.lineVat), tableCols.vat, y, { width: colWidths.vat, align: "right", lineBreak: false });
    doc.text(formatPdfWholeMoney(item.lineTotal), tableCols.gross, y, {
      width: colWidths.gross,
      align: "right",
      lineBreak: false
    });
    y += rowHeight;
  });

  drawHorizontalRule(doc, box.innerX, y + 2, box.sectionWidth);
  y += 12;

  const vatBreakdown = new Map<string, { net: number; vat: number }>();
  invoice.items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    const current = vatBreakdown.get(key) ?? { net: 0, vat: 0 };
    current.net += Number(item.lineNet?.toString() ?? 0);
    current.vat += Number(item.lineVat?.toString() ?? 0);
    vatBreakdown.set(key, current);
  });

  const vatLines = Array.from(vatBreakdown.entries());
  const totalsPanelHeight = 88;
  const summaryHeight = 14 + vatLines.length * 13 + totalsPanelHeight + 16;
  y = ensureSpace(doc, y, summaryHeight);

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.ink)
    .text("MwSt-Aufschlüsselung", box.innerX, y, { lineBreak: false });
  y += 14;
  vatLines.forEach(([percent, totals]) => {
    doc
      .font("Helvetica")
      .fontSize(7.2)
      .fillColor(colors.muted)
      .text(
        `+ ${percent}% MwSt. auf ${formatPdfWholeMoney(totals.net)}: ${formatPdfWholeMoney(totals.vat)}`,
        box.innerX,
        y,
        { width: 260, lineBreak: false }
      );
    y += 13;
  });

  const net = invoice.calculatedNetAmount;
  const vat = invoice.calculatedVatAmount;
  const gross = invoice.calculatedGrossTotal;
  const totalsX = box.innerX + Math.max(250, box.sectionWidth - 190);
  const totalsY = y;
  addPanel(doc, totalsX, totalsY, 170, totalsPanelHeight);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text("Netto-Betrag", totalsX + 12, totalsY + 12, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).text("MwSt.", totalsX + 12, totalsY + 30, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(colors.ink)
    .text("Brutto-Gesamt", totalsX + 12, totalsY + 52, { lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.ink)
    .text(formatPdfWholeMoney(net), totalsX + 88, totalsY + 12, { width: 70, align: "right", lineBreak: false });
  doc.text(formatPdfWholeMoney(vat), totalsX + 88, totalsY + 30, { width: 70, align: "right", lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(formatPdfWholeMoney(gross), totalsX + 88, totalsY + 50, { width: 70, align: "right", lineBreak: false });

  y = Math.max(y + 12, totalsY + totalsPanelHeight + 12);

  if (hasText(invoice.notes)) {
    const notesHeight = 56;
    y = ensureSpace(doc, y, notesHeight);
    drawHorizontalRule(doc, box.innerX, y, box.sectionWidth);
    y += 10;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("Anmerkungen", box.innerX, y, { lineBreak: false });
    y += 12;
    doc.font("Helvetica").fontSize(7.4).fillColor(colors.ink).text(String(invoice.notes).trim(), box.innerX, y, {
      width: box.sectionWidth,
      height: 36,
      ellipsis: true
    });
    y += 44;
  }

  y = ensureSpace(doc, y, 60);
  y = renderInvoicePaymentSection(doc, shopSettings, y, box.innerX, box.sectionWidth);
  y = ensureSpace(doc, y, 24);
  renderLegalFooter(doc, shopSettings, y, box.innerX, box.sectionWidth);

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return toRelativeStoragePath(absolutePdfPath);
};

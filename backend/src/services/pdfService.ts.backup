import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
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

const renderShopCompanyHeader = (doc: PDFKit.PDFDocument, shopSettings?: PdfShopSettings) => {
  const left = page.margin;
  const right = page.width - page.margin;
  const contentWidth = right - left;
  const padding = 20;
  const logoWidth = 72;
  const logoHeight = 52;
  const logoX = left + padding;
  const logoY = 42;

  if (shopSettings) {
    addShopLogo(doc, logoX, logoY, shopSettings, logoWidth, logoHeight);
  }

  const textWidth = contentWidth - logoWidth - padding * 2 - 12;
  const textX = right - padding - textWidth;
  let y = 46;

  const addRightLine = (text: string, options?: { bold?: boolean; size?: number }) => {
    if (!text.trim()) return;
    doc
      .font(options?.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options?.size ?? 8)
      .fillColor(colors.ink)
      .text(text, textX, y, { width: textWidth, align: "right" });
    y += (options?.size ?? 8) + 3;
  };

  addRightLine(shopSettings?.name?.trim() ?? "", { bold: true, size: 12 });
  if (shopSettings?.ownerName?.trim()) addRightLine(shopSettings.ownerName.trim());
  getStructuredAddressLines(shopSettings).forEach((line) => addRightLine(line));
  if (shopSettings?.email?.trim()) addRightLine(shopSettings.email.trim());
  if (shopSettings?.phone?.trim()) addRightLine(`Tel.: ${shopSettings.phone.trim()}`);
  if (shopSettings?.website?.trim()) addRightLine(shopSettings.website.trim());
  if (shopSettings?.vatNumber?.trim()) addRightLine(`UID: ${shopSettings.vatNumber.trim()}`);
  if (shopSettings?.companyRegistrationNumber?.trim()) {
    addRightLine(`Firmenbuchnummer: ${shopSettings.companyRegistrationNumber.trim()}`);
  }
  if (shopSettings?.taxNumber?.trim()) {
    addRightLine(`Steuernummer: ${shopSettings.taxNumber.trim()}`);
  }

  const headerBottom = Math.max(y + 8, logoY + logoHeight + 12);
  drawHorizontalRule(doc, left + padding, headerBottom, contentWidth - padding * 2);
  return headerBottom + 14;
};

const REPAIR_PAGE_BOTTOM = 786;

const ensureRepairPageSpace = (doc: PDFKit.PDFDocument, y: number, neededHeight: number) => {
  if (y + neededHeight <= REPAIR_PAGE_BOTTOM) return y;
  doc.addPage();
  return page.margin + 36;
};

const renderRepairOrderShopHeader = (
  doc: PDFKit.PDFDocument,
  shopSettings: PdfShopSettings | undefined,
  orderNumber: string,
  orderDate: Date
) => {
  const left = page.margin;
  const right = page.width - page.margin;
  const contentWidth = right - left;
  const padding = 20;
  const logoWidth = 56;
  const logoHeight = 40;
  const logoX = left + padding;
  const logoY = 40;

  if (shopSettings) {
    addShopLogo(doc, logoX, logoY, shopSettings, logoWidth, logoHeight);
  }

  const metaX = right - padding - 110;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("Repair Order No.", metaX, 42, {
    width: 110,
    align: "right",
    lineBreak: false
  });
  doc.fontSize(9).fillColor(colors.ink).text(orderNumber, metaX, 52, { width: 110, align: "right", lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("Date", metaX, 66, {
    width: 110,
    align: "right",
    lineBreak: false
  });
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(colors.ink)
    .text(formatDate(orderDate), metaX, 76, { width: 110, align: "right", lineBreak: false });

  const textWidth = contentWidth - logoWidth - padding * 2 - 16;
  const textX = right - padding - textWidth;
  let y = 44;

  const addRightLine = (text: string, options?: { bold?: boolean; size?: number }) => {
    if (!text.trim()) return;
    doc
      .font(options?.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options?.size ?? 7.5)
      .fillColor(colors.ink)
      .text(text, textX, y, { width: textWidth, align: "right", lineBreak: false });
    y += (options?.size ?? 7.5) + 2;
  };

  addRightLine(shopSettings?.name?.trim() ?? "", { bold: true, size: 10 });
  getStructuredAddressLines(shopSettings).forEach((line) => addRightLine(line));
  if (shopSettings?.phone?.trim()) addRightLine(`Tel.: ${shopSettings.phone.trim()}`);
  if (shopSettings?.email?.trim()) addRightLine(shopSettings.email.trim());
  if (shopSettings?.website?.trim()) addRightLine(shopSettings.website.trim());
  if (shopSettings?.vatNumber?.trim()) addRightLine(`UID: ${shopSettings.vatNumber.trim()}`);

  const headerBottom = Math.max(y + 6, logoY + logoHeight + 8);
  drawHorizontalRule(doc, left + padding, headerBottom, contentWidth - padding * 2);
  return headerBottom + 10;
};

const compactSectionTitle = (
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

const compactRow = (
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

const compactMultilineRow = (
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

const renderShopFooter = (
  doc: PDFKit.PDFDocument,
  shopSettings: PdfShopSettings | undefined,
  startY: number,
  innerX: number,
  sectionWidth: number
) => {
  let y = startY;
  const legalParts: string[] = [];

  if (shopSettings?.vatNumber?.trim()) legalParts.push(`UID: ${shopSettings.vatNumber.trim()}`);
  if (shopSettings?.companyRegistrationNumber?.trim()) {
    legalParts.push(`Firmenbuchnummer: ${shopSettings.companyRegistrationNumber.trim()}`);
  }
  if (shopSettings?.taxNumber?.trim()) {
    legalParts.push(`Steuernummer: ${shopSettings.taxNumber.trim()}`);
  }

  const hasBankDetails =
    hasText(shopSettings?.accountHolder) ||
    hasText(shopSettings?.iban) ||
    hasText(shopSettings?.bicSwift) ||
    hasText(shopSettings?.bankName);

  if (legalParts.length === 0 && !hasBankDetails) return y;

  drawHorizontalRule(doc, innerX, y, sectionWidth);
  y += 12;

  if (legalParts.length > 0) {
    doc.font("Helvetica").fontSize(7.2).fillColor(colors.muted).text(legalParts.join("   |   "), innerX, y, {
      width: sectionWidth
    });
    y += 14;
  }

  if (hasBankDetails) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("Bankverbindung", innerX, y);
    y += 12;

    const bankRows: Array<[string, string | undefined]> = [
      ["Kontoinhaber:", shopSettings?.accountHolder],
      ["IBAN:", shopSettings?.iban],
      ["BIC / SWIFT:", shopSettings?.bicSwift],
      ["Bank:", shopSettings?.bankName]
    ];

    bankRows.forEach(([label, bankValue]) => {
      if (!hasText(bankValue)) return;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.ink).text(label, innerX, y, { width: 78 });
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(colors.ink)
        .text(String(bankValue).trim(), innerX + 78, y, { width: sectionWidth - 78 });
      y += 11;
    });
  }

  return y;
};

const addPhoneIcon = (doc: PDFKit.PDFDocument, x: number, y: number) => {
  doc.roundedRect(x, y, 24, 34, 4).strokeColor(colors.blue).lineWidth(2).stroke();
  doc.circle(x + 12, y + 29, 1.5).fill(colors.blue);
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
  fitWidth = 24,
  fitHeight = 34
) => {
  if (shop.logoDataUrl) {
    const buffer = parseLogoDataUrl(shop.logoDataUrl);
    if (buffer) {
      try {
        doc.image(buffer, x, y, { fit: [fitWidth, fitHeight], align: "center", valign: "center" });
        return;
      } catch {
        // Fall through to file path or default icon.
      }
    }
  }

  if (env.SHOP_LOGO_PATH) {
    const absolutePath = toAbsolutePath(env.SHOP_LOGO_PATH);
    if (fs.existsSync(absolutePath) && absolutePath.toLowerCase().endsWith(".png")) {
      try {
        doc.image(absolutePath, x, y, { fit: [fitWidth, fitHeight], align: "center", valign: "center" });
        return;
      } catch {
        // Fall through to default icon.
      }
    }
  }

  addPhoneIcon(doc, x, y);
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
  const doc = new PDFDocument({ margin: page.margin, size: "A4", bufferPages: true });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const left = page.margin;
  const right = page.width - page.margin;
  const contentWidth = right - left;

  doc.roundedRect(left, 30, contentWidth, 782, 10).fillAndStroke("#ffffff", colors.border);
  const contentStartY = renderShopCompanyHeader(doc, shopSettings);
  const shopOwner = shopSettings?.ownerName?.trim() || "";

  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("Contract No.", right - 112, 58, {
    width: 92,
    align: "right"
  });
  doc.fontSize(9).fillColor(colors.ink).text(contract.contractNumber, right - 112, 70, {
    width: 92,
    align: "right"
  });
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("Date", right - 112, 86, {
    width: 92,
    align: "right"
  });
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.ink).text(formatDate(contract.updatedAt), right - 112, 97, {
    width: 92,
    align: "right"
  });

  doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.ink).text("DEVICE PURCHASE CONTRACT", left, contentStartY, {
    width: contentWidth,
    align: "center"
  });

  const sectionWidth = contentWidth - 40;
  const innerX = left + 20;
  const bodyStartY = contentStartY + 24;
  sectionTitle(doc, "Customer Information", innerX, bodyStartY, sectionWidth);
  row(doc, "Name:", contract.customerName, innerX, bodyStartY + 26, 235);
  row(doc, "Phone:", contract.customerPhone, innerX + 255, bodyStartY + 26, 220);
  row(doc, "Address:", contract.customerAddress, innerX, bodyStartY + 44, 475);
  row(doc, "Email:", contract.customerEmail, innerX, bodyStartY + 62, 235);
  row(
    doc,
    "DOB:",
    contract.customerDateOfBirth ? contract.customerDateOfBirth.toISOString().slice(0, 10) : "-",
    innerX + 255,
    bodyStartY + 62,
    220
  );
  row(doc, "ID Type:", contract.idDocumentNumber ? "Document" : "-", innerX, bodyStartY + 80, 235);
  row(doc, "ID Number:", contract.idDocumentNumber, innerX + 255, bodyStartY + 80, 220);

  const deviceSectionY = bodyStartY + 110;
  sectionTitle(doc, "Device Information", innerX, deviceSectionY, sectionWidth);
  row(doc, "Device Type:", contract.deviceType, innerX, deviceSectionY + 26, 235);
  row(doc, "Brand:", contract.brand, innerX + 255, deviceSectionY + 26, 220);
  row(doc, "Model:", contract.model, innerX, deviceSectionY + 44, 235);
  row(doc, "Storage:", contract.storage, innerX + 255, deviceSectionY + 44, 220);
  row(doc, "IMEI / Serial:", contract.imei || contract.serialNumber, innerX, deviceSectionY + 62, 235);
  row(doc, "Color:", contract.color, innerX + 255, deviceSectionY + 62, 220);
  row(doc, "Condition:", contract.condition, innerX, deviceSectionY + 80, 235);
  row(doc, "Battery Health:", contract.batteryHealth, innerX + 255, deviceSectionY + 80, 220);
  row(doc, "Accessories:", contract.accessories, innerX, deviceSectionY + 98, 475);
  row(doc, "Visible Damage:", contract.damageNotes, innerX, deviceSectionY + 116, 475);

  const purchasePanelY = deviceSectionY + 150;
  addPanel(doc, innerX, purchasePanelY, sectionWidth, 74);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Purchase Details", innerX + 14, purchasePanelY + 16);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text("Purchase Price:", innerX + 14, purchasePanelY + 42);
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Payment Method:", innerX + 14, purchasePanelY + 58);
  doc.font("Helvetica-Bold").fontSize(25).fillColor(colors.ink).text(formatPdfMoney(contract.purchasePrice), innerX + 320, purchasePanelY + 23, {
    width: 138,
    align: "right"
  });
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(value(contract.paymentMethod), innerX + 320, purchasePanelY + 56, {
    width: 138,
    align: "right"
  });

  const lowerY = purchasePanelY + 96;
  const leftPanelWidth = 244;
  const photoPanelWidth = sectionWidth - leftPanelWidth - 18;
  addPanel(doc, innerX, lowerY, leftPanelWidth, 150);
  addPanel(doc, innerX + leftPanelWidth + 18, lowerY, photoPanelWidth, 150);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Confirmations", innerX + 14, lowerY + 14);
  [
    ["Ownership Confirmed", contract.ownershipConfirmed],
    ["Not Stolen", contract.notStolenConfirmed],
    ["iCloud Lock Removed", contract.icloudRemoved],
    ["Google Lock Removed", contract.googleLockRemoved],
    ["Other Account Lock Removed", contract.otherLockRemoved],
    ["Factory Reset Done", contract.factoryResetConfirmed]
  ].forEach(([label, checked], index) => {
    addCheck(doc, String(label), Boolean(checked), innerX + 14, lowerY + 36 + index * 18);
  });

  const photosX = innerX + leftPanelWidth + 32;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Photos", photosX, lowerY + 14);
  contract.files.slice(0, 6).forEach((file, index) => {
    const col = index % 3;
    const rowIndex = Math.floor(index / 3);
    addImage(doc, file.filePath, photosX + col * 62, lowerY + 34 + rowIndex * 58, 52, 48, file.fileType);
  });

  addPanel(doc, innerX, 676, sectionWidth, 112);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Customer / Seller Signature", innerX + 14, 692);
  const shopkeeperLabel = shopOwner
    ? `Shopkeeper / Buyer (${shopOwner})`
    : "Shopkeeper / Buyer Signature";
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text(shopkeeperLabel, innerX + 272, 692);
  addImage(doc, contract.signaturePath, innerX + 14, 710, 210, 56, "Customer signature");
  addImage(doc, contract.shopkeeperSignaturePath, innerX + 272, 710, 210, 56, "Shopkeeper signature");
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.ink).text("Date:", innerX + 14, 774);
  doc.font("Helvetica").fontSize(7).text(formatDate(contract.updatedAt), innerX + 38, 774);
  doc.font("Helvetica-Bold").fontSize(7).text("Date:", innerX + 272, 774);
  doc.font("Helvetica").fontSize(7).text(formatDate(contract.updatedAt), innerX + 296, 774);

  renderShopFooter(doc, shopSettings, 748, innerX, sectionWidth);

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.blue).text("Thank you for your business!", left, 793, {
    width: contentWidth,
    align: "center",
    lineBreak: false
  });

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

const addDocumentHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  numberLabel: string,
  numberValue: string,
  date: Date,
  shopSettings?: PdfShopSettings
) => {
  const left = page.margin;
  const right = page.width - page.margin;
  const contentWidth = right - left;

  doc.roundedRect(left, 30, contentWidth, 782, 10).fillAndStroke("#ffffff", colors.border);
  const contentStartY = renderShopCompanyHeader(doc, shopSettings);

  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text(numberLabel, right - 140, 58, {
    width: 120,
    align: "right"
  });
  doc.fontSize(10).fillColor(colors.ink).text(numberValue, right - 140, 70, {
    width: 120,
    align: "right"
  });
  doc.font("Helvetica-Bold").fontSize(7).fillColor(colors.muted).text("Date", right - 140, 88, {
    width: 120,
    align: "right"
  });
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.ink).text(formatDate(date), right - 140, 99, {
    width: 120,
    align: "right"
  });

  doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink).text(title, left, contentStartY, {
    width: contentWidth,
    align: "center"
  });

  return contentStartY + 24;
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

  const left = page.margin;
  const innerX = left + 20;
  const right = page.width - page.margin;
  const sectionWidth = right - left - 40;
  const halfWidth = Math.floor(sectionWidth / 2) - 8;

  doc.roundedRect(left, 30, right - left, 762, 10).fillAndStroke("#ffffff", colors.border);

  let y = renderRepairOrderShopHeader(
    doc,
    shopSettings,
    repairOrder.repairOrderNumber,
    repairOrder.createdAt
  );

  doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.ink).text("REPAIR ORDER", innerX, y, {
    width: sectionWidth,
    align: "center",
    lineBreak: false
  });
  y += 20;

  y = compactSectionTitle(doc, "Customer Information", innerX, y, sectionWidth);
  let rowY = y;
  compactRow(doc, "Name:", repairOrder.customerName, innerX, rowY, 52, halfWidth - 52);
  compactRow(doc, "Phone:", repairOrder.customerPhone, innerX + halfWidth + 16, rowY, 52, halfWidth - 52);
  y = rowY + 11;
  y = compactRow(doc, "Email:", repairOrder.customerEmail, innerX, y, 52, sectionWidth - 52);
  y = compactRow(doc, "Address:", repairOrder.customerAddress, innerX, y, 52, sectionWidth - 52);
  y += 6;

  y = compactSectionTitle(doc, "Device Information", innerX, y, sectionWidth);
  rowY = y;
  compactRow(doc, "Device Type:", repairOrder.deviceType, innerX, rowY, 64, halfWidth - 64);
  compactRow(doc, "Brand:", repairOrder.brand, innerX + halfWidth + 16, rowY, 52, halfWidth - 52);
  y = rowY + 11;
  rowY = y;
  compactRow(doc, "Model:", repairOrder.model, innerX, rowY, 52, halfWidth - 52);
  compactRow(doc, "IMEI/Serial:", repairOrder.imeiOrSerial, innerX + halfWidth + 16, rowY, 64, halfWidth - 64);
  y = rowY + 11;
  y = compactRow(doc, "Password/PIN:", repairOrder.passwordPin, innerX, y, 64, halfWidth - 64);
  y = compactRow(
    doc,
    "Accessories:",
    formatAccessoriesReceived(repairOrder.accessoriesReceived),
    innerX,
    y,
    64,
    sectionWidth - 64
  );
  y += 6;

  y = compactSectionTitle(doc, "Repair Details", innerX, y, sectionWidth);
  y = compactMultilineRow(doc, "Problem:", repairOrder.problemDescription, innerX, y, sectionWidth, 28);
  y = compactMultilineRow(doc, "Damage:", repairOrder.visibleDamage, innerX, y, sectionWidth, 20);
  y = compactMultilineRow(doc, "Notes:", repairOrder.technicianNotes, innerX, y, sectionWidth, 20);
  rowY = y;
  compactRow(
    doc,
    "Expected:",
    repairOrder.expectedCompletionDate ? formatDate(repairOrder.expectedCompletionDate) : "-",
    innerX,
    rowY,
    64,
    halfWidth - 64
  );
  compactRow(doc, "Status:", repairOrder.status, innerX + halfWidth + 16, rowY, 52, halfWidth - 52);
  y = rowY + 11;
  y += 8;

  const estimatePanelHeight = 54;
  y = ensureRepairPageSpace(doc, y, estimatePanelHeight + 8);
  addPanel(doc, innerX, y, sectionWidth, estimatePanelHeight);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.ink).text("Estimate", innerX + 12, y + 10, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Estimated Price", innerX + 12, y + 26, {
    lineBreak: false
  });
  doc.font("Helvetica").fontSize(7).text("Deposit / Advance", innerX + 12, y + 38, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(colors.ink)
    .text(formatPdfMoney(repairOrder.estimatedPrice), innerX + sectionWidth - 168, y + 12, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.ink)
    .text(formatPdfMoney(repairOrder.depositAmount), innerX + sectionWidth - 168, y + 36, {
      width: 156,
      align: "right",
      lineBreak: false
    });
  y += estimatePanelHeight + 10;

  const signaturePanelHeight = 68;
  y = ensureRepairPageSpace(doc, y, signaturePanelHeight);
  addPanel(doc, innerX, y, sectionWidth, signaturePanelHeight);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(colors.ink)
    .text("Customer Signature", innerX + 12, y + 10, { lineBreak: false });
  doc
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .moveTo(innerX + 12, y + 48)
    .lineTo(innerX + 220, y + 48)
    .stroke();
  doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text("Signature", innerX + 12, y + 54, {
    lineBreak: false
  });
  doc
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .moveTo(innerX + 248, y + 48)
    .lineTo(innerX + sectionWidth - 12, y + 48)
    .stroke();
  doc.font("Helvetica").fontSize(6.8).fillColor(colors.muted).text("Date", innerX + 248, y + 54, {
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
  const doc = new PDFDocument({ margin: page.margin, size: "A4" });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const left = page.margin;
  const innerX = left + 20;
  const right = page.width - page.margin;
  const sectionWidth = right - left - 40;

  doc.roundedRect(left, 30, right - left, 782, 10).fillAndStroke("#ffffff", colors.border);
  let y = renderShopCompanyHeader(doc, shopSettings);

  doc.font("Helvetica-Bold").fontSize(14).fillColor(colors.ink).text("RECHNUNG", innerX, y, {
    width: sectionWidth
  });
  y += 24;

  y = optionalTextRow(doc, "Rechnungsnummer:", invoice.invoiceNumber, innerX, y, 96, sectionWidth - 96);
  y = optionalTextRow(doc, "Datum:", formatPdfDateEuropean(invoice.invoiceDate), innerX, y, 96, sectionWidth - 96);
  y = optionalTextRow(doc, "Kunde:", invoice.customerName, innerX, y, 96, sectionWidth - 96);
  y = optionalTextRow(doc, "Adresse:", invoice.customerAddress, innerX, y, 96, sectionWidth - 96);
  y = optionalTextRow(doc, "Telefon:", invoice.customerPhone, innerX, y, 96, sectionWidth - 96);
  y = optionalTextRow(doc, "E-Mail:", invoice.customerEmail, innerX, y, 96, sectionWidth - 96);

  drawHorizontalRule(doc, innerX, y + 4, sectionWidth);
  y += 16;

  const serviceSummary = invoice.repairSummary?.trim() || invoice.deviceSummary?.trim();
  if (serviceSummary) {
    y = optionalTextRow(doc, "Leistung:", serviceSummary, innerX, y, 96, sectionWidth - 96);
    drawHorizontalRule(doc, innerX, y + 4, sectionWidth);
    y += 16;
  }

  const tableY = y;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink);
  doc.text("Pos.", innerX, tableY, { width: 24 });
  doc.text("Beschreibung", innerX + 28, tableY, { width: 168 });
  doc.text("Menge", innerX + 200, tableY, { width: 34, align: "right" });
  doc.text("Einzelpreis", innerX + 238, tableY, { width: 58, align: "right" });
  doc.text("MwSt %", innerX + 302, tableY, { width: 42, align: "right" });
  doc.text("Gesamt", innerX + 350, tableY, { width: sectionWidth - 350, align: "right" });
  drawHorizontalRule(doc, innerX, tableY + 14, sectionWidth);

  y = tableY + 22;
  invoice.items.slice(0, 14).forEach((item, index) => {
    doc.font("Helvetica").fontSize(7.6).fillColor(colors.ink);
    doc.text(String(index + 1), innerX, y, { width: 24 });
    doc.text(value(item.description), innerX + 28, y, { width: 168, ellipsis: true });
    doc.text(numericValue(item.quantity), innerX + 200, y, { width: 34, align: "right" });
    doc.text(formatPdfWholeMoney(item.unitPrice), innerX + 238, y, { width: 58, align: "right" });
    doc.text(numericValue(item.vatPercent), innerX + 302, y, { width: 42, align: "right" });
    doc.text(formatPdfWholeMoney(item.lineTotal), innerX + 350, y, {
      width: sectionWidth - 350,
      align: "right"
    });
    y += 18;
  });

  drawHorizontalRule(doc, innerX, y + 2, sectionWidth);
  y += 14;

  const vatBreakdown = new Map<string, { net: number; vat: number }>();
  invoice.items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    const current = vatBreakdown.get(key) ?? { net: 0, vat: 0 };
    current.net += Number(item.lineNet?.toString() ?? 0);
    current.vat += Number(item.lineVat?.toString() ?? 0);
    vatBreakdown.set(key, current);
  });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("MwSt-Aufschlüsselung", innerX, y);
  y += 14;
  Array.from(vatBreakdown.entries()).forEach(([percent, totals]) => {
    doc
      .font("Helvetica")
      .fontSize(7.6)
      .fillColor(colors.muted)
      .text(`+ ${percent}% MwSt. auf ${formatPdfWholeMoney(totals.net)}: ${formatPdfWholeMoney(totals.vat)}`, innerX, y, {
        width: 260
      });
    y += 13;
  });

  const net = invoice.calculatedNetAmount;
  const vat = invoice.calculatedVatAmount;
  const gross = invoice.calculatedGrossTotal;
  const totalsX = innerX + Math.max(250, sectionWidth - 190);
  const totalsY = y;
  addPanel(doc, totalsX, totalsY, 170, 88);
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("Netto-Betrag", totalsX + 12, totalsY + 12);
  doc.font("Helvetica").fontSize(8).text("MwSt.", totalsX + 12, totalsY + 30);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Brutto-Gesamt", totalsX + 12, totalsY + 52);
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(formatPdfWholeMoney(net), totalsX + 88, totalsY + 12, {
    width: 70,
    align: "right"
  });
  doc.text(formatPdfWholeMoney(vat), totalsX + 88, totalsY + 30, { width: 70, align: "right" });
  doc.font("Helvetica-Bold").fontSize(10).text(formatPdfWholeMoney(gross), totalsX + 88, totalsY + 50, {
    width: 70,
    align: "right"
  });

  y = Math.max(y + 96, totalsY + 100);

  if (hasText(invoice.notes)) {
    drawHorizontalRule(doc, innerX, y, sectionWidth);
    y += 12;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("Anmerkungen", innerX, y);
    y += 12;
    doc.font("Helvetica").fontSize(7.6).fillColor(colors.ink).text(String(invoice.notes).trim(), innerX, y, {
      width: sectionWidth,
      height: 48,
      ellipsis: true
    });
    y += 56;
  }

  renderShopFooter(doc, shopSettings, Math.min(y + 8, 700), innerX, sectionWidth);

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return toRelativeStoragePath(absolutePdfPath);
};

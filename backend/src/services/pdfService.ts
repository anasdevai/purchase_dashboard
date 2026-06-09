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

const money = (input: ContractWithFiles["purchasePrice"]) =>
  input ? `$${Number(input.toString()).toFixed(2)}` : "$0.00";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

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

const addShopLogo = (doc: PDFKit.PDFDocument, x: number, y: number, shop: PdfShopSettings) => {
  if (shop.logoDataUrl) {
    const buffer = parseLogoDataUrl(shop.logoDataUrl);
    if (buffer) {
      try {
        doc.image(buffer, x, y, { fit: [24, 34], align: "center", valign: "center" });
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
        doc.image(absolutePath, x, y, { fit: [24, 34], align: "center", valign: "center" });
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
  const shopName = shopSettings?.name?.trim() || env.SHOP_NAME;
  const shopAddress = shopSettings?.address?.trim() || env.SHOP_ADDRESS || "We buy used devices";
  const shopPhone = shopSettings?.phone?.trim() || env.SHOP_PHONE;
  const shopEmail = shopSettings?.email?.trim() || env.SHOP_EMAIL;
  const shopOwner = shopSettings?.ownerName?.trim() || env.SHOP_OWNER_NAME;
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

  if (shopSettings) {
    addShopLogo(doc, left + 20, 54, shopSettings);
  } else {
    addPhoneIcon(doc, left + 20, 54);
  }
  doc.font("Helvetica-Bold").fontSize(18).fillColor(colors.ink).text(shopName, left + 56, 56);
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(shopAddress, left + 56, 78, {
    width: 230
  });
  const contactLine = [shopPhone, shopEmail].filter(Boolean).join(" | ");
  if (contactLine) {
    doc.fontSize(7).text(contactLine, left + 56, 91, {
      width: 230
    });
  }
  if (shopOwner) {
    doc.fontSize(7).text(`Owner / Manager: ${shopOwner}`, left + 56, 103, {
      width: 230
    });
  }

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

  doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.ink).text("DEVICE PURCHASE CONTRACT", left, 122, {
    width: contentWidth,
    align: "center"
  });

  const sectionWidth = contentWidth - 40;
  const innerX = left + 20;
  sectionTitle(doc, "Customer Information", innerX, 150, sectionWidth);
  row(doc, "Name:", contract.customerName, innerX, 176, 235);
  row(doc, "Phone:", contract.customerPhone, innerX + 255, 176, 220);
  row(doc, "Address:", contract.customerAddress, innerX, 194, 475);
  row(doc, "Email:", contract.customerEmail, innerX, 212, 235);
  row(doc, "DOB:", contract.customerDateOfBirth ? contract.customerDateOfBirth.toISOString().slice(0, 10) : "-", innerX + 255, 212, 220);
  row(doc, "ID Type:", contract.idDocumentNumber ? "Document" : "-", innerX, 230, 235);
  row(doc, "ID Number:", contract.idDocumentNumber, innerX + 255, 230, 220);

  sectionTitle(doc, "Device Information", innerX, 260, sectionWidth);
  row(doc, "Device Type:", contract.deviceType, innerX, 286, 235);
  row(doc, "Brand:", contract.brand, innerX + 255, 286, 220);
  row(doc, "Model:", contract.model, innerX, 304, 235);
  row(doc, "Storage:", contract.storage, innerX + 255, 304, 220);
  row(doc, "IMEI / Serial:", contract.imei || contract.serialNumber, innerX, 322, 235);
  row(doc, "Color:", contract.color, innerX + 255, 322, 220);
  row(doc, "Condition:", contract.condition, innerX, 340, 235);
  row(doc, "Battery Health:", contract.batteryHealth, innerX + 255, 340, 220);
  row(doc, "Accessories:", contract.accessories, innerX, 358, 475);
  row(doc, "Visible Damage:", contract.damageNotes, innerX, 376, 475);

  addPanel(doc, innerX, 410, sectionWidth, 74);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Purchase Details", innerX + 14, 426);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(colors.muted).text("Purchase Price:", innerX + 14, 452);
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Payment Method:", innerX + 14, 468);
  doc.font("Helvetica-Bold").fontSize(25).fillColor(colors.ink).text(money(contract.purchasePrice), innerX + 320, 433, {
    width: 138,
    align: "right"
  });
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(value(contract.paymentMethod), innerX + 320, 466, {
    width: 138,
    align: "right"
  });

  const lowerY = 506;
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

type MoneyLike = { toString: () => string } | number | null | undefined;

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

const moneyValue = (input: MoneyLike) => {
  if (input === null || input === undefined || input === "") return "$0.00";
  return `$${Number(input.toString()).toFixed(2)}`;
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
  const shopName = shopSettings?.name?.trim() || env.SHOP_NAME;
  const shopAddress = shopSettings?.address?.trim() || env.SHOP_ADDRESS;
  const shopPhone = shopSettings?.phone?.trim() || env.SHOP_PHONE;
  const shopEmail = shopSettings?.email?.trim() || env.SHOP_EMAIL;
  const shopOwner = shopSettings?.ownerName?.trim() || env.SHOP_OWNER_NAME;
  const left = page.margin;
  const right = page.width - page.margin;
  const contentWidth = right - left;

  doc.roundedRect(left, 30, contentWidth, 782, 10).fillAndStroke("#ffffff", colors.border);
  if (shopSettings) {
    addShopLogo(doc, left + 20, 54, shopSettings);
  } else {
    addPhoneIcon(doc, left + 20, 54);
  }

  doc.font("Helvetica-Bold").fontSize(18).fillColor(colors.ink).text(shopName, left + 56, 56);
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(shopAddress || "Repair service", left + 56, 78, {
    width: 260
  });
  const contactLine = [shopPhone, shopEmail].filter(Boolean).join(" | ");
  if (contactLine) {
    doc.fontSize(7).text(contactLine, left + 56, 91, { width: 260 });
  }
  if (shopOwner) {
    doc.fontSize(7).text(`Owner / Manager: ${shopOwner}`, left + 56, 103, {
      width: 260
    });
  }

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

  doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink).text(title, left, 126, {
    width: contentWidth,
    align: "center"
  });
};

export const generateRepairOrderPdf = async (
  repairOrder: RepairOrderForPdf,
  shopSettings?: PdfShopSettings
) => {
  const storageDir = getRepairOrderStorageDir(repairOrder.userId, repairOrder.repairOrderNumber);
  await ensureDirectory(storageDir);

  const absolutePdfPath = `${storageDir}/repair-order.pdf`;
  const doc = new PDFDocument({ margin: page.margin, size: "A4" });
  const stream = fs.createWriteStream(absolutePdfPath);
  doc.pipe(stream);

  const left = page.margin;
  const innerX = left + 20;
  const right = page.width - page.margin;
  const sectionWidth = right - left - 40;

  addDocumentHeader(doc, "REPAIR ORDER", "Repair Order No.", repairOrder.repairOrderNumber, repairOrder.createdAt, shopSettings);

  sectionTitle(doc, "Customer Information", innerX, 156, sectionWidth);
  row(doc, "Name:", repairOrder.customerName, innerX, 182, 235);
  row(doc, "Phone:", repairOrder.customerPhone, innerX + 255, 182, 220);
  row(doc, "Email:", repairOrder.customerEmail, innerX, 200, 235);
  row(doc, "Address:", repairOrder.customerAddress, innerX, 218, 475);

  sectionTitle(doc, "Device Information", innerX, 252, sectionWidth);
  row(doc, "Device Type:", repairOrder.deviceType, innerX, 278, 235);
  row(doc, "Brand:", repairOrder.brand, innerX + 255, 278, 220);
  row(doc, "Model:", repairOrder.model, innerX, 296, 235);
  row(doc, "IMEI/Serial:", repairOrder.imeiOrSerial, innerX + 255, 296, 220);
  row(doc, "Password/PIN:", repairOrder.passwordPin, innerX, 314, 235);
  row(doc, "Accessories:", formatAccessoriesReceived(repairOrder.accessoriesReceived), innerX, 332, 475);

  sectionTitle(doc, "Repair Details", innerX, 368, sectionWidth);
  row(doc, "Problem:", repairOrder.problemDescription, innerX, 394, 475);
  row(doc, "Damage:", repairOrder.visibleDamage, innerX, 428, 475);
  row(doc, "Notes:", repairOrder.technicianNotes, innerX, 462, 475);
  row(doc, "Expected:", repairOrder.expectedCompletionDate ? formatDate(repairOrder.expectedCompletionDate) : "-", innerX, 496, 235);
  row(doc, "Status:", repairOrder.status, innerX + 255, 496, 220);

  addPanel(doc, innerX, 536, sectionWidth, 74);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Estimate", innerX + 14, 552);
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted).text("Estimated Price", innerX + 14, 576);
  doc.font("Helvetica").fontSize(7.5).text("Deposit / Advance", innerX + 14, 592);
  doc.font("Helvetica-Bold").fontSize(21).fillColor(colors.ink).text(moneyValue(repairOrder.estimatedPrice), innerX + 302, 558, {
    width: 156,
    align: "right"
  });
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(moneyValue(repairOrder.depositAmount), innerX + 302, 590, {
    width: 156,
    align: "right"
  });

  addPanel(doc, innerX, 642, sectionWidth, 92);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Customer Signature", innerX + 14, 660);
  doc.strokeColor(colors.border).lineWidth(0.8).moveTo(innerX + 14, 706).lineTo(innerX + 226, 706).stroke();
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Signature", innerX + 14, 714);
  doc.strokeColor(colors.border).lineWidth(0.8).moveTo(innerX + 282, 706).lineTo(innerX + 458, 706).stroke();
  doc.font("Helvetica").fontSize(7).fillColor(colors.muted).text("Date", innerX + 282, 714);

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.blue).text("Thank you for your business!", left, 793, {
    width: right - left,
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

  addDocumentHeader(doc, "INVOICE", "Invoice No.", invoice.invoiceNumber, invoice.invoiceDate, shopSettings);

  sectionTitle(doc, "Customer Information", innerX, 156, sectionWidth);
  row(doc, "Name:", invoice.customerName, innerX, 182, 235);
  row(doc, "Phone:", invoice.customerPhone, innerX + 255, 182, 220);
  row(doc, "Address:", invoice.customerAddress, innerX, 200, 475);
  row(doc, "Email:", invoice.customerEmail, innerX, 218, 235);
  row(doc, "Payment:", invoice.paymentMethod, innerX + 255, 218, 220);
  row(doc, "Status:", invoice.paymentStatus, innerX + 255, 236, 220);

  if (invoice.deviceSummary || invoice.repairSummary) {
    sectionTitle(doc, "Repair Reference", innerX, 268, sectionWidth);
    row(doc, "Device:", invoice.deviceSummary, innerX, 294, 475);
    row(doc, "Repair:", invoice.repairSummary, innerX, 312, 475);
  }

  const tableY = 354;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink);
  doc.text("Description", innerX, tableY, { width: 210 });
  doc.text("Qty", innerX + 220, tableY, { width: 38, align: "right" });
  doc.text("Unit", innerX + 268, tableY, { width: 62, align: "right" });
  doc.text("VAT %", innerX + 340, tableY, { width: 48, align: "right" });
  doc.text("Total", innerX + 398, tableY, { width: 76, align: "right" });
  doc.strokeColor(colors.border).moveTo(innerX, tableY + 16).lineTo(innerX + sectionWidth, tableY + 16).stroke();

  let y = tableY + 26;
  invoice.items.slice(0, 14).forEach((item) => {
    doc.font("Helvetica").fontSize(7.4).fillColor(colors.ink);
    doc.text(value(item.description), innerX, y, { width: 210, ellipsis: true });
    doc.text(numericValue(item.quantity), innerX + 220, y, { width: 38, align: "right" });
    doc.text(moneyValue(item.unitPrice), innerX + 268, y, { width: 62, align: "right" });
    doc.text(numericValue(item.vatPercent), innerX + 340, y, { width: 48, align: "right" });
    doc.text(moneyValue(item.lineTotal), innerX + 398, y, { width: 76, align: "right" });
    y += 20;
  });

  doc.strokeColor(colors.border).moveTo(innerX, y + 4).lineTo(innerX + sectionWidth, y + 4).stroke();
  y += 22;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.ink).text("VAT Breakdown", innerX, y);
  y += 16;
  const vatBreakdown = new Map<string, { net: number; vat: number }>();
  invoice.items.forEach((item) => {
    const key = numericValue(item.vatPercent);
    const current = vatBreakdown.get(key) ?? { net: 0, vat: 0 };
    current.net += Number(item.lineNet?.toString() ?? 0);
    current.vat += Number(item.lineVat?.toString() ?? 0);
    vatBreakdown.set(key, current);
  });
  Array.from(vatBreakdown.entries()).forEach(([percent, totals]) => {
    doc.font("Helvetica").fontSize(7.4).fillColor(colors.muted).text(`${percent}% VAT on ${moneyValue(totals.net)}: ${moneyValue(totals.vat)}`, innerX, y, {
      width: 260
    });
    y += 14;
  });

  const net = invoice.netAmountOverride ?? invoice.calculatedNetAmount;
  const vat = invoice.vatAmountOverride ?? invoice.calculatedVatAmount;
  const gross = invoice.grossTotalOverride ?? invoice.calculatedGrossTotal;
  const totalsX = innerX + 306;
  addPanel(doc, totalsX, Math.max(574, y - 60), 168, 94);
  const totalsY = Math.max(590, y - 44);
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("Net Amount", totalsX + 14, totalsY);
  doc.font("Helvetica").fontSize(8).text("VAT Amount", totalsX + 14, totalsY + 20);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Gross Total", totalsX + 14, totalsY + 44);
  doc.font("Helvetica").fontSize(8).fillColor(colors.ink).text(moneyValue(net), totalsX + 86, totalsY, { width: 62, align: "right" });
  doc.text(moneyValue(vat), totalsX + 86, totalsY + 20, { width: 62, align: "right" });
  doc.font("Helvetica-Bold").fontSize(10).text(moneyValue(gross), totalsX + 86, totalsY + 44, { width: 62, align: "right" });

  if (invoice.notes) {
    sectionTitle(doc, "Notes", innerX, 704, sectionWidth);
    doc.font("Helvetica").fontSize(7.5).fillColor(colors.ink).text(invoice.notes, innerX, 730, {
      width: sectionWidth,
      height: 42,
      ellipsis: true
    });
  }

  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.blue).text("Thank you for your business!", left, 793, {
    width: right - left,
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

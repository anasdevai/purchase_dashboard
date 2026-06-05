import fs from "node:fs";
import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { ensureDirectory, getContractStorageDir, toAbsolutePath, toRelativeStoragePath } from "../utils/paths.js";

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

  if (!absolutePath.toLowerCase().endsWith(".png")) {
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

import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { toAbsolutePath } from "../utils/paths.js";
import { HttpError } from "../utils/httpError.js";
import fs from "node:fs";

import dotenv from "dotenv";

const getTransporter = () => {
  dotenv.config({ override: true });
  const host = process.env.SMTP_HOST || env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 1025);
  const secure = port === 465;

  const config: Record<string, unknown> = {
    host,
    port,
    secure
  };

  const user = process.env.SMTP_USER !== undefined ? process.env.SMTP_USER : env.SMTP_USER;
  const pass = process.env.SMTP_PASS !== undefined ? process.env.SMTP_PASS : env.SMTP_PASS;

  if (user) {
    config.auth = {
      user,
      pass
    };
  }

  return nodemailer.createTransport(config as any);
};

const buildGermanGreeting = (
  customerName?: string | null,
  salutation?: string | null,
  lastName?: string | null
) => {
  if (salutation && lastName) {
    const title = salutation.toLowerCase() === "mr" || salutation.toLowerCase() === "herr" ? "Herr" :
                  salutation.toLowerCase() === "ms" || salutation.toLowerCase() === "frau" ? "Frau" : "";
    if (title) {
      const greetingWord = title === "Frau" ? "Sehr geehrte" : "Sehr geehrter";
      return `${greetingWord} ${title} ${lastName.trim()}`;
    }
  }
  if (customerName && customerName.trim()) {
    return `Sehr geehrte(r) ${customerName.trim()}`;
  }
  return "Sehr geehrte Damen und Herren";
};

export const sendContractPdfEmail = async (
  toEmail: string,
  contractNumber: string,
  pdfPath: string | null | undefined,
  customerName?: string | null,
  salutation?: string | null,
  lastName?: string | null
) => {
  if (!pdfPath) {
    throw new HttpError(400, "PDF path does not exist for this contract");
  }

  const absolutePath = toAbsolutePath(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    throw new HttpError(404, "PDF file not found on disk");
  }

  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName, salutation, lastName);

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Kaufvertrag - ${contractNumber}`,
    text: `${greeting},\n\nanbei erhalten Sie eine PDF-Kopie Ihres Kaufvertrags ${contractNumber}.\n\nVielen Dank für Ihr Vertrauen und die angenehme Zusammenarbeit!\n\nMit freundlichen Grüßen,\nIhr Shop-Team`,
    attachments: [
      {
        filename: `${contractNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

export const sendRepairOrderPdfEmail = async (
  toEmail: string,
  repairOrderNumber: string,
  pdfPath: string | null | undefined,
  customerName?: string | null
) => {
  if (!pdfPath) {
    throw new HttpError(400, "PDF path does not exist for this repair order");
  }

  const absolutePath = toAbsolutePath(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    throw new HttpError(404, "PDF file not found on disk");
  }

  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Reparaturauftrag - ${repairOrderNumber}`,
    text: `${greeting},\n\nanbei senden wir Ihnen die Bestätigung und Details zu Ihrem Reparaturauftrag ${repairOrderNumber} als PDF-Anhang.\n\nWir informieren Sie umgehend, sobald Ihr Gerät fertiggestellt und zur Abholung bereit ist.\n\nMit freundlichen Grüßen,\nIhr Service-Team`,
    attachments: [
      {
        filename: `${repairOrderNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

export const sendInvoicePdfEmail = async (
  toEmail: string,
  invoiceNumber: string,
  pdfPath: string | null | undefined,
  customerName?: string | null
) => {
  if (!pdfPath) {
    throw new HttpError(400, "PDF path does not exist for this invoice");
  }

  const absolutePath = toAbsolutePath(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    throw new HttpError(404, "PDF file not found on disk");
  }

  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Rechnung - ${invoiceNumber}`,
    text: `${greeting},\n\nanbei erhalten Sie Ihre Rechnung ${invoiceNumber} zu Ihrem Serviceauftrag.\n\nVielen Dank für Ihren Auftrag!\n\nMit freundlichen Grüßen,\nIhr Service-Team`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

export const sendQuotationPdfEmail = async (
  toEmail: string,
  quotationNumber: string,
  pdfPath: string | null | undefined,
  customerName?: string | null
) => {
  if (!pdfPath) {
    throw new HttpError(400, "PDF path does not exist for this quotation");
  }

  const absolutePath = toAbsolutePath(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    throw new HttpError(404, "PDF file not found on disk");
  }

  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Angebot - ${quotationNumber}`,
    text: `${greeting},\n\nanbei erhalten Sie das gewünschte Angebot ${quotationNumber} als PDF-Anhang.\n\nDas Angebot ist 14 Tage gültig. Bei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\nIhr Shop-Team`,
    attachments: [
      {
        filename: `${quotationNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

export const sendRepairFinishedEmail = async (
  toEmail: string,
  repairOrderNumber: string,
  customerName?: string | null
) => {
  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Reparatur fertiggestellt - ${repairOrderNumber}`,
    text: `${greeting},\n\ndie Reparatur an Ihrem Gerät für den Auftrag ${repairOrderNumber} wurde erfolgreich abgeschlossen und die Qualitätsprüfung durchgeführt.\n\nWir bereiten das Gerät nun zur Abholung vor.\n\nMit freundlichen Grüßen,\nIhr Service-Team`
  };

  await transporter.sendMail(mailOptions);
};

export const sendReadyForPickupEmail = async (
  toEmail: string,
  repairOrderNumber: string,
  customerName?: string | null,
  shopAddress?: string | null,
  openingHours?: string | null
) => {
  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);

  let addressInfo = "";
  if (shopAddress) {
    addressInfo = `\n\nAbholadresse:\n${shopAddress}`;
  }
  let hoursInfo = "";
  if (openingHours) {
    hoursInfo = `\nÖffnungszeiten:\n${openingHours}`;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Bereit zur Abholung - ${repairOrderNumber}`,
    text: `${greeting},\n\nIhr Gerät für den Reparaturauftrag ${repairOrderNumber} ist fertiggestellt und steht zur Abholung bereit.${addressInfo}${hoursInfo}\n\nBitte bringen Sie diesen Beleg oder Ihren Ausweis zur Abholung mit.\n\nMit freundlichen Grüßen,\nIhr Service-Team`
  };

  await transporter.sendMail(mailOptions);
};

export const sendSparePartArrivedNotification = async (
  employeeEmail: string,
  repairOrderNumber: string
) => {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: employeeEmail,
    subject: `Ersatzteil eingetroffen - ${repairOrderNumber}`,
    text: `Hallo,\n\ndas Ersatzteil für den Reparaturauftrag ${repairOrderNumber} ist eingetroffen.\n\nBitte bearbeiten Sie den Auftrag, sobald das Gerät zur Reparatur bereitsteht.\n\nMit freundlichen Grüßen,\nSystem-Benachrichtigung`
  };

  await transporter.sendMail(mailOptions);
};

export const sendPaymentReminderEmail = async (
  toEmail: string,
  invoiceNumber: string,
  grossTotal: any,
  customerName?: string | null
) => {
  const transporter = getTransporter();
  const greeting = buildGermanGreeting(customerName);
  const amount = Number(grossTotal).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || env.SMTP_FROM,
    to: toEmail,
    subject: `Zahlungserinnerung – Rechnung ${invoiceNumber}`,
    text: `${greeting},\n\nwir möchten Sie freundlich an die offene Zahlung der Rechnung ${invoiceNumber} über ${amount} erinnern.\n\nBitte überweisen Sie den Betrag so bald wie möglich.\n\nMit freundlichen Grüßen,\nIhr Shop-Team`,
  });
};

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
    text: `Guten Tag,\n\nvielen Dank für Ihren Auftrag.\nAnbei erhalten Sie die Rechnung zu den durchgeführten Leistungen. Wir bedanken uns für Ihr Vertrauen und freuen uns, dass wir Ihnen weiterhelfen durften.\n\nBei Fragen zur Rechnung oder zu unseren Leistungen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir würden uns sehr über eine Bewertung freuen.\n\nMit freundlichen Grüßen`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

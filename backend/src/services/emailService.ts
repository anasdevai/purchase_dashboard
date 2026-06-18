import fs from "node:fs";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { toAbsolutePath } from "../utils/paths.js";

const getTransporter = () => {
  const port = env.SMTP_PORT;
  const secure = port === 465;

  const config: Record<string, unknown> = {
    host: env.SMTP_HOST,
    port,
    secure
  };

  if (env.SMTP_USER) {
    config.auth = {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    };
  }

  return nodemailer.createTransport(config as nodemailer.TransportOptions);
};

const buildGermanGreeting = (
  customerName?: string | null,
  salutation?: string | null,
  lastName?: string | null
) => {
  if (salutation && lastName) {
    const title =
      salutation.toLowerCase() === "mr" || salutation.toLowerCase() === "herr"
        ? "Herr"
        : salutation.toLowerCase() === "ms" || salutation.toLowerCase() === "frau"
          ? "Frau"
          : "";
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

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `Kaufvertrag - ${contractNumber}`,
    text: `${greeting},\n\nanbei erhalten Sie eine PDF-Kopie Ihres Kaufvertrags ${contractNumber}.\n\nVielen Dank für Ihr Vertrauen und die angenehme Zusammenarbeit!\n\nMit freundlichen Grüßen,\nIhr Shop-Team`,
    attachments: [
      {
        filename: `${contractNumber}.pdf`,
        path: absolutePath
      }
    ]
  });
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

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `Reparaturauftrag - ${repairOrderNumber}`,
    text: `${buildGermanGreeting(customerName)},\n\nanbei senden wir Ihnen die Bestätigung und Details zu Ihrem Reparaturauftrag ${repairOrderNumber} als PDF-Anhang.\n\nWir informieren Sie umgehend, sobald Ihr Gerät fertiggestellt und zur Abholung bereit ist.\n\nMit freundlichen Grüßen,\nIhr Service-Team`,
    attachments: [
      {
        filename: `${repairOrderNumber}.pdf`,
        path: absolutePath
      }
    ]
  });
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

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `Rechnung - ${invoiceNumber}`,
    text: `${buildGermanGreeting(customerName)},\n\nanbei erhalten Sie Ihre Rechnung ${invoiceNumber} zu Ihrem Serviceauftrag.\n\nVielen Dank für Ihren Auftrag!\n\nMit freundlichen Grüßen,\nIhr Service-Team`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        path: absolutePath
      }
    ]
  });
};

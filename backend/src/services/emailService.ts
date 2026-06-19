import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { toAbsolutePath } from "../utils/paths.js";
import { HttpError } from "../utils/httpError.js";
import fs from "node:fs";
import dotenv from "dotenv";
import { prisma } from "../config/prisma.js";
import { decrypt } from "../utils/crypto.js";

const getTransporterForUser = async (userId: string) => {
  const smtpSettings = await prisma.smtpSettings.findUnique({
    where: { userId }
  });

  if (smtpSettings) {
    const password = decrypt(smtpSettings.password);
    const secure = smtpSettings.encryption === "SSL" || (smtpSettings.encryption === "TLS" && smtpSettings.port === 465);
    return {
      transporter: nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure,
        auth: {
          user: smtpSettings.username,
          pass: password
        }
      }),
      from: smtpSettings.username
    };
  }

  // Fallback to environment variables
  dotenv.config({ override: true });
  const host = process.env.SMTP_HOST || env.SMTP_HOST || "localhost";
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

  return {
    transporter: nodemailer.createTransport(config as any),
    from: process.env.SMTP_FROM || env.SMTP_FROM || "noreply@sclera.io"
  };
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

const getFirstAndLastName = (name?: string | null) => {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const formatEuro = (amount: any) => {
  if (amount === undefined || amount === null) return "0,00 €";
  return Number(amount).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
};

const formatDate = (date?: Date | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const compileTemplate = (subject: string, body: string, placeholders: Record<string, string>) => {
  let compiledSubject = subject;
  let compiledBody = body;
  for (const [key, val] of Object.entries(placeholders)) {
    const regex = new RegExp(`{${key}}`, "g");
    compiledSubject = compiledSubject.replace(regex, val || "");
    compiledBody = compiledBody.replace(regex, val || "");
  }
  return { subject: compiledSubject, body: compiledBody };
};

const sendMailAndLog = async (
  userId: string,
  toEmail: string,
  mailOptions: nodemailer.SendMailOptions,
  transporter: nodemailer.Transporter
) => {
  let status = "Sent";
  let errorMsg: string | null = null;
  try {
    await transporter.sendMail(mailOptions);
  } catch (err: any) {
    status = "Failed";
    errorMsg = err.message || String(err);
    throw err;
  } finally {
    try {
      await prisma.emailLog.create({
        data: {
          userId,
          to: toEmail,
          subject: (mailOptions.subject || "") as string,
          body: (mailOptions.text || mailOptions.html || "") as string,
          status,
          error: errorMsg,
        }
      });
    } catch (logErr) {
      console.error("Failed to write email log to database:", logErr);
    }
  }
};

export const sendContractPdfEmail = async (
  userId: string,
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

  const { transporter, from } = await getTransporterForUser(userId);
  const greeting = buildGermanGreeting(customerName, salutation, lastName);

  const mailOptions = {
    from,
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

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendRepairOrderPdfEmail = async (
  userId: string,
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

  const { transporter, from } = await getTransporterForUser(userId);

  const repairOrder = await prisma.repairOrder.findFirst({
    where: { userId, repairOrderNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || repairOrder?.customerName);
  const device = repairOrder ? `${repairOrder.brand || ""} ${repairOrder.model}`.trim() : "";
  const priceStr = repairOrder ? formatEuro(repairOrder.estimatedPrice) : "0,00 €";
  const dateStr = repairOrder ? formatDate(repairOrder.createdAt) : formatDate(new Date());

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: repairOrderNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "OrderConfirmation" }
  });

  let subject = `Reparaturauftrag - ${repairOrderNumber}`;
  let text = `${buildGermanGreeting(customerName || repairOrder?.customerName)},\n\nanbei senden wir Ihnen die Bestätigung und Details zu Ihrem Reparaturauftrag ${repairOrderNumber} als PDF-Anhang.\n\nWir informieren Sie umgehend, sobald Ihr Gerät fertiggestellt und zur Abholung bereit ist.\n\nMit freundlichen Grüßen,\nIhr Service-Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text,
    attachments: [
      {
        filename: `${repairOrderNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendInvoicePdfEmail = async (
  userId: string,
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

  const { transporter, from } = await getTransporterForUser(userId);

  const invoice = await prisma.invoice.findFirst({
    where: { userId, invoiceNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || invoice?.customerName);
  const device = invoice?.deviceSummary || "";
  const priceStr = invoice ? formatEuro(invoice.calculatedGrossTotal) : "0,00 €";
  const dateStr = invoice ? formatDate(invoice.invoiceDate) : formatDate(new Date());
  const link = invoice ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/invoices/${invoice.id}` : "";

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: invoiceNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: link
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "Invoice" }
  });

  let subject = `Rechnung - ${invoiceNumber}`;
  let text = `Guten Tag,\n\nvielen Dank für Ihren Auftrag.\nAnbei erhalten Sie die Rechnung zu den durchgeführten Leistungen. Wir bedanken uns für Ihr Vertrauen und freuen uns, dass wir Ihnen weiterhelfen durften.\n\nBei Fragen zur Rechnung oder zu unseren Leistungen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir würden uns sehr über eine Bewertung freuen.\n\nMit freundlichen Grüßen`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendQuotationPdfEmail = async (
  userId: string,
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

  const { transporter, from } = await getTransporterForUser(userId);

  const quotation = await prisma.quotation.findFirst({
    where: { userId, quotationNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || quotation?.customerName);
  const device = quotation ? `${quotation.brand || ""} ${quotation.model}`.trim() : "";
  
  let priceStr = "0,00 €";
  if (quotation) {
    const items = await prisma.quotationItem.findMany({
      where: { quotationId: quotation.id }
    });
    const total = items.reduce((acc, item) => acc + Number(item.lineTotal), 0);
    priceStr = formatEuro(total);
  }

  const dateStr = quotation ? formatDate(quotation.createdAt) : formatDate(new Date());

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: quotationNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "Quotation" }
  });

  let subject = `Angebot - ${quotationNumber}`;
  let text = `Guten Tag,\n\nvielen Dank für Ihre Anfrage.\nAnbei erhalten Sie Ihr persönliches Angebot. Bitte prüfen Sie die enthaltenen Leistungen und Preise. Sollten Sie Fragen haben oder Änderungen wünschen, stehen wir Ihnen gerne zur Verfügung.\n\nNach Ihrer Freigabe können wir die Arbeiten umgehend einplanen und durchführen.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text,
    attachments: [
      {
        filename: `${quotationNumber}.pdf`,
        path: absolutePath
      }
    ]
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendRepairFinishedEmail = async (
  userId: string,
  toEmail: string,
  repairOrderNumber: string,
  customerName?: string | null
) => {
  const { transporter, from } = await getTransporterForUser(userId);
  const greeting = buildGermanGreeting(customerName);

  const mailOptions = {
    from,
    to: toEmail,
    subject: `Reparatur fertiggestellt - ${repairOrderNumber}`,
    text: `${greeting},\n\ndie Reparatur an Ihrem Gerät für den Auftrag ${repairOrderNumber} wurde erfolgreich abgeschlossen und die Qualitätsprüfung durchgeführt.\n\nWir bereiten das Gerät nun zur Abholung vor.\n\nMit freundlichen Grüßen,\nIhr Service-Team`
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendReadyForPickupEmail = async (
  userId: string,
  toEmail: string,
  repairOrderNumber: string,
  customerName?: string | null,
  shopAddress?: string | null,
  openingHours?: string | null
) => {
  const { transporter, from } = await getTransporterForUser(userId);

  const repairOrder = await prisma.repairOrder.findFirst({
    where: { userId, repairOrderNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || repairOrder?.customerName);
  const device = repairOrder ? `${repairOrder.brand || ""} ${repairOrder.model}`.trim() : "";
  const priceStr = repairOrder ? formatEuro(repairOrder.estimatedPrice) : "0,00 €";
  const dateStr = repairOrder ? formatDate(repairOrder.updatedAt) : formatDate(new Date());

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: repairOrderNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "ReadyForPickup" }
  });

  let addressInfo = "";
  if (shopAddress) {
    addressInfo = `\n\nAbholadresse:\n${shopAddress}`;
  }
  let hoursInfo = "";
  if (openingHours) {
    hoursInfo = `\nÖffnungszeiten:\n${openingHours}`;
  }

  let subject = `Bereit zur Abholung - ${repairOrderNumber}`;
  let text = `${buildGermanGreeting(customerName || repairOrder?.customerName)},\n\nIhr Gerät für den Reparaturauftrag ${repairOrderNumber} ist fertiggestellt und steht zur Abholung bereit.${addressInfo}${hoursInfo}\n\nBitte bringen Sie diesen Beleg oder Ihren Ausweis zur Abholung mit.\n\nMit freundlichen Grüßen,\nIhr Service-Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendSparePartArrivedNotification = async (
  userId: string,
  employeeEmail: string,
  repairOrderNumber: string
) => {
  const { transporter, from } = await getTransporterForUser(userId);

  const mailOptions = {
    from,
    to: employeeEmail,
    subject: `Ersatzteil eingetroffen - ${repairOrderNumber}`,
    text: `Hallo,\n\ndas Ersatzteil für den Reparaturauftrag ${repairOrderNumber} ist eingetroffen.\n\nBitte bearbeiten Sie den Auftrag, sobald das Gerät zur Reparatur bereitsteht.\n\nMit freundlichen Grüßen,\nSystem-Benachrichtigung`
  };

  await sendMailAndLog(userId, employeeEmail, mailOptions, transporter);
};

export const sendPaymentReminderEmail = async (
  userId: string,
  toEmail: string,
  invoiceNumber: string,
  grossTotal: any,
  customerName?: string | null
) => {
  const { transporter, from } = await getTransporterForUser(userId);

  const invoice = await prisma.invoice.findFirst({
    where: { userId, invoiceNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || invoice?.customerName);
  const device = invoice?.deviceSummary || "";
  const priceStr = formatEuro(grossTotal);
  const dateStr = invoice?.dueDate ? formatDate(invoice.dueDate) : formatDate(new Date());
  const link = invoice ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/invoices/${invoice.id}` : "";

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: invoiceNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: link
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "PaymentReminder" }
  });

  let subject = `Zahlungserinnerung – Rechnung ${invoiceNumber}`;
  let text = `${buildGermanGreeting(customerName || invoice?.customerName)},\n\nwir möchten Sie freundlich an die offene Zahlung der Rechnung ${invoiceNumber} über ${priceStr} erinnern.\n\nBitte überweisen Sie den Betrag so bald wie möglich.\n\nMit freundlichen Grüßen,\nIhr Shop-Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendPickupReminderEmail = async (
  userId: string,
  toEmail: string,
  repairOrderNumber: string,
  customerName?: string | null,
  deviceName?: string | null,
  daysReady = 3
) => {
  const { transporter, from } = await getTransporterForUser(userId);

  const repairOrder = await prisma.repairOrder.findFirst({
    where: { userId, repairOrderNumber }
  });

  const { firstName, lastName } = getFirstAndLastName(customerName || repairOrder?.customerName);
  const device = deviceName || (repairOrder ? `${repairOrder.brand || ""} ${repairOrder.model}`.trim() : "");
  const priceStr = repairOrder ? formatEuro(repairOrder.estimatedPrice) : "0,00 €";
  const dateStr = repairOrder ? formatDate(repairOrder.updatedAt) : formatDate(new Date());

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    ORDER_NUMBER: repairOrderNumber,
    DEVICE: device,
    PRICE: priceStr,
    DATE: dateStr,
    LINK: ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "PickupReminder" }
  });

  let subject = `Erinnerung: Ihr Gerät ist abholbereit - ${repairOrderNumber}`;
  let text = `${buildGermanGreeting(customerName || repairOrder?.customerName)},\n\ndies ist eine freundliche Erinnerung, dass Ihr Gerät (${device}) für den Reparaturauftrag ${repairOrderNumber} bereits seit ${daysReady} Tagen zur Abholung bereitsteht.\n\nBitte holen Sie das Gerät baldmöglichst ab.\n\nMit freundlichen Grüßen,\nIhr Service-Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendAppointmentConfirmationEmail = async (
  userId: string,
  toEmail: string,
  appointment: {
    title: string;
    startTime: Date;
    endTime: Date;
    customerName?: string | null;
    deviceSummary?: string | null;
    repairOrderNumber?: string | null;
  }
) => {
  const { transporter, from } = await getTransporterForUser(userId);
  const { firstName, lastName } = getFirstAndLastName(appointment.customerName);
  
  const startStr = new Date(appointment.startTime).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    TITLE: appointment.title,
    DATE_TIME: startStr,
    DEVICE: appointment.deviceSummary || "",
    ORDER_NUMBER: appointment.repairOrderNumber || ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "AppointmentConfirmation" }
  });

  let subject = `Terminbestätigung: ${appointment.title}`;
  let text = `${buildGermanGreeting(appointment.customerName)},\n\nhiermit bestätigen wir Ihren Termin für "${appointment.title}" am ${startStr} Uhr.\n\nWir freuen uns auf Ihren Besuch.\n\nMit freundlichen Grüßen,\nIhr Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

export const sendAppointmentReminderEmail = async (
  userId: string,
  toEmail: string,
  appointment: {
    title: string;
    startTime: Date;
    endTime: Date;
    customerName?: string | null;
    deviceSummary?: string | null;
    repairOrderNumber?: string | null;
  }
) => {
  const { transporter, from } = await getTransporterForUser(userId);
  const { firstName, lastName } = getFirstAndLastName(appointment.customerName);
  
  const startStr = new Date(appointment.startTime).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const placeholders = {
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_LAST_NAME: lastName,
    TITLE: appointment.title,
    DATE_TIME: startStr,
    DEVICE: appointment.deviceSummary || "",
    ORDER_NUMBER: appointment.repairOrderNumber || ""
  };

  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name: "AppointmentReminder" }
  });

  let subject = `Erinnerung: Ihr Termin am ${startStr}`;
  let text = `${buildGermanGreeting(appointment.customerName)},\n\ndies ist eine freundliche Erinnerung an Ihren bevorstehenden Termin für "${appointment.title}" am ${startStr} Uhr.\n\nSollten Sie den Termin nicht wahrnehmen können, geben Sie uns bitte Bescheid.\n\nMit freundlichen Grüßen,\nIhr Team`;

  if (template) {
    const compiled = compileTemplate(template.subject, template.body, placeholders);
    subject = compiled.subject;
    text = compiled.body;
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text
  };

  await sendMailAndLog(userId, toEmail, mailOptions, transporter);
};

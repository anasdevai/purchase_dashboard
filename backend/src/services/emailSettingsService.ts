import { prisma } from "../config/prisma.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import {
  smtpSettingsSchema,
  imapSettingsSchema,
  emailTemplateSchema,
} from "../validators/emailSettingsValidators.js";
import nodemailer from "nodemailer";
import { HttpError } from "../utils/httpError.js";

export const getSmtpSettings = async (userId: string) => {
  const settings = await prisma.smtpSettings.findUnique({
    where: { userId },
  });
  if (!settings) {
    const host = process.env.SMTP_HOST || "";
    const port = Number(process.env.SMTP_PORT || 1025);
    const username = process.env.SMTP_USER || "";
    const hasPassword = !!process.env.SMTP_PASS;
    const encryption = port === 465 ? "SSL" : port === 587 ? "TLS" : "none";

    if (!host && !username) {
      return null;
    }

    return {
      host,
      port,
      encryption,
      username,
      hasPassword,
    };
  }
  return {
    host: settings.host,
    port: settings.port,
    encryption: settings.encryption,
    username: settings.username,
    hasPassword: true,
  };
};

export const saveSmtpSettings = async (userId: string, input: Record<string, unknown>) => {
  const parsed = smtpSettingsSchema.parse(input);

  const existing = await prisma.smtpSettings.findUnique({
    where: { userId },
  });

  let encryptedPassword = "";
  if (parsed.password) {
    encryptedPassword = encrypt(parsed.password);
  } else if (existing) {
    encryptedPassword = existing.password;
  } else {
    throw new HttpError(400, "Password is required for initial SMTP setup");
  }

  const settings = await prisma.smtpSettings.upsert({
    where: { userId },
    create: {
      userId,
      host: parsed.host,
      port: parsed.port,
      encryption: parsed.encryption,
      username: parsed.username,
      password: encryptedPassword,
    },
    update: {
      host: parsed.host,
      port: parsed.port,
      encryption: parsed.encryption,
      username: parsed.username,
      password: encryptedPassword,
    },
  });

  return {
    host: settings.host,
    port: settings.port,
    encryption: settings.encryption,
    username: settings.username,
    hasPassword: true,
  };
};

export const getImapSettings = async (userId: string) => {
  const settings = await prisma.imapSettings.findUnique({
    where: { userId },
  });
  if (!settings) return null;
  return {
    host: settings.host,
    port: settings.port,
    encryption: settings.encryption,
    username: settings.username,
    hasPassword: true,
  };
};

export const saveImapSettings = async (userId: string, input: Record<string, unknown>) => {
  const parsed = imapSettingsSchema.parse(input);

  const existing = await prisma.imapSettings.findUnique({
    where: { userId },
  });

  let encryptedPassword = "";
  if (parsed.password) {
    encryptedPassword = encrypt(parsed.password);
  } else if (existing) {
    encryptedPassword = existing.password;
  } else {
    throw new HttpError(400, "Password is required for initial IMAP setup");
  }

  const settings = await prisma.imapSettings.upsert({
    where: { userId },
    create: {
      userId,
      host: parsed.host,
      port: parsed.port,
      encryption: parsed.encryption,
      username: parsed.username,
      password: encryptedPassword,
    },
    update: {
      host: parsed.host,
      port: parsed.port,
      encryption: parsed.encryption,
      username: parsed.username,
      password: encryptedPassword,
    },
  });

  return {
    host: settings.host,
    port: settings.port,
    encryption: settings.encryption,
    username: settings.username,
    hasPassword: true,
  };
};

export const getEmailTemplates = async (userId: string) => {
  return prisma.emailTemplate.findMany({
    where: { userId },
  });
};

export const saveEmailTemplate = async (userId: string, input: Record<string, unknown>) => {
  const parsed = emailTemplateSchema.parse(input);

  return prisma.emailTemplate.upsert({
    where: {
      userId_name: {
        userId,
        name: parsed.name,
      },
    },
    create: {
      userId,
      name: parsed.name,
      subject: parsed.subject,
      body: parsed.body,
    },
    update: {
      subject: parsed.subject,
      body: parsed.body,
    },
  });
};

export const getEmailLogs = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailLog.count({
      where: { userId },
    }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const testSmtpConnection = async (userId: string, testEmail: string) => {
  const settings = await prisma.smtpSettings.findUnique({
    where: { userId },
  });

  let transporter: nodemailer.Transporter;

  if (settings) {
    const password = decrypt(settings.password);
    const secure = settings.encryption === "SSL" || (settings.encryption === "TLS" && settings.port === 465);

    transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure,
      auth: {
        user: settings.username,
        pass: password,
      },
    });
  } else {
    const host = process.env.SMTP_HOST || "localhost";
    const port = Number(process.env.SMTP_PORT || 1025);
    const secure = port === 465;
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";

    const config: any = { host, port, secure };
    if (user) config.auth = { user, pass };
    transporter = nodemailer.createTransport(config);
  }

  const from = settings?.username || process.env.SMTP_FROM || "noreply@sclera.io";

  await transporter.verify();

  await transporter.sendMail({
    from,
    to: testEmail,
    subject: "Test-E-Mail: SMTP-Verbindung erfolgreich",
    text: "Hallo!\n\nDies ist eine Test-E-Mail, um die SMTP-Einstellungen Ihrer Anwendung zu überprüfen.\n\nDie Verbindung wurde erfolgreich hergestellt!\n\nMit freundlichen Grüßen,\nIhr System",
  });

  return { success: true };
};

export const previewCompiledTemplate = async (userId: string, name: string) => {
  const template = await prisma.emailTemplate.findFirst({
    where: { userId, name },
  });

  const dummyPlaceholders: Record<string, string> = {
    CUSTOMER_FIRST_NAME: "Max",
    CUSTOMER_LAST_NAME: "Mustermann",
    ORDER_NUMBER: "RO-2026-1004",
    DEVICE: "iPhone 14 (128GB, Space Gray)",
    PRICE: "199,00 €",
    DATE: "19.06.2026",
    LINK: "https://pay.example.com/invoice/INV-2026-1002",
  };

  const subject = template?.subject || `Standard template for ${name}`;
  const body = template?.body || `Hier ist die Standardvorlage für ${name} mit Placeholder: {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME}.`;

  const compileText = (text: string) => {
    let result = text;
    for (const [key, val] of Object.entries(dummyPlaceholders)) {
      result = result.replace(new RegExp(`{${key}}`, "g"), val);
    }
    return result;
  };

  return {
    name,
    subject: compileText(subject),
    body: compileText(body),
  };
};

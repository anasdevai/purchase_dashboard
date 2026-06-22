import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { decrypt } from "./crypto.js";

type SmtpEncryption = "none" | "SSL" | "TLS" | "STARTTLS";

const buildTransportOptions = (
  host: string,
  port: number,
  encryption: SmtpEncryption,
  username?: string,
  password?: string
): SMTPTransport.Options => {
  const secure = encryption === "SSL" || port === 465;
  const useStartTls =
    encryption === "TLS" ||
    encryption === "STARTTLS" ||
    (port === 587 && encryption !== "none");

  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
  };

  if (useStartTls && !secure) {
    options.requireTLS = true;
  }

  if (username) {
    options.auth = {
      user: username,
      pass: password ?? "",
    };
  }

  return options;
};

export const getSmtpMailerForUser = async (userId: string) => {
  const smtpSettings = await prisma.smtpSettings.findUnique({
    where: { userId },
  });

  if (smtpSettings) {
    try {
      const password = decrypt(smtpSettings.password);
      const encryption = smtpSettings.encryption as SmtpEncryption;
      const transporter = nodemailer.createTransport(
        buildTransportOptions(
          smtpSettings.host,
          smtpSettings.port,
          encryption,
          smtpSettings.username,
          password
        )
      );

      return {
        transporter,
        from: env.SMTP_FROM || smtpSettings.username,
      };
    } catch (error) {
      console.warn("[email] Saved SMTP settings could not be used; falling back to env:", error);
    }
  }

  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const username = env.SMTP_USER?.trim() || undefined;
  const password = env.SMTP_PASS || undefined;
  const encryption: SmtpEncryption = port === 465 ? "SSL" : port === 587 ? "TLS" : "none";

  const transporter = nodemailer.createTransport(
    buildTransportOptions(host, port, encryption, username, password)
  );

  return {
    transporter,
    from: env.SMTP_FROM || username || "noreply@sclera.io",
  };
};

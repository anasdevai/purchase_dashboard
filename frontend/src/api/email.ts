import { apiRequest } from "./client";
import type {
  SmtpSettings,
  ImapSettings,
  EmailTemplate,
  EmailSettingsPayload,
  EmailLogsResponse,
  EmailTemplateName,
} from "../types/email";

export async function fetchEmailSettings() {
  return apiRequest<EmailSettingsPayload>("/api/settings/email");
}

export async function saveSmtpSettings(settings: SmtpSettings) {
  return apiRequest<{ smtp: SmtpSettings }>("/api/settings/email/smtp", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function saveImapSettings(settings: ImapSettings) {
  return apiRequest<{ imap: ImapSettings }>("/api/settings/email/imap", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function testSmtpConnection(testEmail: string) {
  return apiRequest<{ success: boolean }>("/api/settings/email/smtp/test", {
    method: "POST",
    body: JSON.stringify({ testEmail }),
  });
}

export async function saveEmailTemplate(template: {
  name: EmailTemplateName;
  subject: string;
  body: string;
}) {
  return apiRequest<{ template: EmailTemplate }>("/api/settings/email/templates", {
    method: "PUT",
    body: JSON.stringify(template),
  });
}

export async function fetchEmailLogs(page = 1, limit = 20) {
  return apiRequest<EmailLogsResponse>(`/api/email-logs?page=${page}&limit=${limit}`);
}

export async function previewTemplate(name: EmailTemplateName) {
  return apiRequest<{ preview: { name: string; subject: string; body: string } }>(
    `/api/settings/email/templates/preview?name=${encodeURIComponent(name)}`
  );
}

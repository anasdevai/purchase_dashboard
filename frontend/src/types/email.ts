export type EmailEncryptionType = "none" | "SSL" | "TLS" | "STARTTLS";

export interface SmtpSettings {
  host: string;
  port: number;
  encryption: EmailEncryptionType;
  username: string;
  password?: string;
  hasPassword?: boolean;
}

export interface ImapSettings {
  host: string;
  port: number;
  encryption: EmailEncryptionType;
  username: string;
  password?: string;
  hasPassword?: boolean;
}

export type EmailTemplateName =
  | "Quotation"
  | "Invoice"
  | "OrderConfirmation"
  | "ReadyForPickup"
  | "PickupReminder"
  | "PaymentReminder"
  | "AppointmentConfirmation";

export interface EmailTemplate {
  id: string;
  userId: string;
  name: EmailTemplateName;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  status: "Sent" | "Failed";
  error?: string | null;
  sentAt: string;
}

export interface EmailSettingsPayload {
  smtp: SmtpSettings | null;
  imap: ImapSettings | null;
  templates: EmailTemplate[];
}

export interface EmailLogsResponse {
  logs: EmailLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

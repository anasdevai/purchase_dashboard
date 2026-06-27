export type InvoicePdfLanguage = "en" | "de";

export type InvoicePdfLabels = {
  documentTitle: string;
  titleBlock: string;
  invoiceNumber: string;
  invoiceShort: string;
  date: string;
  customer: string;
  invoiceTo: string;
  addressLabel: string;
  emailLabel: string;
  phoneLabel: string;
  service: string;
  serviceDescription: string;
  position: string;
  description: string;
  quantity: string;
  unitPrice: string;
  gross: string;
  netAmount: string;
  subtotal: string;
  vatOn: string;
  grossTotal: string;
  total: string;
  notes: string;
  paymentTitle: string;
  paymentStatus: string;
  paymentMethod: string;
  accountHolder: string;
  iban: string;
  bic: string;
  bank: string;
  uid: string;
  companyRegistration: string;
  companyRegisterCourt: string;
  gln: string;
  gisaNumber: string;
  taxNumber: string;
  companyDetailsTitle: string;
  phone: string;
  signatureRole: string;
  serviceDate: string;
  dueDate: string;
  paymentDate: string;
  paymentReference: string;
};

const labels: Record<InvoicePdfLanguage, InvoicePdfLabels> = {
  de: {
    documentTitle: "RECHNUNG",
    titleBlock: "Rechnung",
    invoiceNumber: "Rechnungsnummer",
    invoiceShort: "Rechnung",
    date: "Datum",
    customer: "Kunde",
    invoiceTo: "Rechnung an",
    addressLabel: "Adresse",
    emailLabel: "E-Mail",
    phoneLabel: "Telefon",
    service: "Leistung",
    serviceDescription: "Leistung / Beschreibung",
    position: "Position",
    description: "Beschreibung",
    quantity: "Menge",
    unitPrice: "Einzelpreis",
    gross: "Brutto",
    netAmount: "Netto",
    subtotal: "Zwischensumme",
    vatOn: "USt.",
    grossTotal: "Gesamt",
    total: "Gesamt",
    notes: "Anmerkungen",
    paymentTitle: "Zahlungsinformationen",
    paymentStatus: "Zahlungsstatus",
    paymentMethod: "Zahlungsmethode",
    accountHolder: "Kontoinhaber",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    bank: "Bank",
    uid: "UID",
    companyRegistration: "Firmenbuchnummer",
    companyRegisterCourt: "Firmenbuchgericht",
    gln: "GLN",
    gisaNumber: "GISA-Zahl",
    taxNumber: "Steuernummer",
    companyDetailsTitle: "Firmendaten",
    phone: "Tel.",
    signatureRole: "Geschäftsführung",
    serviceDate: "Leistungsdatum",
    dueDate: "Fälligkeitsdatum",
    paymentDate: "Zahlungsdatum",
    paymentReference: "Verwendungszweck"
  },
  en: {
    documentTitle: "INVOICE",
    titleBlock: "Invoice",
    invoiceNumber: "Invoice number",
    invoiceShort: "Invoice",
    date: "Date",
    customer: "Customer",
    invoiceTo: "Invoice to",
    addressLabel: "Address",
    emailLabel: "E-Mail",
    phoneLabel: "Phone",
    service: "Service",
    serviceDescription: "Service / Description",
    position: "Position",
    description: "Description",
    quantity: "Quantity",
    unitPrice: "Unit price",
    gross: "Gross",
    netAmount: "Net",
    subtotal: "Subtotal",
    vatOn: "VAT",
    grossTotal: "Total",
    total: "Total",
    notes: "Notes",
    paymentTitle: "Payment information",
    paymentStatus: "Payment status",
    paymentMethod: "Payment method",
    accountHolder: "Account holder",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    bank: "Bank",
    uid: "VAT ID",
    companyRegistration: "Company registration no.",
    companyRegisterCourt: "Register court",
    gln: "GLN",
    gisaNumber: "GISA no.",
    taxNumber: "Tax number",
    companyDetailsTitle: "Company details",
    phone: "Tel.",
    signatureRole: "Management",
    serviceDate: "Service Date",
    dueDate: "Due Date",
    paymentDate: "Payment Date",
    paymentReference: "Payment Reference"
  }
};

const paymentStatusLabels: Record<InvoicePdfLanguage, Record<string, string>> = {
  de: {
    Paid: "Bezahlt",
    Open: "Offen",
    Cancelled: "Storniert"
  },
  en: {
    Paid: "Paid",
    Open: "Open",
    Cancelled: "Cancelled"
  }
};

const paymentMethodLabels: Record<InvoicePdfLanguage, Record<string, string>> = {
  de: {
    Cash: "Bar",
    BankTransfer: "Banküberweisung",
    Card: "Karte",
    Other: "Sonstiges"
  },
  en: {
    Cash: "Cash",
    BankTransfer: "Bank transfer",
    Card: "Card",
    Other: "Other"
  }
};

export const getInvoicePdfLabels = (language: InvoicePdfLanguage = "en") => labels[language];

export const parseInvoicePdfLanguage = (value: unknown): InvoicePdfLanguage => {
  if (value === null || value === undefined) return "en";

  const raw = String(value).trim().toLowerCase();
  if (!raw) return "en";

  if (raw === "en" || raw.startsWith("en-")) return "en";
  if (raw === "de" || raw.startsWith("de-")) return "de";

  // Accept-Language style values, e.g. "de-DE,de;q=0.9,en;q=0.8"
  const primary = raw.split(",")[0]?.trim() ?? "";
  if (primary.startsWith("de")) return "de";
  if (primary.startsWith("en")) return "en";

  return "en";
};

export const resolveInvoicePdfLanguage = (...candidates: unknown[]): InvoicePdfLanguage => {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const raw = String(candidate).trim();
    if (!raw) continue;
    return parseInvoicePdfLanguage(raw);
  }
  // No language candidate provided at all -> default to German.
  return "de";
};

export const translateInvoicePaymentStatus = (
  status: unknown,
  language: InvoicePdfLanguage
): string => {
  if (!status) return "-";
  const key = String(status);
  return paymentStatusLabels[language][key] ?? key;
};

export const translateInvoicePaymentMethod = (
  method: unknown,
  language: InvoicePdfLanguage
): string => {
  if (!method) return "-";
  const key = String(method);
  return paymentMethodLabels[language][key] ?? key;
};

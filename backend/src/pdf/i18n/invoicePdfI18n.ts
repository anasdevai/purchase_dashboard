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
  service: string;
  position: string;
  description: string;
  quantity: string;
  gross: string;
  netAmount: string;
  subtotal: string;
  vatOn: string;
  grossTotal: string;
  total: string;
  serviceDescription: string;
  notes: string;
  paymentTitle: string;
  accountHolder: string;
  iban: string;
  bic: string;
  bank: string;
  uid: string;
  companyRegistration: string;
  taxNumber: string;
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
    service: "Leistung",
    position: "Position",
    description: "Beschreibung",
    quantity: "Menge",
    gross: "Brutto",
    netAmount: "Netto-Betrag",
    subtotal: "Zwischensumme",
    vatOn: "MwSt.",
    grossTotal: "Brutto-Gesamt",
    total: "Gesamtsumme",
    serviceDescription: "Leistungsbeschreibung",
    notes: "Anmerkungen",
    paymentTitle: "Zahlungsinformationen",
    accountHolder: "Kontoinhaber",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    bank: "Bank",
    uid: "UID",
    companyRegistration: "Firmenbuchnummer",
    taxNumber: "Steuernummer",
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
    service: "Service",
    position: "Position",
    description: "Description",
    quantity: "Quantity",
    gross: "Gross",
    netAmount: "Net amount",
    subtotal: "Subtotal",
    vatOn: "VAT",
    grossTotal: "Gross total",
    total: "Total",
    serviceDescription: "Service description",
    notes: "Notes",
    paymentTitle: "Payment information",
    accountHolder: "Account holder",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    bank: "Bank",
    uid: "VAT ID",
    companyRegistration: "Company registration no.",
    taxNumber: "Tax number",
    phone: "Tel.",
    signatureRole: "Management",
    serviceDate: "Service Date",
    dueDate: "Due Date",
    paymentDate: "Payment Date",
    paymentReference: "Payment Reference"
  }
};

export const getInvoicePdfLabels = (language: InvoicePdfLanguage = "de") => labels[language];

export const parseInvoicePdfLanguage = (value: unknown): InvoicePdfLanguage =>
  String(value ?? "de").toLowerCase() === "en" ? "en" : "de";

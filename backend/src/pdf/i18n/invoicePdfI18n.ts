export type InvoicePdfLanguage = "en" | "de";

export type InvoicePdfLabels = {
  documentTitle: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  service: string;
  position: string;
  description: string;
  quantity: string;
  gross: string;
  netAmount: string;
  vatOn: string;
  grossTotal: string;
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
};

const labels: Record<InvoicePdfLanguage, InvoicePdfLabels> = {
  de: {
    documentTitle: "RECHNUNG",
    invoiceNumber: "Rechnungsnummer",
    date: "Datum",
    customer: "Kunde",
    service: "Leistung",
    position: "Position",
    description: "Beschreibung",
    quantity: "Menge",
    gross: "Brutto",
    netAmount: "Netto-Betrag",
    vatOn: "MwSt.",
    grossTotal: "Brutto-Gesamt",
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
    phone: "Tel."
  },
  en: {
    documentTitle: "INVOICE",
    invoiceNumber: "Invoice number",
    date: "Date",
    customer: "Customer",
    service: "Service",
    position: "Position",
    description: "Description",
    quantity: "Quantity",
    gross: "Gross",
    netAmount: "Net amount",
    vatOn: "VAT",
    grossTotal: "Gross total",
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
    phone: "Tel."
  }
};

export const getInvoicePdfLabels = (language: InvoicePdfLanguage = "de") => labels[language];

export const parseInvoicePdfLanguage = (value: unknown): InvoicePdfLanguage =>
  String(value ?? "de").toLowerCase() === "en" ? "en" : "de";

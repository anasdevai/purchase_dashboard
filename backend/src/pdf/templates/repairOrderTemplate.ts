import type { PdfShopSettings, RepairOrderForPdf } from "../types.js";
import { formatDateEuropean, formatMoneyDecimal } from "../utils.js";
import { getInvoicePdfLabels, type InvoicePdfLanguage } from "../i18n/invoicePdfI18n.js";
import { renderReferenceDocument, type ReferenceRow } from "./referenceLayout.js";

export const renderRepairOrderHtml = (
  r: RepairOrderForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "de"
) => {
  const de = language === "de";
  const t = getInvoicePdfLabels(language);

  const gross = Number(r.estimatedPrice ?? 0) * (1 - Number(r.discountPercent ?? 0) / 100);
  const deposit = Number(r.depositAmount ?? 0);
  const device = [r.deviceType, r.brand, r.model].filter(Boolean).join(" ").trim();

  const customer: ReferenceRow[] = [
    { label: `${t.customer}:`, value: r.customerName },
    { label: `${t.phoneLabel}:`, value: r.customerPhone },
    { label: `${t.emailLabel}:`, value: r.customerEmail },
    { label: `${t.addressLabel}:`, value: r.customerAddress }
  ];

  const company = r.repairCompany;
  const companyContact = company
    ? [
        company.contactPerson,
        company.phone,
        company.email,
        [company.address, company.city, company.country].filter(Boolean).join(", ") || null,
        company.contactInfo,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const details: ReferenceRow[] = [
    { label: "", value: `${t.service}: ${device}` },
    { label: de ? "IMEI / Seriennummer" : "IMEI / Serial", value: r.imeiOrSerial },
    { label: de ? "Sichtbare Schäden" : "Visible damage", value: r.visibleDamage },
    {
      label: de ? "Voraussichtlich fertig" : "Expected completion",
      value: r.expectedCompletionDate ? formatDateEuropean(r.expectedCompletionDate) : null
    },
    {
      label: de ? "Externe Reparaturfirma" : "External repair company",
      value: company?.name ?? null
    },
    {
      label: de ? "Kontakt (Reparaturfirma)" : "Repair company contact",
      value: companyContact
    }
  ];

  const itemDetail = [device, r.visibleDamage, r.imeiOrSerial ? `IMEI / Serial: ${r.imeiOrSerial}` : null]
    .filter(Boolean)
    .join(" · ");

  const totals: ReferenceRow[] = [
    { label: de ? "Reparaturpreis:" : "Repair price:", value: formatMoneyDecimal(gross) },
    { label: de ? "Anzahlung:" : "Deposit:", value: formatMoneyDecimal(deposit) }
  ];

  return renderReferenceDocument({
    pageTitle: `${de ? "Reparaturauftrag" : "Repair Order"} ${r.repairOrderNumber}`,
    title: de ? "REPARATURAUFTRAG" : "REPAIR ORDER",
    numberLabel: de ? "Reparaturauftragsnummer:" : "Repair order number:",
    number: r.repairOrderNumber,
    date: r.createdAt,
    shopSettings,
    language,
    customer,
    details,
    items: [
      {
        position: 1,
        description: r.problemDescription,
        detail: itemDetail || undefined,
        quantity: "1",
        amount: formatMoneyDecimal(gross)
      }
    ],
    totals,
    grandLabel: de ? "Restbetrag:" : "Remaining balance:",
    grandValue: formatMoneyDecimal(gross - deposit),
    notesTitle: de ? "Leistungsbeschreibung:" : "Service description:",
    notes: [r.technicianNotes, r.repairCompanyNotes].filter(Boolean).join("\n") || null,
    showSignatures: false
  });
};

import type { ContractForPdf, PdfShopSettings } from "../types.js";
import { escapeHtml, filePathToDataUrl, formatDateEuropean, formatMoneyDecimal } from "../utils.js";
import { renderReferenceDocument } from "./referenceLayout.js";
import type { InvoicePdfLanguage } from "../i18n/invoicePdfI18n.js";

type ContractLabels = {
  pageTitle: string;
  title: string;
  numberLabel: string;
  customerSeller: string;
  phone: string;
  email: string;
  address: string;
  idDocument: string;
  device: string;
  imei: string;
  serialNumber: string;
  condition: string;
  accessories: string;
  damage: string;
  netAmount: string;
  vatAmount: string;
  paymentMethod: string;
  grandLabel: string;
  notesTitle: string;
  devicePurchase: string;
  ownershipConfirmed: string;
  notStolen: string;
  icloudRemoved: string;
  googleLockRemoved: string;
  factoryReset: string;
  ownershipStatement: string;
  photosTitle: string;
  signaturesTitle: string;
  customerSignature: string;
  shopRepresentative: string;
  date: string;
  photos: Record<string, string>;
};

const LABELS: Record<InvoicePdfLanguage, ContractLabels> = {
  de: {
    pageTitle: "Vertrag",
    title: "GERÄTEKAUFVERTRAG",
    numberLabel: "Vertragsnummer:",
    customerSeller: "Kunde / Verkäufer:",
    phone: "Telefon:",
    email: "E-Mail:",
    address: "Adresse:",
    idDocument: "Ausweisdokument:",
    device: "Gerät",
    imei: "IMEI:",
    serialNumber: "Seriennummer:",
    condition: "Zustand",
    accessories: "Zubehör",
    damage: "Schäden",
    netAmount: "Nettobetrag:",
    vatAmount: "USt.-Betrag:",
    paymentMethod: "Zahlungsmethode:",
    grandLabel: "Kaufpreis (Brutto):",
    notesTitle: "Bedingungen / Bestätigungen:",
    devicePurchase: "Gerätekauf",
    ownershipConfirmed: "Eigentum bestätigt",
    notStolen: "Nicht gestohlen",
    icloudRemoved: "iCloud entfernt",
    googleLockRemoved: "Google-Sperre entfernt",
    factoryReset: "Werksreset",
    ownershipStatement:
      "Der Verkäufer bestätigt das Eigentum und das rechtmäßige Verkaufsrecht am Gerät.",
    photosTitle: "Fotos & Dokumente",
    signaturesTitle: "Unterschriften",
    customerSignature: "Unterschrift Kunde / Verkäufer",
    shopRepresentative: "Geschäftsvertreter / Käufer",
    date: "Datum",
    photos: {
      id_front: "Ausweis Vorderseite",
      id_back: "Ausweis Rückseite",
      device_front: "Gerät Vorderseite",
      device_back: "Gerät Rückseite",
      imei_photo: "IMEI / Seriennummer",
      damage_photo: "Schäden",
      accessories_photo: "Zubehör"
    }
  },
  en: {
    pageTitle: "Contract",
    title: "DEVICE PURCHASE CONTRACT",
    numberLabel: "Contract number:",
    customerSeller: "Customer / Seller:",
    phone: "Phone:",
    email: "E-Mail:",
    address: "Address:",
    idDocument: "ID document:",
    device: "Device",
    imei: "IMEI:",
    serialNumber: "Serial number:",
    condition: "Condition",
    accessories: "Accessories",
    damage: "Damage",
    netAmount: "Net amount:",
    vatAmount: "VAT amount:",
    paymentMethod: "Payment method:",
    grandLabel: "Purchase price (gross):",
    notesTitle: "Terms / Confirmations:",
    devicePurchase: "Device purchase",
    ownershipConfirmed: "Ownership confirmed",
    notStolen: "Not stolen",
    icloudRemoved: "iCloud removed",
    googleLockRemoved: "Google lock removed",
    factoryReset: "Factory reset",
    ownershipStatement:
      "Seller confirms ownership and the legal right to sell the device.",
    photosTitle: "Photos & Documents",
    signaturesTitle: "Signatures",
    customerSignature: "Customer / Seller signature",
    shopRepresentative: "Shop representative / Buyer",
    date: "Date",
    photos: {
      id_front: "ID front",
      id_back: "ID back",
      device_front: "Device front",
      device_back: "Device back",
      imei_photo: "IMEI / Serial",
      damage_photo: "Damage",
      accessories_photo: "Accessories"
    }
  }
};

const photoLabel = (fileType: string, t: ContractLabels) =>
  t.photos[fileType] ?? fileType.replace(/_/g, " ");

/** Photos grid: renders every uploaded contract image, skipping missing files. */
const renderPhotosSection = (files: ContractForPdf["files"], t: ContractLabels) => {
  const cards = files
    .map((file) => {
      const src = filePathToDataUrl(file.filePath);
      if (!src) return "";
      return `<div class="ref-photo">
        <img class="ref-photo__img" src="${src}" alt="${escapeHtml(photoLabel(file.fileType, t))}" />
        <div class="ref-photo__caption">${escapeHtml(photoLabel(file.fileType, t))}</div>
      </div>`;
    })
    .filter(Boolean)
    .join("");

  if (!cards) return "";

  return `<section class="ref-photos avoid-break">
    <div class="ref-section__title">${escapeHtml(t.photosTitle)}</div>
    <div class="ref-photo-grid">${cards}</div>
  </section>`;
};

/** Signature section: renders captured signature images with labels and date. */
const renderSignaturesSection = (
  contract: ContractForPdf,
  t: ContractLabels,
  shopSettings?: PdfShopSettings
) => {
  const customerSignature = filePathToDataUrl(contract.signaturePath);
  const shopkeeperSignature = filePathToDataUrl(contract.shopkeeperSignaturePath);
  const contractDate = formatDateEuropean(contract.updatedAt);

  const representative = contract.employeeName?.trim() || shopSettings?.ownerName?.trim() || "";
  const sellerLabel = representative
    ? `${t.shopRepresentative} (${representative})`
    : t.shopRepresentative;

  const box = (label: string, src: string | null) => `<div class="ref-sign-box">
    ${src ? `<img class="ref-sign-box__img" src="${src}" alt="${escapeHtml(label)}" />` : ""}
    <div class="ref-sign-box__line">${escapeHtml(label)}</div>
    <div class="ref-sign-box__meta">${escapeHtml(t.date)}: ${escapeHtml(contractDate)}</div>
  </div>`;

  return `<section class="ref-photos avoid-break">
    <div class="ref-section__title">${escapeHtml(t.signaturesTitle)}</div>
    <div class="ref-sign-grid">
      ${box(t.customerSignature, customerSignature)}
      ${box(sellerLabel, shopkeeperSignature)}
    </div>
  </section>`;
};

export const renderContractHtml = (
  c: ContractForPdf,
  shopSettings?: PdfShopSettings,
  language: InvoicePdfLanguage = "de"
) => {
  const t = LABELS[language];
  const name =
    [c.salutation, c.customerFirstName, c.customerLastName].filter(Boolean).join(" ") ||
    c.customerName;
  const address =
    [c.customerStreet, [c.customerZipCode, c.customerCity].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ") || c.customerAddress;
  const confirmations = [
    c.ownershipConfirmed && t.ownershipConfirmed,
    c.notStolenConfirmed && t.notStolen,
    c.icloudRemoved && t.icloudRemoved,
    c.googleLockRemoved && t.googleLockRemoved,
    c.factoryResetConfirmed && t.factoryReset
  ]
    .filter(Boolean)
    .join(" · ");
  const device = [c.deviceType, c.brand, c.model, c.storage, c.color].filter(Boolean).join(" ");

  const bodyExtras = `${renderPhotosSection(c.files, t)}${renderSignaturesSection(c, t, shopSettings)}`;

  return renderReferenceDocument({
    pageTitle: `${t.pageTitle} ${c.contractNumber}`,
    title: t.title,
    numberLabel: t.numberLabel,
    number: c.contractNumber,
    date: c.updatedAt,
    shopSettings,
    language,
    customer: [
      { label: t.customerSeller, value: name },
      { label: t.phone, value: c.customerPhone },
      { label: t.email, value: c.customerEmail },
      { label: t.address, value: address },
      { label: t.idDocument, value: c.idDocumentNumber }
    ],
    details: [
      { label: "", value: `${t.device}: ${device}` },
      { label: t.imei, value: c.imei },
      { label: t.serialNumber, value: c.serialNumber },
      { label: `${t.condition}:`, value: c.condition }
    ],
    items: [
      {
        position: 1,
        description: device || t.devicePurchase,
        detail: [
          `${t.condition}: ${c.condition || "-"}`,
          `${t.accessories}: ${c.accessories || "-"}`,
          `${t.damage}: ${c.damageNotes || "-"}`
        ].join(" · "),
        quantity: "1",
        amount: formatMoneyDecimal(c.purchasePrice)
      }
    ],
    totals: [
      { label: t.netAmount, value: formatMoneyDecimal(c.netPrice) },
      { label: t.vatAmount, value: formatMoneyDecimal(c.vatAmount) },
      { label: t.paymentMethod, value: c.paymentMethod }
    ],
    grandLabel: t.grandLabel,
    grandValue: formatMoneyDecimal(c.purchasePrice),
    notesTitle: t.notesTitle,
    notes: [c.notes, confirmations, t.ownershipStatement]
      .filter(Boolean)
      .join("\n"),
    // Contract renders its own image-based signature section via bodyExtras.
    showSignatures: false,
    bodyExtras
  });
};

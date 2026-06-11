import { getPdfStyles } from "../styles/pdfStyles.js";
import type { ContractForPdf, PdfShopSettings } from "../types.js";
import {
  buildCompanyHeaderHtml,
  buildKvGridHtml,
  buildLegalFooterHtml,
  displayValue,
  escapeHtml,
  filePathToDataUrl,
  formatDateShort,
  formatMoneyDecimal,
  wrapHtmlDocument
} from "../utils.js";

const renderCheckList = (
  items: Array<[string, boolean]>
) => `<ul class="check-list">
  ${items
    .map(
      ([label, checked]) => `<li>
        <span class="check-icon ${checked ? "check-icon--yes" : "check-icon--no"}">${checked ? "✓" : ""}</span>
        <span>${escapeHtml(label)}</span>
      </li>`
    )
    .join("")}
</ul>`;

const renderPhotoGrid = (files: ContractForPdf["files"]) => {
  const thumbs = files.slice(0, 6).map((file) => {
    const src = filePathToDataUrl(file.filePath);
    const content = src
      ? `<img src="${src}" alt="${escapeHtml(file.fileType)}" />`
      : `<span class="photo-thumb__label">${escapeHtml(file.fileType)}</span>`;
    return `<div class="photo-thumb">${content}</div>`;
  });

  while (thumbs.length < 1 && files.length === 0) {
    thumbs.push(`<div class="photo-thumb"><span class="photo-thumb__label">No photos</span></div>`);
    break;
  }

  return `<div class="photo-grid">${thumbs.join("")}</div>`;
};

export const renderContractHtml = (contract: ContractForPdf, shopSettings?: PdfShopSettings) => {
  const shopOwner = shopSettings?.ownerName?.trim() || "";
  const shopkeeperLabel = shopOwner ? `Shopkeeper / Buyer (${shopOwner})` : "Shopkeeper / Buyer Signature";
  const contractDate = formatDateShort(contract.updatedAt);
  const dob = contract.customerDateOfBirth
    ? contract.customerDateOfBirth.toISOString().slice(0, 10)
    : "-";

  const customerSignature = filePathToDataUrl(contract.signaturePath);
  const shopkeeperSignature = filePathToDataUrl(contract.shopkeeperSignaturePath);

  const body = `
    ${buildCompanyHeaderHtml(shopSettings, {
      includeRegistration: true,
      contractLogo: true,
      meta: {
        numberLabel: "Contract No.",
        numberValue: contract.contractNumber,
        dateLabel: "Date",
        date: contract.updatedAt
      }
    })}

    <h1 class="doc-title doc-title--center">DEVICE PURCHASE CONTRACT</h1>

    <section class="section avoid-break">
      <h2 class="section-title">Customer / Seller Information</h2>
      ${buildKvGridHtml([
        { label: "Name:", value: contract.customerName, half: true },
        { label: "Phone:", value: contract.customerPhone, half: true },
        { label: "Email:", value: contract.customerEmail, half: true },
        { label: "DOB:", value: dob, half: true },
        { label: "Address:", value: contract.customerAddress },
        { label: "ID Type:", value: contract.idDocumentNumber ? "Document" : "-", half: true },
        { label: "ID Number:", value: contract.idDocumentNumber, half: true }
      ])}
    </section>

    <section class="section avoid-break">
      <h2 class="section-title">Device Information</h2>
      ${buildKvGridHtml([
        { label: "Device Type:", value: contract.deviceType, half: true },
        { label: "Brand:", value: contract.brand, half: true },
        { label: "Model:", value: contract.model, half: true },
        { label: "Storage:", value: contract.storage, half: true },
        { label: "IMEI / Serial:", value: contract.imei || contract.serialNumber, half: true },
        { label: "Color:", value: contract.color, half: true },
        { label: "Condition:", value: contract.condition, half: true },
        { label: "Battery:", value: contract.batteryHealth, half: true },
        { label: "Accessories:", value: contract.accessories },
        { label: "Damage:", value: contract.damageNotes }
      ])}
    </section>

    <section class="panel panel--highlight avoid-break">
      <div class="panel__title">Purchase Details</div>
      <div class="panel__row">
        <span>Purchase Price</span>
        <span class="panel__amount">${formatMoneyDecimal(contract.purchasePrice)}</span>
      </div>
      <div class="panel__row">
        <span>Payment Method</span>
        <span>${escapeHtml(displayValue(contract.paymentMethod))}</span>
      </div>
    </section>

    <section class="two-col avoid-break">
      <div class="panel">
        <div class="panel__title">Confirmations</div>
        ${renderCheckList([
          ["Ownership Confirmed", contract.ownershipConfirmed],
          ["Not Stolen", contract.notStolenConfirmed],
          ["iCloud Lock Removed", contract.icloudRemoved],
          ["Google Lock Removed", contract.googleLockRemoved],
          ["Other Account Lock Removed", contract.otherLockRemoved],
          ["Factory Reset Confirmed", contract.factoryResetConfirmed]
        ])}
      </div>
      <div class="panel">
        <div class="panel__title">Photos</div>
        ${renderPhotoGrid(contract.files)}
      </div>
    </section>

    <section class="panel avoid-break">
      <div class="panel__title">Signatures</div>
      <div class="signature-grid">
        <div>
          <div class="section-subtitle">Customer / Seller Signature</div>
          <div class="signature-box">
            ${customerSignature ? `<img src="${customerSignature}" alt="Customer signature" />` : ""}
          </div>
          <div class="signature-meta"><span>Date: ${contractDate}</span></div>
        </div>
        <div>
          <div class="section-subtitle">${escapeHtml(shopkeeperLabel)}</div>
          <div class="signature-box">
            ${shopkeeperSignature ? `<img src="${shopkeeperSignature}" alt="Shopkeeper signature" />` : ""}
          </div>
          <div class="signature-meta"><span>Date: ${contractDate}</span></div>
        </div>
      </div>
    </section>

    ${buildLegalFooterHtml(shopSettings, { poweredBySclera: true })}
  `;

  return wrapHtmlDocument(`Contract ${contract.contractNumber}`, getPdfStyles(), body);
};

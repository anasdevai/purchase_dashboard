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
  const employeeLabel = contract.employeeName
    ? `Shop Representative (${contract.employeeName})`
    : shopkeeperLabel;
  const contractDate = formatDateShort(contract.updatedAt);
  const dob = contract.customerDateOfBirth
    ? contract.customerDateOfBirth.toISOString().slice(0, 10)
    : null;

  // Build display name from split fields or fall back to legacy customerName
  const displayFirstName = (contract as Record<string, unknown>).customerFirstName as string | null | undefined;
  const displayLastName = (contract as Record<string, unknown>).customerLastName as string | null | undefined;
  const displaySalutation = (contract as Record<string, unknown>).salutation as string | null | undefined;
  const fullName = displayFirstName || displayLastName
    ? [displaySalutation, displayFirstName, displayLastName].filter(Boolean).join(' ')
    : contract.customerName ?? '-';

  // Build address from split fields or fall back to legacy customerAddress
  const displayStreet = (contract as Record<string, unknown>).customerStreet as string | null | undefined;
  const displayZip = (contract as Record<string, unknown>).customerZipCode as string | null | undefined;
  const displayCity = (contract as Record<string, unknown>).customerCity as string | null | undefined;
  const addressLine1 = displayStreet?.trim() || null;
  const addressLine2 = [displayZip, displayCity].filter(Boolean).join(' ') || null;
  const legacyAddress = contract.customerAddress ?? null;

  const displayIdType = (contract as Record<string, unknown>).idType as string | null | undefined;

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
    ${contract.employeeName
      ? `<div style="text-align: center; font-size: 10px; color: #475569; margin-top: -10px; margin-bottom: 20px;">Processed by: ${escapeHtml(contract.employeeName)}</div>`
      : ""
    }

    <section class="section avoid-break">
      <h2 class="section-title">Customer / Seller Information</h2>
      ${buildKvGridHtml([
        { label: "Name:", value: fullName, half: true },
        { label: "Phone:", value: contract.customerPhone, half: true },
        { label: "Email:", value: contract.customerEmail, half: true },
        ...(dob ? [{ label: "DOB:", value: dob, half: true }] : []),
        ...(addressLine1 || addressLine2
          ? [
              { label: "Street:", value: addressLine1 ?? '-', half: false },
              { label: "ZIP / City:", value: addressLine2 ?? '-', half: false }
            ]
          : legacyAddress
          ? [{ label: "Address:", value: legacyAddress, half: false }]
          : []),
        { label: "ID Type:", value: displayIdType ?? (contract.idDocumentNumber ? "Document" : null), half: true },
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
        { label: "IMEI:", value: contract.imei, half: true },
        { label: "Serial Number:", value: contract.serialNumber, half: true },
        { label: "Color:", value: contract.color, half: true },
        { label: "Condition:", value: contract.condition, half: true },
        { label: "Battery Health:", value: contract.batteryHealth, half: true },
        { label: "OS Version:", value: (contract as Record<string, unknown>).osVersion as string | null | undefined, half: true },
        { label: "iCloud Status:", value: (contract as Record<string, unknown>).icloudStatus as string | null | undefined, half: true },
        { label: "MDM Status:", value: (contract as Record<string, unknown>).mdmStatus as string | null | undefined, half: true },
        { label: "Warranty:", value: (contract as Record<string, unknown>).warranty as string | null | undefined, half: true },
        { label: "Receipt Available:", value: (contract as Record<string, unknown>).purchaseReceiptAvailable ? "Yes" : "No", half: true },
        { label: "Accessories:", value: contract.accessories },
        { label: "Visible Damage:", value: contract.damageNotes }
      ])}
    </section>

    <section class="panel panel--highlight avoid-break">
      <div class="panel__title">Purchase Details</div>
      <div class="panel__row">
        <span>Net Price</span>
        <span>${formatMoneyDecimal(contract.netPrice)}</span>
      </div>
      <div class="panel__row">
        <span>VAT Amount</span>
        <span>${formatMoneyDecimal(contract.vatAmount)}</span>
      </div>
      <div class="panel__row">
        <span>Purchase Price (Gross)</span>
        <span class="panel__amount">${formatMoneyDecimal(contract.purchasePrice)}</span>
      </div>
      <div class="panel__row">
        <span>Payment Method</span>
        <span>${escapeHtml(displayValue(contract.paymentMethod))}</span>
      </div>
      ${(contract as Record<string, unknown>).paymentStatus
        ? `
        <div class="panel__row">
          <span>Payment Status</span>
          <span>${escapeHtml(displayValue((contract as Record<string, unknown>).paymentStatus as string))}</span>
        </div>
        `
        : ""
      }
    </section>

    ${(contract as Record<string, unknown>).notes
      ? `
      <section class="section avoid-break">
        <h2 class="section-title">General Notes</h2>
        <div style="font-size: 11px; line-height: 1.5; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; white-space: pre-wrap;">${escapeHtml((contract as Record<string, unknown>).notes as string)}</div>
      </section>
      `
      : ""
    }

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
      <div class="panel__title">Terms & Conditions</div>
      <ol style="font-size: 10px; line-height: 1.5; color: #475569; padding-left: 15px; margin: 10px 0;">
        <li>Seller confirms ownership and legal right to sell the device.</li>
        <li>The device is purchased in the condition described above. The shop reserves the right to verify the device's authenticity and performance.</li>
        <li>The seller must provide a valid government-issued photo identification document.</li>
      </ol>
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
          <div class="section-subtitle">${escapeHtml(employeeLabel)}</div>
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

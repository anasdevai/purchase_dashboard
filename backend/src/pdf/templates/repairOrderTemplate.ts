import { getPdfStyles } from "../styles/pdfStyles.js";
import type { PdfShopSettings, RepairOrderForPdf } from "../types.js";
import {
  buildCompanyHeaderHtml,
  buildKvGridHtml,
  displayValue,
  escapeHtml,
  formatDateShort,
  formatMoneyDecimal,
  wrapHtmlDocument
} from "../utils.js";

const repairAccessoryLabels: Record<string, string> = {
  charger: "Charger",
  powerSupply: "Power Supply",
  controller: "Controller",
  cable: "Cable",
  carryingCase: "Carrying Case",
  other: "Other"
};

const formatAccessoriesReceived = (value: string | null | undefined) => {
  if (!value?.trim()) return "-";

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("other:")) {
        return part.slice(6).trim() || repairAccessoryLabels.other;
      }
      return repairAccessoryLabels[part] ?? part;
    })
    .join(", ");
};

export const renderRepairOrderHtml = (
  repairOrder: RepairOrderForPdf,
  shopSettings?: PdfShopSettings
) => {
  const body = `
    <div class="compact">
      ${buildCompanyHeaderHtml(shopSettings, {
        compactLogo: true,
        meta: {
          numberLabel: "Order No.",
          numberValue: repairOrder.repairOrderNumber,
          dateLabel: "Date",
          date: repairOrder.createdAt,
          europeanDate: true
        }
      })}

      <h1 class="doc-title doc-title--center">REPAIR ORDER</h1>

      <section class="section avoid-break">
        <h2 class="section-title">Customer Information</h2>
        ${buildKvGridHtml([
          { label: "Name:", value: repairOrder.customerName, half: true },
          { label: "Phone:", value: repairOrder.customerPhone, half: true },
          { label: "Email:", value: repairOrder.customerEmail },
          { label: "Address:", value: repairOrder.customerAddress }
        ])}
      </section>

      <section class="section avoid-break">
        <h2 class="section-title">Device Information</h2>
        ${buildKvGridHtml([
          { label: "Device Type:", value: repairOrder.deviceType, half: true },
          { label: "Brand:", value: repairOrder.brand, half: true },
          { label: "Model:", value: repairOrder.model, half: true },
          { label: "IMEI/Serial:", value: repairOrder.imeiOrSerial, half: true },
          { label: "Password/PIN:", value: repairOrder.passwordPin },
          {
            label: "Accessories:",
            value: formatAccessoriesReceived(repairOrder.accessoriesReceived)
          }
        ])}
      </section>

      <section class="section avoid-break">
        <h2 class="section-title">Repair Details</h2>
        ${buildKvGridHtml([
          { label: "Problem:", value: repairOrder.problemDescription },
          { label: "Damage:", value: repairOrder.visibleDamage },
          { label: "Notes:", value: repairOrder.technicianNotes },
          {
            label: "Expected:",
            value: repairOrder.expectedCompletionDate
              ? formatDateShort(repairOrder.expectedCompletionDate)
              : "-",
            half: true
          },
          { label: "Status:", value: repairOrder.status, half: true }
        ])}
      </section>

      <section class="panel panel--highlight avoid-break">
        <div class="panel__title">Estimate</div>
        <div class="panel__row">
          <span>Estimated Price</span>
          <span class="panel__amount">${formatMoneyDecimal(repairOrder.estimatedPrice)}</span>
        </div>
        <div class="panel__row">
          <span>Deposit / Advance</span>
          <span>${formatMoneyDecimal(repairOrder.depositAmount)}</span>
        </div>
      </section>

      <section class="panel avoid-break">
        <div class="panel__title">Customer Signature</div>
        <div class="signature-line-row">
          <div class="signature-line">Signature</div>
          <div class="signature-line">Date</div>
        </div>
      </section>
    </div>
  `;

  return wrapHtmlDocument(`Repair Order ${repairOrder.repairOrderNumber}`, getPdfStyles(), body);
};

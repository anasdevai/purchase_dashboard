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

const repairOrderStatusLabels: Record<string, string> = {
  Open: "Open",
  WorkPending: "Work Pending",
  SentToRepairCompany: "Sent to Repair Company",
  AppointmentScheduled: "Appointment Scheduled",
  Completed: "Completed",
  Cancelled: "Cancelled"
};

const formatRepairOrderStatus = (status: string | null | undefined) =>
  repairOrderStatusLabels[status ?? ""] ?? status ?? "-";

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
          { label: "Status:", value: formatRepairOrderStatus(repairOrder.status), half: true }
        ])}
      </section>

      ${
        repairOrder.repairCompany
          ? `<section class="section avoid-break">
        <h2 class="section-title">External Repair Company</h2>
        ${buildKvGridHtml([
          { label: "Company:", value: repairOrder.repairCompany.name, half: true },
          { label: "Contact:", value: repairOrder.repairCompany.contactInfo, half: true },
          { label: "Company notes:", value: repairOrder.repairCompany.notes },
          { label: "Send notes:", value: repairOrder.repairCompanyNotes }
        ])}
      </section>`
          : ""
      }

      <section class="panel panel--highlight avoid-break">
        <div class="panel__title">Financial Summary</div>
        <div class="panel__row">
          <span>Repair Price (gross)</span>
          <span>${formatMoneyDecimal(repairOrder.estimatedPrice)}</span>
        </div>
        ${
          repairOrder.discountPercent && Number(repairOrder.discountPercent) > 0
            ? `
        <div class="panel__row">
          <span>Discount (${Number(repairOrder.discountPercent)}%)</span>
          <span>-${formatMoneyDecimal(
            Number(repairOrder.estimatedPrice ?? 0) * (Number(repairOrder.discountPercent) / 100)
          )}</span>
        </div>
        <div class="panel__row" style="font-weight: 600;">
          <span>Total Price</span>
          <span>${formatMoneyDecimal(
            Number(repairOrder.estimatedPrice ?? 0) * (1 - Number(repairOrder.discountPercent) / 100)
          )}</span>
        </div>
            `
            : ""
        }
        <div class="panel__row">
          <span>Deposit / Advance Paid</span>
          <span>${formatMoneyDecimal(repairOrder.depositAmount)}</span>
        </div>
        ${
          repairOrder.paymentMethod
            ? `
        <div class="panel__row">
          <span>Payment Method</span>
          <span>${escapeHtml(repairOrder.paymentMethod)}</span>
        </div>
            `
            : ""
        }
        <div class="panel__row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dbe3ef;">
          <strong style="font-size: 10pt;">Remaining Balance</strong>
          <strong class="panel__amount" style="font-size: 12pt; display: inline-block;">
            ${formatMoneyDecimal(
              Number(repairOrder.estimatedPrice ?? 0) *
                (1 - Number(repairOrder.discountPercent ?? 0) / 100) -
                Number(repairOrder.depositAmount ?? 0)
            )}
          </strong>
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

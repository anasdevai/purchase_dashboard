import type { PdfShopSettings, RepairOrderForPdf } from "../types.js";
import { formatMoneyDecimal } from "../utils.js";
import { renderReferenceDocument } from "./referenceLayout.js";

export const renderRepairOrderHtml = (r: RepairOrderForPdf, shopSettings?: PdfShopSettings) => {
  const gross = Number(r.estimatedPrice ?? 0) * (1 - Number(r.discountPercent ?? 0) / 100);
  const deposit = Number(r.depositAmount ?? 0);
  return renderReferenceDocument({ pageTitle:`Repair Order ${r.repairOrderNumber}`, title:"REPAIR ORDER", numberLabel:"Order number:", number:r.repairOrderNumber, date:r.createdAt, shopSettings,
    customer:[{label:"Customer:",value:r.customerName}],
    details:[{label:"",value:`Service: ${r.deviceType} ${r.brand || ""} ${r.model}`.trim()}],
    items:[{position:1,description:r.problemDescription,detail:[`${r.deviceType} ${r.brand||""} ${r.model}`.trim(),r.visibleDamage,r.imeiOrSerial?`IMEI / Serial: ${r.imeiOrSerial}`:null].filter(Boolean).join(" · "),quantity:"1",amount:formatMoneyDecimal(gross)}],
    totals:[{label:"Repair price:",value:formatMoneyDecimal(gross)},{label:"Deposit:",value:formatMoneyDecimal(deposit)}],grandLabel:"Remaining balance:",grandValue:formatMoneyDecimal(gross-deposit),
    notesTitle:"Service description:",notes:[r.technicianNotes,r.repairCompanyNotes].filter(Boolean).join("\n") || null,showSignatures:false
  });
};

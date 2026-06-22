import type { ContractForPdf, PdfShopSettings } from "../types.js";
import { formatMoneyDecimal } from "../utils.js";
import { renderReferenceDocument } from "./referenceLayout.js";

export const renderContractHtml = (c: ContractForPdf, shopSettings?: PdfShopSettings) => {
  const name=[c.salutation,c.customerFirstName,c.customerLastName].filter(Boolean).join(" ")||c.customerName;
  const address=[c.customerStreet,[c.customerZipCode,c.customerCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")||c.customerAddress;
  const confirmations=[c.ownershipConfirmed&&"Ownership confirmed",c.notStolenConfirmed&&"Not stolen",c.icloudRemoved&&"iCloud removed",c.googleLockRemoved&&"Google lock removed",c.factoryResetConfirmed&&"Factory reset"].filter(Boolean).join(" · ");
  const device=[c.deviceType,c.brand,c.model,c.storage,c.color].filter(Boolean).join(" ");
  return renderReferenceDocument({pageTitle:`Contract ${c.contractNumber}`,title:"DEVICE PURCHASE CONTRACT",numberLabel:"Contract number:",number:c.contractNumber,date:c.updatedAt,shopSettings,
    customer:[{label:"Customer / Seller:",value:name},{label:"Phone:",value:c.customerPhone},{label:"E-Mail:",value:c.customerEmail},{label:"Address:",value:address},{label:"ID document:",value:c.idDocumentNumber}],
    details:[{label:"",value:`Device: ${device}`},{label:"IMEI:",value:c.imei},{label:"Serial number:",value:c.serialNumber},{label:"Condition:",value:c.condition}],
    items:[{position:1,description:device||"Device purchase",detail:[`Condition: ${c.condition||"-"}`,`Accessories: ${c.accessories||"-"}`,`Damage: ${c.damageNotes||"-"}`].join(" · "),quantity:"1",amount:formatMoneyDecimal(c.purchasePrice)}],
    totals:[{label:"Net amount:",value:formatMoneyDecimal(c.netPrice)},{label:"VAT amount:",value:formatMoneyDecimal(c.vatAmount)},{label:"Payment method:",value:c.paymentMethod}],grandLabel:"Purchase price (gross):",grandValue:formatMoneyDecimal(c.purchasePrice),
    notesTitle:"Terms / Confirmations:",notes:[c.notes,confirmations,"Seller confirms ownership and the legal right to sell the device."].filter(Boolean).join("\n"),signatureLeft:"Customer / Seller signature",signatureRight:c.employeeName?`Shop representative (${c.employeeName})`:"Shop representative"
  });
};

import type { PdfShopSettings, QuotationForPdf } from "../types.js";
import { formatDateEuropean, formatMoneyDecimal, numericValue } from "../utils.js";
import { renderReferenceDocument } from "./referenceLayout.js";

export const renderQuotationHtml = (q: QuotationForPdf, shopSettings?: PdfShopSettings, language:"de"|"en"="de") => {
  const de=language==="de", gross=q.items.reduce((s,i)=>s+Number(i.lineTotal??0),0), vatRate=Number(shopSettings?.defaultVatRate||20), net=gross/(1+vatRate/100);
  return renderReferenceDocument({ pageTitle:`${de?"Angebot":"Quotation"} ${q.quotationNumber}`,title:de?"ANGEBOT":"QUOTATION",numberLabel:de?"Angebotsnummer:":"Quotation number:",number:q.quotationNumber,date:q.createdAt,shopSettings,language,
    customer:[{label:de?"Kunde:":"Customer:",value:q.customerName},{label:de?"Telefon:":"Phone:",value:q.customerPhone},{label:"E-Mail:",value:q.customerEmail},{label:de?"Adresse:":"Address:",value:q.customerAddress}],
    details:[{label:"",value:`${de?"Leistung":"Service"}: ${q.deviceType} ${q.brand||""} ${q.model}`.trim()},{label:de?"IMEI / Seriennummer:":"IMEI / Serial:",value:q.imeiOrSerial},{label:de?"Gültig bis:":"Valid until:",value:formatDateEuropean(q.validUntilDate)},{label:de?"Status:":"Status:",value:q.status}],
    items:q.items.map((i,n)=>({position:n+1,description:i.repairType,detail:i.description,quantity:numericValue(i.quantity),amount:formatMoneyDecimal(i.lineTotal)})),
    totals:[{label:de?"Netto-Betrag:":"Net amount:",value:formatMoneyDecimal(net)},{label:`+ ${numericValue(vatRate)}% ${de?"MwSt.":"VAT"}:`,value:formatMoneyDecimal(gross-net)}],grandLabel:de?"Gesamtbetrag (Brutto):":"Total (gross):",grandValue:formatMoneyDecimal(gross),
    notesTitle:de?"Leistungsbeschreibung / Bedingungen:":"Service description / Terms:",notes:q.notes|| (de?"Dieses Angebot ist 14 Tage gültig.":"This quotation is valid for 14 days."),signatureLeft:de?"Kundenunterschrift":"Customer signature",signatureRight:de?"Datum":"Date"
  });
};

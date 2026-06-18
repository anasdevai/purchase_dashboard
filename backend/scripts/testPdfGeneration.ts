import fs from "node:fs";
import path from "node:path";
import {
  generateContractPdf,
  generateInvoicePdf,
  generateRepairOrderPdf,
  type PdfShopSettings
} from "../src/services/pdfService.js";

const sampleShop: PdfShopSettings = {
  name: "TechFix Wien GmbH",
  address: "Mariahilfer Straße 10\n1060 Wien – Österreich",
  street: "Mariahilfer Straße 10",
  zipCode: "1060",
  city: "Wien",
  country: "Österreich",
  phone: "+43 1 234 5678",
  email: "office@techfix.at",
  website: "www.techfix.at",
  vatNumber: "ATU12345678",
  companyRegistrationNumber: "FN 123456a",
  taxNumber: "12/345/6789",
  accountHolder: "TechFix Wien GmbH",
  iban: "AT61 1904 3002 3457 3201",
  bicSwift: "BKAUATWW",
  bankName: "Bank Austria"
};

const userId = "pdf-test-user";

const run = async () => {
  const outDir = path.join(process.cwd(), "storage", "pdf-test-output");
  fs.mkdirSync(outDir, { recursive: true });

  const contractPath = await generateContractPdf(
    {
      userId,
      contractNumber: "CON-TEST-001",
      status: "Completed",
      updatedAt: new Date("2026-06-10"),
      customerName: "Max Mustermann",
      customerAddress: "Hauptstraße 1, 1010 Wien کراچی",
      customerPhone: "+43 660 1234567",
      customerEmail: "max@example.com",
      customerDateOfBirth: new Date("1990-05-15"),
      idDocumentNumber: "PA1234567",
      deviceType: "Smartphone",
      brand: "Apple",
      model: "iPhone 14 Pro",
      imei: "356789012345678",
      serialNumber: null,
      storage: "256 GB",
      color: "Space Black",
      condition: "Good",
      accessories: "Charger, Cable",
      batteryHealth: "87%",
      damageNotes: "Minor scratch on back glass",
      purchasePrice: 420,
      paymentMethod: "Cash",
      ownershipConfirmed: true,
      notStolenConfirmed: true,
      icloudRemoved: true,
      googleLockRemoved: true,
      otherLockRemoved: false,
      factoryResetConfirmed: true,
      signaturePath: null,
      shopkeeperSignaturePath: null,
      files: []
    },
    sampleShop
  );

  const repairPath = await generateRepairOrderPdf(
    {
      userId,
      repairOrderNumber: "RO-TEST-001",
      createdAt: new Date("2026-06-10"),
      customerName: "Anna Schmidt",
      customerPhone: "+43 699 9876543",
      customerEmail: "anna@example.com",
      customerAddress: "Ringstraße 5, 1010 Wien",
      deviceType: "Laptop",
      brand: "Dell",
      model: "XPS 15",
      imeiOrSerial: "SN-DELL-9988",
      passwordPin: "****",
      accessoriesReceived: "charger,powerSupply",
      problemDescription: "Screen flickers intermittently after Windows update.",
      visibleDamage: "Small dent on corner",
      technicianNotes: "Check display cable and GPU drivers.",
      estimatedPrice: 189.5,
      depositAmount: 50,
      expectedCompletionDate: new Date("2026-06-17"),
      status: "In Progress"
    },
    sampleShop
  );

  const invoicePathDe = await generateInvoicePdf(
    {
      userId,
      invoiceNumber: "INV-001",
      invoiceDate: new Date("2026-06-10"),
      customerName: "Anna Schmidt",
      customerAddress: "Ringstraße 5, 1010 Wien",
      customerPhone: "+43 699 9876543",
      customerEmail: "anna@example.com",
      deviceSummary: "Dell XPS 15",
      repairSummary: "Display repair and cable replacement",
      paymentMethod: "Bank transfer",
      paymentStatus: "Unpaid",
      calculatedNetAmount: 125,
      calculatedVatAmount: 25,
      calculatedGrossTotal: 150,
      netAmountOverride: null,
      vatAmountOverride: null,
      grossTotalOverride: null,
      notes: "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
      items: [
        {
          description: "Display cable replacement",
          quantity: 1,
          unitPrice: 80,
          vatPercent: 20,
          lineNet: 67,
          lineVat: 13,
          lineTotal: 80
        },
        {
          description: "Labour (1h)",
          quantity: 1,
          unitPrice: 70,
          vatPercent: 20,
          lineNet: 58,
          lineVat: 12,
          lineTotal: 70
        }
      ]
    },
    sampleShop,
    "de"
  );

  const invoicePathEn = await generateInvoicePdf(
    {
      userId,
      invoiceNumber: "INV-001-EN",
      invoiceDate: new Date("2026-06-10"),
      customerName: "Anna Schmidt",
      customerAddress: "Ringstraße 5, 1010 Wien",
      customerPhone: "+43 699 9876543",
      customerEmail: "anna@example.com",
      deviceSummary: "Dell XPS 15",
      repairSummary: "Display repair and cable replacement",
      paymentMethod: "Bank transfer",
      paymentStatus: "Unpaid",
      calculatedNetAmount: 125,
      calculatedVatAmount: 25,
      calculatedGrossTotal: 150,
      netAmountOverride: null,
      vatAmountOverride: null,
      grossTotalOverride: null,
      notes: "Payment due within 14 days.",
      items: [
        {
          description: "Display cable replacement",
          quantity: 1,
          unitPrice: 80,
          vatPercent: 20,
          lineNet: 67,
          lineVat: 13,
          lineTotal: 80
        },
        {
          description: "Labour (1h)",
          quantity: 1,
          unitPrice: 70,
          vatPercent: 20,
          lineNet: 58,
          lineVat: 12,
          lineTotal: 70
        }
      ]
    },
    sampleShop,
    "en"
  );

  console.log("Contract PDF:", contractPath);
  console.log("Repair Order PDF:", repairPath);
  console.log("Invoice PDF (DE):", invoicePathDe);
  console.log("Invoice PDF (EN):", invoicePathEn);
  console.log("All three PDFs generated successfully.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

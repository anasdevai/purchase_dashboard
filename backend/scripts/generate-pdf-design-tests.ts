import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/config/prisma.js";
import { generatePdfForContract } from "../src/services/contractService.js";
import { generatePdfForInvoice } from "../src/services/invoiceService.js";
import { generatePdfForQuotation } from "../src/services/quotationService.js";
import { generatePdfForRepairOrder } from "../src/services/repairOrderService.js";
import { toAbsolutePath } from "../src/utils/paths.js";

async function main() {
const outputDir = path.resolve(process.cwd(), "storage", "pdf-design-tests");
await fs.promises.mkdir(outputDir, { recursive: true });

const records = {
  invoice: await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } }),
  repairOrder: await prisma.repairOrder.findFirst({ orderBy: { createdAt: "desc" } }),
  quotation: await prisma.quotation.findFirst({ orderBy: { createdAt: "desc" } }),
  contract: await prisma.contract.findFirst({ where: { status: "Completed" }, orderBy: { createdAt: "desc" } })
};

const generated: Array<[string, string | null | undefined]> = [];
if (records.invoice) generated.push(["invoice.pdf", (await generatePdfForInvoice(records.invoice.id, records.invoice.userId, "en")).pdfPath]);
if (records.repairOrder) generated.push(["repair-order.pdf", (await generatePdfForRepairOrder(records.repairOrder.id, records.repairOrder.userId)).pdfPath]);
if (records.quotation) generated.push(["quotation.pdf", (await generatePdfForQuotation(records.quotation.id, records.quotation.userId)).pdfPath]);
if (records.contract) generated.push(["contract.pdf", (await generatePdfForContract(records.contract.id, records.contract.userId)).pdfPath]);

for (const [filename, storedPath] of generated) {
  if (storedPath) await fs.promises.copyFile(toAbsolutePath(storedPath), path.join(outputDir, filename));
}

console.log(JSON.stringify({ outputDir, files: generated.map(([name]) => name) }, null, 2));
await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

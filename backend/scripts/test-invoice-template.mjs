import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { renderInvoiceHtml } from "../src/pdf/templates/invoiceTemplate.js";
import { shopSettingsToPdf, getShopSettingsForUser } from "../src/services/settingsService.js";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const invoice = await prisma.invoice.findFirst({
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  if (!invoice) {
    console.log("No invoice found");
    return;
  }

  const shopSettings = shopSettingsToPdf(await getShopSettingsForUser(invoice.userId));
  try {
    const html = renderInvoiceHtml(invoice, shopSettings, "en");
    console.log("HTML rendered OK, length:", html.length);
  } catch (error) {
    console.error("Template render failed:", error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

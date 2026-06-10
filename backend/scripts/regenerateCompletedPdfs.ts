import { PrismaClient } from "@prisma/client";
import { generateContractPdf } from "../src/services/pdfService.js";
import { getShopSettingsForUser, shopSettingsToPdf } from "../src/services/settingsService.js";

const prisma = new PrismaClient();

const regenerateCompletedPdfs = async () => {
  const completedContracts = await prisma.contract.findMany({
    where: { status: "Completed" },
    include: { files: true },
    orderBy: { createdAt: "desc" }
  });

  for (const contract of completedContracts) {
    const shopSettings = shopSettingsToPdf(await getShopSettingsForUser(contract.userId));
    const pdfPath = await generateContractPdf(contract, shopSettings);
    await prisma.contract.update({
      where: { id: contract.id },
      data: { pdfPath }
    });
    console.log(`Regenerated ${contract.contractNumber}: ${pdfPath}`);
  }

  if (completedContracts.length === 0) {
    console.log("No completed contracts found.");
  }
};

regenerateCompletedPdfs().finally(async () => {
  await prisma.$disconnect();
});

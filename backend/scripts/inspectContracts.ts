import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const inspectContracts = async () => {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { files: true }
  });

  console.log(
    JSON.stringify(
      contracts.map((contract) => ({
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        customerName: contract.customerName,
        model: contract.model,
        purchasePrice: contract.purchasePrice?.toString(),
        signaturePath: contract.signaturePath,
        shopkeeperSignaturePath: contract.shopkeeperSignaturePath,
        pdfPath: contract.pdfPath,
        files: contract.files.map((file) => ({
          fileType: file.fileType,
          filePath: file.filePath
        }))
      })),
      null,
      2
    )
  );
};

inspectContracts().finally(async () => {
  await prisma.$disconnect();
});

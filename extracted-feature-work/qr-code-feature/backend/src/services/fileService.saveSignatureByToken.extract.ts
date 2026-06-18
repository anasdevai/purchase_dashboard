// Original path: backend/src/services/fileService.ts
// Extracted: persist customer signature submitted via public QR/mobile token route

export const saveSignatureByToken = async (
  contractId: string,
  contractUserId: string,
  contractNumber: string,
  file: Express.Multer.File
) => {
  const storageDir = getContractStorageDir(contractUserId, contractNumber);
  await ensureDirectory(storageDir);

  const filename = "signature.png";
  const absolutePath = path.join(storageDir, filename);
  await fs.promises.writeFile(absolutePath, file.buffer);

  const signaturePath = toRelativeStoragePath(absolutePath);
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      signaturePath,
      signatureStatus: "SIGNED"
    }
  });
};

// Depends on: getContractStorageDir, ensureDirectory, toRelativeStoragePath, prisma, path, fs

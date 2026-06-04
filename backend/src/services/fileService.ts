import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { ensureDirectory, getContractStorageDir, toRelativeStoragePath } from "../utils/paths.js";
import { fileTypeSchema } from "../validators/fileValidators.js";

const extensionByMimeType: Record<string, string> = {
  "image/png": ".png",
  "image/svg+xml": ".svg"
};

const getOwnedContract = async (contractId: string, userId: string) => {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, userId },
    select: { id: true, userId: true, contractNumber: true, status: true }
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found");
  }

  return contract;
};

export const saveContractUpload = async (
  contractId: string,
  userId: string,
  fileTypeInput: string,
  file: Express.Multer.File
) => {
  const fileType = fileTypeSchema.parse(fileTypeInput);
  const contract = await getOwnedContract(contractId, userId);

  if (contract.status !== "Draft") {
    throw new HttpError(409, "Files can only be uploaded to draft contracts");
  }

  const extension = extensionByMimeType[file.mimetype];
  if (!extension) {
    throw new HttpError(400, "Document uploads must be PNG or SVG");
  }

  const storageDir = getContractStorageDir(userId, contract.contractNumber);
  await ensureDirectory(storageDir);

  const canHaveMultipleFiles = fileType === "other" || fileType === "damage_photo";
  const basename = `${fileType}${canHaveMultipleFiles ? `-${Date.now()}` : ""}${extension}`;
  const absolutePath = path.join(storageDir, basename);
  await fs.promises.writeFile(absolutePath, file.buffer);

  const filePath = toRelativeStoragePath(absolutePath);
  if (!canHaveMultipleFiles) {
    await prisma.contractFile.deleteMany({
      where: {
        contractId: contract.id,
        fileType
      }
    });
  }

  const created = await prisma.contractFile.create({
    data: {
      contractId: contract.id,
      fileType,
      filePath
    }
  });

  return created;
};

export const saveSignature = async (
  contractId: string,
  userId: string,
  file: Express.Multer.File,
  role: "customer" | "shopkeeper" = "customer"
) => {
  const contract = await getOwnedContract(contractId, userId);

  if (contract.status !== "Draft") {
    throw new HttpError(409, "Signature can only be saved for draft contracts");
  }

  const extension = extensionByMimeType[file.mimetype];
  if (!extension || extension !== ".png") {
    throw new HttpError(400, "Signature must be uploaded as a PNG image");
  }

  const storageDir = getContractStorageDir(userId, contract.contractNumber);
  await ensureDirectory(storageDir);

  const filename = role === "shopkeeper" ? "shopkeeper_signature.png" : "signature.png";
  const absolutePath = path.join(storageDir, filename);
  await fs.promises.writeFile(absolutePath, file.buffer);

  const signaturePath = toRelativeStoragePath(absolutePath);
  return prisma.contract.update({
    where: { id: contract.id },
    data: role === "shopkeeper" ? { shopkeeperSignaturePath: signaturePath } : { signaturePath }
  });
};

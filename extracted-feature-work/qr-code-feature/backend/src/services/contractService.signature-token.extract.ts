// Original path: backend/src/services/contractService.ts
// Extracted: signature token generation, status polling, public token lookup/submit

import crypto from "node:crypto";
import { saveSignatureByToken } from "./fileService.js";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

export const generateSignatureToken = async (id: string, userId: string) => {
  const contract = await getContractOrThrow(id, userId);

  if (contract.status !== "Draft") {
    throw new HttpError(409, "Only draft contracts can have signatures generated");
  }

  const token = crypto.randomBytes(24).toString("hex");

  return prisma.contract.update({
    where: { id },
    data: {
      signatureToken: token,
      signatureStatus: "PENDING"
    }
  });
};

export const getSignatureStatus = async (id: string, userId: string) => {
  const contract = await prisma.contract.findFirst({
    where: { id, userId },
    select: { signatureStatus: true, signatureToken: true }
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found");
  }

  return {
    status: contract.signatureStatus ?? "NONE",
    token: contract.signatureToken ?? null
  };
};

export const getContractBySignatureToken = async (token: string) => {
  const contract = await prisma.contract.findFirst({
    where: { signatureToken: token, status: "Draft" }
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found or already completed");
  }

  return contract;
};

export const submitSignatureByToken = async (token: string, file: Express.Multer.File) => {
  const contract = await prisma.contract.findFirst({
    where: { signatureToken: token, status: "Draft" }
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found or already completed");
  }

  return saveSignatureByToken(contract.id, contract.userId, contract.contractNumber, file);
};

// Depends on getContractOrThrow from the same file (not shown).

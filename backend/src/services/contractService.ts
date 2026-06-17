import fs from "node:fs";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { completeContractSchema, draftContractSchema, searchContractsSchema } from "../validators/contractValidators.js";
import { requiredCompletionFileTypes } from "../validators/fileValidators.js";
import { getDayRange } from "../utils/date.js";
import { HttpError } from "../utils/httpError.js";
import { ensureDirectory, getContractStorageDir } from "../utils/paths.js";
import { generateContractNumber } from "./numberingService.js";
import { generateContractPdf } from "./pdfService.js";
import { getShopSettingsForUser, shopSettingsToPdf } from "./settingsService.js";

const includeFiles = {
  files: true
};

const decimalToNumber = (value: { toString: () => string } | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
};

const toContractData = (input: Record<string, unknown>) => {
  const parsed = draftContractSchema.parse(input);
  return parsed;
};

type ContractWithFiles = Awaited<ReturnType<typeof getContractOrThrow>>;
type ContractData = ReturnType<typeof toContractData>;

const buildIdentifierConflictWhere = (userId: string, data: ContractData, excludeId?: string) => {
  const OR = [];

  if (data.imei) {
    OR.push({ imei: { equals: data.imei, mode: "insensitive" as const } });
    OR.push({ serialNumber: { equals: data.imei, mode: "insensitive" as const } });
  }

  if (data.serialNumber) {
    OR.push({ serialNumber: { equals: data.serialNumber, mode: "insensitive" as const } });
    OR.push({ imei: { equals: data.serialNumber, mode: "insensitive" as const } });
  }

  if (OR.length === 0) return null;

  return {
    userId,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    status: { not: "Cancelled" as const },
    OR
  };
};

const assertUniqueDeviceIdentifiers = async (
  userId: string,
  data: ContractData,
  excludeId?: string
) => {
  const where = buildIdentifierConflictWhere(userId, data, excludeId);
  if (!where) return;

  const conflict = await prisma.contract.findFirst({
    where,
    select: {
      contractNumber: true,
      imei: true,
      serialNumber: true
    }
  });

  if (!conflict) return;

  const duplicateFields = [];
  if (
    data.imei &&
    (conflict.imei?.toLowerCase() === data.imei.toLowerCase() ||
      conflict.serialNumber?.toLowerCase() === data.imei.toLowerCase())
  ) {
    duplicateFields.push("IMEI");
  }
  if (
    data.serialNumber &&
    (conflict.serialNumber?.toLowerCase() === data.serialNumber.toLowerCase() ||
      conflict.imei?.toLowerCase() === data.serialNumber.toLowerCase())
  ) {
    duplicateFields.push("serial number");
  }

  throw new HttpError(
    409,
    `${duplicateFields.join(" and ")} already exists on contract ${conflict.contractNumber}`,
    {
      contractNumber: conflict.contractNumber,
      duplicateFields
    }
  );
};

export const validateDeviceIdentifiers = async (userId: string, query: Record<string, unknown>) => {
  const data = toContractData({
    imei: query.imei,
    serialNumber: query.serialNumber
  });
  const excludeId = typeof query.excludeId === "string" ? query.excludeId : undefined;

  await assertUniqueDeviceIdentifiers(userId, data, excludeId);

  return { valid: true };
};

const toCompletionValidationInput = (contract: ContractWithFiles) => ({
  customerName: contract.customerName ?? undefined,
  customerAddress: contract.customerAddress ?? undefined,
  customerPhone: contract.customerPhone ?? undefined,
  customerEmail: contract.customerEmail ?? undefined,
  customerDateOfBirth: contract.customerDateOfBirth ?? undefined,
  idDocumentNumber: contract.idDocumentNumber ?? undefined,
  deviceType: contract.deviceType ?? undefined,
  brand: contract.brand ?? undefined,
  model: contract.model ?? undefined,
  imei: contract.imei ?? undefined,
  serialNumber: contract.serialNumber ?? undefined,
  storage: contract.storage ?? undefined,
  color: contract.color ?? undefined,
  condition: contract.condition ?? undefined,
  accessories: contract.accessories ?? undefined,
  batteryHealth: contract.batteryHealth ?? undefined,
  damageNotes: contract.damageNotes ?? undefined,
  internalNotes: contract.internalNotes ?? undefined,
  purchasePrice: contract.purchasePrice ? contract.purchasePrice.toString() : undefined,
  paymentMethod: contract.paymentMethod ?? undefined,
  ownershipConfirmed: contract.ownershipConfirmed,
  notStolenConfirmed: contract.notStolenConfirmed,
  icloudRemoved: contract.icloudRemoved,
  googleLockRemoved: contract.googleLockRemoved,
  otherLockRemoved: contract.otherLockRemoved,
  factoryResetConfirmed: contract.factoryResetConfirmed
});

export const getContractOrThrow = async (id: string, userId: string, isAdmin = false) => {
  const contract = await prisma.contract.findFirst({
    where: isAdmin ? { id } : { id, userId },
    include: includeFiles
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found");
  }

  return contract;
};

export const createDraftContract = async (userId: string, input: Record<string, unknown>) => {
  const data = toContractData(input);
  await assertUniqueDeviceIdentifiers(userId, data);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const contractNumber = await generateContractNumber(userId);

    try {
      const contract = await prisma.contract.create({
        data: {
          userId,
          contractNumber,
          ...data
        },
        include: includeFiles
      });

      await ensureDirectory(getContractStorageDir(userId, contract.contractNumber));
      return contract;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new HttpError(500, "Unable to generate contract number");
};

export const updateDraftContract = async (
  id: string,
  userId: string,
  input: Record<string, unknown>
) => {
  const contract = await getContractOrThrow(id, userId);

  if (contract.status !== "Draft") {
    throw new HttpError(409, "Only draft contracts can be edited");
  }

  const data = toContractData(input);
  await assertUniqueDeviceIdentifiers(userId, data, id);

  return prisma.contract.update({
    where: { id },
    data,
    include: includeFiles
  });
};

const assertCompletionFiles = (contract: ContractWithFiles) => {
  const presentTypes = new Set(contract.files.map((file) => file.fileType));
  const missingFileTypes = requiredCompletionFileTypes.filter((fileType) => !presentTypes.has(fileType));

  if (missingFileTypes.length > 0) {
    throw new HttpError(400, "Required uploads are missing", { missingFileTypes });
  }

  if (!contract.signaturePath) {
    throw new HttpError(400, "Customer signature is required before completion");
  }

  if (!contract.shopkeeperSignaturePath) {
    throw new HttpError(400, "Shopkeeper signature is required before completion");
  }
};

const extractCompletionInput = (input: Record<string, unknown>) => {
  const { shopSettings: _shopSettings, ...contractInput } = input;
  return { contractInput };
};

export const completeContract = async (
  id: string,
  userId: string,
  input: Record<string, unknown>
) => {
  const existing = await getContractOrThrow(id, userId);

  if (existing.status !== "Draft") {
    throw new HttpError(409, "Only draft contracts can be completed");
  }

  const { contractInput } = extractCompletionInput(input);

  if (Object.keys(contractInput).length > 0) {
    await updateDraftContract(id, userId, contractInput);
  }

  const contract = await getContractOrThrow(id, userId);
  completeContractSchema.parse(toCompletionValidationInput(contract));
  await assertUniqueDeviceIdentifiers(
    userId,
    {
      imei: contract.imei ?? undefined,
      serialNumber: contract.serialNumber ?? undefined
    },
    id
  );
  assertCompletionFiles(contract);

  const pdfShopSettings = shopSettingsToPdf(await getShopSettingsForUser(userId));

  const pdfPath = await generateContractPdf(
    {
      ...contract,
      status: "Completed"
    },
    pdfShopSettings
  );

  return prisma.contract.update({
    where: { id },
    data: { status: "Completed", pdfPath },
    include: includeFiles
  });
};

export const cancelContract = async (id: string, userId: string, isAdmin = false) => {
  const contract = await getContractOrThrow(id, userId, isAdmin);

  await prisma.contract.delete({
    where: { id }
  });

  await fs.promises.rm(getContractStorageDir(contract.userId, contract.contractNumber), {
    recursive: true,
    force: true
  });

  return {
    id: contract.id,
    contractNumber: contract.contractNumber
  };
};

export const searchContracts = async (userId: string, query: Record<string, unknown>) => {
  const parsed = searchContractsSchema.parse(query);
  const where: Record<string, unknown> = {
    userId,
    status: { not: "Cancelled" }
  };

  if (parsed.q) {
    where.OR = [
      { contractNumber: { contains: parsed.q, mode: "insensitive" } },
      { customerName: { contains: parsed.q, mode: "insensitive" } },
      { customerPhone: { contains: parsed.q, mode: "insensitive" } },
      { brand: { contains: parsed.q, mode: "insensitive" } },
      { model: { contains: parsed.q, mode: "insensitive" } },
      { imei: { contains: parsed.q, mode: "insensitive" } },
      { serialNumber: { contains: parsed.q, mode: "insensitive" } }
    ];
  }

  if (parsed.customerName) where.customerName = { contains: parsed.customerName, mode: "insensitive" };
  if (parsed.phone) where.customerPhone = { contains: parsed.phone, mode: "insensitive" };
  if (parsed.imei) where.imei = { contains: parsed.imei, mode: "insensitive" };
  if (parsed.serialNumber) where.serialNumber = { contains: parsed.serialNumber, mode: "insensitive" };
  if (parsed.model) where.model = { contains: parsed.model, mode: "insensitive" };
  if (parsed.contractNumber) where.contractNumber = { contains: parsed.contractNumber, mode: "insensitive" };
  if (parsed.status && parsed.status !== "Cancelled") where.status = parsed.status;

  if (parsed.date) {
    const range = getDayRange(parsed.date);
    if (!range) {
      throw new HttpError(400, "Invalid date filter");
    }
    where.createdAt = { gte: range.start, lt: range.end };
  }

  return prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      contractNumber: true,
      customerName: true,
      brand: true,
      model: true,
      imei: true,
      serialNumber: true,
      purchasePrice: true,
      status: true,
      pdfPath: true,
      createdAt: true
    }
  });
};

export const getRecentContracts = async (userId: string) =>
  prisma.contract.findMany({
    where: {
      userId,
      status: { not: "Cancelled" }
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      contractNumber: true,
      customerName: true,
      brand: true,
      model: true,
      imei: true,
      serialNumber: true,
      purchasePrice: true,
      status: true,
      pdfPath: true,
      createdAt: true
    }
  });


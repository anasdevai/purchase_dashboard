import fs from "node:fs";
import path from "node:path";

export const projectRoot = path.resolve(process.cwd());
export const storageRoot = path.join(projectRoot, "storage");
export const contractsRoot = path.join(storageRoot, "contracts");
export const repairOrdersRoot = path.join(storageRoot, "repair-orders");
export const invoicesRoot = path.join(storageRoot, "invoices");

export const ensureDirectory = async (dirPath: string) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

export const getContractStorageDir = (userId: string, contractNumber: string) =>
  path.join(contractsRoot, userId, contractNumber);

export const getRepairOrderStorageDir = (userId: string, repairOrderNumber: string) =>
  path.join(repairOrdersRoot, userId, repairOrderNumber);

export const getInvoiceStorageDir = (userId: string, invoiceNumber: string) =>
  path.join(invoicesRoot, userId, invoiceNumber);

export const toRelativeStoragePath = (absolutePath: string) =>
  path.relative(projectRoot, absolutePath).replace(/\\/g, "/");

export const toAbsolutePath = (storedPath: string) =>
  path.isAbsolute(storedPath) ? storedPath : path.join(projectRoot, storedPath);

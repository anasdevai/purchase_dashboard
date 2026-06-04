import fs from "node:fs";
import path from "node:path";

export const projectRoot = path.resolve(process.cwd());
export const storageRoot = path.join(projectRoot, "storage");
export const contractsRoot = path.join(storageRoot, "contracts");

export const ensureDirectory = async (dirPath: string) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

export const getContractStorageDir = (userId: string, contractNumber: string) =>
  path.join(contractsRoot, userId, contractNumber);

export const toRelativeStoragePath = (absolutePath: string) =>
  path.relative(projectRoot, absolutePath).replace(/\\/g, "/");

export const toAbsolutePath = (storedPath: string) =>
  path.isAbsolute(storedPath) ? storedPath : path.join(projectRoot, storedPath);


import type { Request, Response } from "express";
import * as contractService from "../services/contractService.js";
import * as fileService from "../services/fileService.js";
import { HttpError } from "../utils/httpError.js";
import { toAbsolutePath } from "../utils/paths.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

export const createDraft = async (req: Request, res: Response) => {
  const contract = await contractService.createDraftContract(userId(req), req.body);
  res.status(201).json({ contract });
};

export const updateDraft = async (req: Request, res: Response) => {
  const contract = await contractService.updateDraftContract(paramId(req), userId(req), req.body);
  res.json({ contract });
};

export const getContract = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(paramId(req), userId(req));
  res.json({ contract });
};

export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "Image file is required");
  }

  const file = await fileService.saveContractUpload(
    paramId(req),
    userId(req),
    req.body.fileType,
    req.file
  );
  res.status(201).json({ file });
};

export const uploadSignature = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "Signature PNG file is required");
  }

  const role = req.body.role === "shopkeeper" ? "shopkeeper" : "customer";
  const contract = await fileService.saveSignature(paramId(req), userId(req), req.file, role);
  res.json({ contract });
};

export const complete = async (req: Request, res: Response) => {
  const contract = await contractService.completeContract(paramId(req), userId(req), req.body);
  res.json({ contract });
};

export const cancel = async (req: Request, res: Response) => {
  const contract = await contractService.cancelContract(paramId(req), userId(req));
  res.json({ deleted: true, contract });
};

export const search = async (req: Request, res: Response) => {
  const contracts = await contractService.searchContracts(userId(req), req.query);
  res.json({ contracts });
};

export const validateIdentifiers = async (req: Request, res: Response) => {
  const result = await contractService.validateDeviceIdentifiers(userId(req), req.query);
  res.json(result);
};

export const dashboard = async (req: Request, res: Response) => {
  const dashboardSummary = await contractService.getDashboardSummary(userId(req));
  res.json(dashboardSummary);
};

export const openPdf = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(paramId(req), userId(req));

  if (!contract.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this contract");
  }

  res.sendFile(toAbsolutePath(contract.pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(paramId(req), userId(req));

  if (!contract.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this contract");
  }

  res.download(toAbsolutePath(contract.pdfPath), `${contract.contractNumber}.pdf`);
};

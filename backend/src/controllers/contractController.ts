import type { Request, Response } from "express";
import * as contractService from "../services/contractService.js";
import * as dashboardService from "../services/dashboardService.js";
import * as fileService from "../services/fileService.js";
import * as emailService from "../services/emailService.js";
import { HttpError } from "../utils/httpError.js";
import { toAbsolutePath } from "../utils/paths.js";
import { getSignatureUrl } from "../utils/lanIp.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

const enrichContract = (req: Request, contract: any) => {
  if (!contract) return contract;
  const origin = req.get("origin") || req.get("referer");
  const token = contract.signatureToken;
  const qrUrl = token ? getSignatureUrl(origin, token) : null;
  return { ...contract, qrUrl };
};

export const createDraft = async (req: Request, res: Response) => {
  const contract = await contractService.createDraftContract(userId(req), req.body);
  res.status(201).json({ contract: enrichContract(req, contract) });
};

export const updateDraft = async (req: Request, res: Response) => {
  const contract = await contractService.updateDraftContract(paramId(req), userId(req), req.body);
  res.json({ contract: enrichContract(req, contract) });
};

export const getContract = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ contract: enrichContract(req, contract) });
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
  res.json({ contract: enrichContract(req, contract) });
};

export const complete = async (req: Request, res: Response) => {
  const contract = await contractService.completeContract(paramId(req), userId(req), req.body);
  res.json({ contract: enrichContract(req, contract) });
};

export const cancel = async (req: Request, res: Response) => {
  const contract = await contractService.cancelContract(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  res.json({ deleted: true, contract });
};

export const search = async (req: Request, res: Response) => {
  const contracts = await contractService.searchContracts(userId(req), req.query);
  res.json({ contracts: contracts.map((c) => enrichContract(req, c)) });
};

export const validateIdentifiers = async (req: Request, res: Response) => {
  const result = await contractService.validateDeviceIdentifiers(userId(req), req.query);
  res.json(result);
};

export const dashboard = async (req: Request, res: Response) => {
  const dashboardSummary = await dashboardService.getDashboardSummary(userId(req));
  res.json(dashboardSummary);
};

export const openPdf = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!contract.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this contract");
  }

  res.sendFile(toAbsolutePath(contract.pdfPath));
};

export const downloadPdf = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!contract.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this contract");
  }

  res.download(toAbsolutePath(contract.pdfPath), `${contract.contractNumber}.pdf`);
};

export const generateSignatureQr = async (req: Request, res: Response) => {
  const contract = await contractService.generateSignatureToken(paramId(req), userId(req));
  const origin = req.get("origin") || req.get("referer");
  const qrUrl = contract.signatureToken ? getSignatureUrl(origin, contract.signatureToken) : null;
  res.json({
    token: contract.signatureToken,
    status: contract.signatureStatus,
    qrUrl
  });
};

export const getSignatureStatus = async (req: Request, res: Response) => {
  const status = await contractService.getSignatureStatus(paramId(req), userId(req));
  res.json(status);
};

export const getSignatureContract = async (req: Request, res: Response) => {
  const contract = await contractService.getContractBySignatureToken(String(req.params.token));
  res.json({ contract: enrichContract(req, contract) });
};

export const submitSignatureByToken = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "Signature PNG file is required");
  }
  const contract = await contractService.submitSignatureByToken(String(req.params.token), req.file);
  res.json({ success: true, status: contract.signatureStatus });
};

export const sendEmail = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!contract.customerEmail) {
    throw new HttpError(400, "Contract does not have a customer email address configured");
  }

  if (!contract.pdfPath) {
    throw new HttpError(400, "Contract PDF has not been generated yet");
  }

  await emailService.sendContractPdfEmail(
    userId(req),
    contract.customerEmail,
    contract.contractNumber,
    contract.pdfPath,
    contract.customerName,
    contract.salutation,
    contract.customerLastName
  );

  res.json({ success: true });
};

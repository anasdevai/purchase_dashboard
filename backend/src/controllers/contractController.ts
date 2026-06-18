import type { Request, Response } from "express";
import * as contractService from "../services/contractService.js";
import * as dashboardService from "../services/dashboardService.js";
import * as emailService from "../services/emailService.js";
import * as fileService from "../services/fileService.js";
import { HttpError } from "../utils/httpError.js";
import { getSignatureUrl } from "../utils/lanIp.js";
import { toAbsolutePath } from "../utils/paths.js";

const paramId = (req: Request) => String(req.params.id);
const userId = (req: Request) => req.user!.id;

const enrichContract = (req: Request, contract: Record<string, unknown> | null) => {
  if (!contract) return contract;
  const origin = req.get("origin") || req.get("referer");
  const token = contract.signatureToken as string | null | undefined;
  const qrUrl = token ? getSignatureUrl(origin, token) : null;
  return { ...contract, qrUrl };
};

const respondWithContract = (req: Request, res: Response, contract: Record<string, unknown>, status = 200) => {
  res.status(status).json({ contract: enrichContract(req, contract) });
};

export const createDraft = async (req: Request, res: Response) => {
  const contract = await contractService.createDraftContract(userId(req), req.body);
  respondWithContract(req, res, contract as Record<string, unknown>, 201);
};

export const updateDraft = async (req: Request, res: Response) => {
  const contract = await contractService.updateDraftContract(paramId(req), userId(req), req.body);
  respondWithContract(req, res, contract as Record<string, unknown>);
};

export const getContract = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );
  respondWithContract(req, res, contract as Record<string, unknown>);
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
  respondWithContract(req, res, contract as Record<string, unknown>);
};

export const complete = async (req: Request, res: Response) => {
  const contract = await contractService.completeContract(paramId(req), userId(req), req.body);
  respondWithContract(req, res, contract as Record<string, unknown>);
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
  res.json({
    contracts: contracts.map((contract) => enrichContract(req, contract as Record<string, unknown>))
  });
};

export const validateIdentifiers = async (req: Request, res: Response) => {
  const result = await contractService.validateDeviceIdentifiers(userId(req), req.query);
  res.json(result);
};

export const dashboard = async (req: Request, res: Response) => {
  const dashboardSummary = await dashboardService.getDashboardSummary(userId(req));
  res.json(dashboardSummary);
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
  respondWithContract(req, res, contract as Record<string, unknown>);
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
    contract.customerEmail,
    contract.contractNumber,
    contract.pdfPath,
    contract.customerName,
    contract.salutation,
    contract.customerLastName
  );

  res.json({ success: true });
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

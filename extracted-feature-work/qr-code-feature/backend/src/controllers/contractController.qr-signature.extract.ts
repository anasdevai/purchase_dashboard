// Original path: backend/src/controllers/contractController.ts
// Extracted: QR signature URL enrichment, token generation, public signature endpoints

import type { Request, Response } from "express";
import * as contractService from "../services/contractService.js";
import { HttpError } from "../utils/httpError.js";
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

// Note: enrichContract is also applied to createDraft, updateDraft, getContract, search, uploadSignature, complete responses.

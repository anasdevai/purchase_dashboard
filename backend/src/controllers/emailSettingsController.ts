import type { Request, Response } from "express";
import * as emailSettingsService from "../services/emailSettingsService.js";
import { HttpError } from "../utils/httpError.js";

export const getEmailSettings = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const smtp = await emailSettingsService.getSmtpSettings(userId);
  const imap = await emailSettingsService.getImapSettings(userId);
  const templates = await emailSettingsService.getEmailTemplates(userId);
  res.json({ smtp, imap, templates });
};

export const updateSmtpSettings = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const smtp = await emailSettingsService.saveSmtpSettings(userId, req.body);
  res.json({ smtp });
};

export const updateImapSettings = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const imap = await emailSettingsService.saveImapSettings(userId, req.body);
  res.json({ imap });
};

export const testSmtpConnection = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const testEmail = req.body.testEmail || req.user?.email;

  if (!testEmail) {
    throw new HttpError(400, "Test email address is required");
  }

  const result = await emailSettingsService.testSmtpConnection(userId, testEmail);
  res.json(result);
};

export const saveEmailTemplate = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const template = await emailSettingsService.saveEmailTemplate(userId, req.body);
  res.json({ template });
};

export const previewTemplate = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const name = req.query.name || req.params.name;

  if (!name || typeof name !== "string") {
    throw new HttpError(400, "Template name is required");
  }

  const preview = await emailSettingsService.previewCompiledTemplate(userId, name);
  res.json({ preview });
};

export const getEmailLogs = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const logsData = await emailSettingsService.getEmailLogs(userId, page, limit);
  res.json(logsData);
};

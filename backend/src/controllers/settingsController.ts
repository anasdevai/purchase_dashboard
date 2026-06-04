import type { Request, Response } from "express";
import * as settingsService from "../services/settingsService.js";

export const getSettings = async (req: Request, res: Response) => {
  const settings = await settingsService.getShopSettingsForUser(req.user!.id);
  res.json({ settings });
};

export const saveSettings = async (req: Request, res: Response) => {
  const settings = await settingsService.saveShopSettingsForUser(req.user!.id, req.body);
  res.json({ settings });
};

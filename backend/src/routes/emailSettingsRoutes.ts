import { Router } from "express";
import {
  getEmailSettings,
  updateSmtpSettings,
  updateImapSettings,
  testSmtpConnection,
  saveEmailTemplate,
  previewTemplate,
  getEmailLogs,
} from "../controllers/emailSettingsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const emailSettingsRouter = Router();

emailSettingsRouter.get("/", requireAuth, asyncHandler(getEmailSettings));
emailSettingsRouter.put("/smtp", requireAuth, asyncHandler(updateSmtpSettings));
emailSettingsRouter.put("/imap", requireAuth, asyncHandler(updateImapSettings));
emailSettingsRouter.post("/smtp/test", requireAuth, asyncHandler(testSmtpConnection));
emailSettingsRouter.put("/templates", requireAuth, asyncHandler(saveEmailTemplate));
emailSettingsRouter.get("/templates/preview", requireAuth, asyncHandler(previewTemplate));
emailSettingsRouter.get("/templates/preview/:name", requireAuth, asyncHandler(previewTemplate));

export const emailLogsRouter = Router();

emailLogsRouter.get("/", requireAuth, asyncHandler(getEmailLogs));

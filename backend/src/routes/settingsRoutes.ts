import { Router } from "express";
import { getSettings, saveSettings } from "../controllers/settingsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const settingsRouter = Router();

settingsRouter.get("/", requireAuth, asyncHandler(getSettings));
settingsRouter.put("/", requireAuth, asyncHandler(saveSettings));


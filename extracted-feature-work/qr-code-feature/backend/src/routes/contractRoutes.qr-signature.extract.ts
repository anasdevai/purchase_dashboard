// Original path: backend/src/routes/contractRoutes.ts
// Extracted: public mobile signature routes + authenticated QR/status routes

import { Router } from "express";
import * as contractController from "../controllers/contractController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contractRouter = Router();

// Public routes (no authentication required) — used by mobile QR signature page
contractRouter.get("/public/signature/:token", asyncHandler(contractController.getSignatureContract));
contractRouter.post("/public/signature/:token", upload.single("signature"), asyncHandler(contractController.submitSignatureByToken));

contractRouter.use(requireAuth);

// Authenticated QR signature routes
contractRouter.post("/:id/signature-qr", asyncHandler(contractController.generateSignatureQr));
contractRouter.get("/:id/signature-status", asyncHandler(contractController.getSignatureStatus));

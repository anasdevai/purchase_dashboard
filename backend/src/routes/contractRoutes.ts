import { Router } from "express";
import * as contractController from "../controllers/contractController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contractRouter = Router();

contractRouter.use(requireAuth);

contractRouter.get("/search", asyncHandler(contractController.search));
contractRouter.get("/validate-identifiers", asyncHandler(contractController.validateIdentifiers));
contractRouter.post("/draft", asyncHandler(contractController.createDraft));
contractRouter.get("/:id", asyncHandler(contractController.getContract));
contractRouter.patch("/:id/draft", asyncHandler(contractController.updateDraft));
contractRouter.post("/:id/files", upload.single("file"), asyncHandler(contractController.uploadFile));
contractRouter.post("/:id/signature", upload.single("signature"), asyncHandler(contractController.uploadSignature));
contractRouter.post("/:id/complete", asyncHandler(contractController.complete));
contractRouter.post("/:id/cancel", asyncHandler(contractController.cancel));
contractRouter.delete("/:id", asyncHandler(contractController.cancel));
contractRouter.get("/:id/pdf", asyncHandler(contractController.openPdf));
contractRouter.get("/:id/pdf/download", asyncHandler(contractController.downloadPdf));

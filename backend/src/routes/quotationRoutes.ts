import { Router } from "express";
import * as quotationController from "../controllers/quotationController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const quotationRouter = Router();

quotationRouter.use(requireAuth);

quotationRouter.get("/search", asyncHandler(quotationController.search));
quotationRouter.post("/", asyncHandler(quotationController.create));
quotationRouter.get("/:id", asyncHandler(quotationController.get));
quotationRouter.patch("/:id", asyncHandler(quotationController.update));
quotationRouter.patch("/:id/status", asyncHandler(quotationController.updateStatus));
quotationRouter.post("/:id/pdf", asyncHandler(quotationController.generatePdf));
quotationRouter.get("/:id/pdf", asyncHandler(quotationController.openPdf));
quotationRouter.get("/:id/pdf/download", asyncHandler(quotationController.downloadPdf));
quotationRouter.post("/:id/email", asyncHandler(quotationController.sendEmail));
quotationRouter.post("/:id/copy", asyncHandler(quotationController.copy));
quotationRouter.post("/:id/convert", asyncHandler(quotationController.convertToRepairOrder));
quotationRouter.delete("/:id", asyncHandler(quotationController.remove));

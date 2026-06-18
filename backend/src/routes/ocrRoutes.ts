import { Router } from "express";
import { extractRepairOrder } from "../controllers/ocrController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { ocrUpload } from "../middlewares/ocrUploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const ocrRouter = Router();

ocrRouter.use(requireAuth);

ocrRouter.post(
  "/repair-order",
  ocrUpload.single("file"),
  asyncHandler(extractRepairOrder),
);

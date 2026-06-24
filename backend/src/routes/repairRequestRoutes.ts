import { Router } from "express";
import {
  getWidgetSettings,
  getBrands,
  getDeviceTypes,
  getModels,
  getRepairTypes,
  getRepairPrice,
  createRequest,
  listRequests,
  updateStatus,
  convertRequest
} from "../controllers/repairRequestController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/uploadMiddleware.js";

// Router for public widget endpoints
export const publicWidgetRouter = Router();

publicWidgetRouter.get("/settings", asyncHandler(getWidgetSettings));
publicWidgetRouter.get("/brands", asyncHandler(getBrands));
publicWidgetRouter.get("/device-types", asyncHandler(getDeviceTypes));
publicWidgetRouter.get("/models", asyncHandler(getModels));
publicWidgetRouter.get("/repair-types", asyncHandler(getRepairTypes));
publicWidgetRouter.get("/price", asyncHandler(getRepairPrice));
publicWidgetRouter.post("/request", upload.single("photo"), asyncHandler(createRequest));

// Router for admin/authenticated request ticket inbox
export const repairRequestRouter = Router();

repairRequestRouter.get("/", requireAuth, asyncHandler(listRequests));
repairRequestRouter.patch("/:id/status", requireAuth, asyncHandler(updateStatus));
repairRequestRouter.post("/:id/convert", requireAuth, asyncHandler(convertRequest));

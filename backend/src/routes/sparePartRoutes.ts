import { Router } from "express";
import * as sparePartController from "../controllers/sparePartController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sparePartRouter = Router();

sparePartRouter.use(requireAuth);

sparePartRouter.get("/", asyncHandler(sparePartController.list));
sparePartRouter.get("/adjustments", asyncHandler(sparePartController.getAdjustmentsHistory));
sparePartRouter.get("/adjustments/history", asyncHandler(sparePartController.getAdjustmentsHistory));
sparePartRouter.get("/:id", asyncHandler(sparePartController.get));
sparePartRouter.post("/", asyncHandler(sparePartController.create));
sparePartRouter.put("/:id", asyncHandler(sparePartController.update));
sparePartRouter.delete("/:id", asyncHandler(sparePartController.remove));
sparePartRouter.post("/:id/adjust", asyncHandler(sparePartController.adjustStock));
sparePartRouter.post("/:id/adjust-stock", asyncHandler(sparePartController.adjustStock));

import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/adminMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/masterDataController.js";

export const masterDataRouter = Router();

// All routes require authentication
masterDataRouter.use(requireAuth);

// ─── BRANDS ──────────────────────────────────────────────────────────
masterDataRouter.get("/brands", asyncHandler(controller.listBrands));
masterDataRouter.get("/brands/:id", asyncHandler(controller.getBrand));
masterDataRouter.post("/brands", requireRole("admin"), asyncHandler(controller.createBrand));
masterDataRouter.put("/brands/:id", requireRole("admin"), asyncHandler(controller.updateBrand));
masterDataRouter.delete("/brands/:id", requireRole("admin"), asyncHandler(controller.removeBrand));

// ─── DEVICE TYPES ────────────────────────────────────────────────────
masterDataRouter.get("/device-types", asyncHandler(controller.listDeviceTypes));
masterDataRouter.get("/device-types/:id", asyncHandler(controller.getDeviceType));
masterDataRouter.post("/device-types", requireRole("admin"), asyncHandler(controller.createDeviceType));
masterDataRouter.put("/device-types/:id", requireRole("admin"), asyncHandler(controller.updateDeviceType));
masterDataRouter.delete("/device-types/:id", requireRole("admin"), asyncHandler(controller.removeDeviceType));

// ─── MODELS ──────────────────────────────────────────────────────────
masterDataRouter.get("/models", asyncHandler(controller.listModels));
masterDataRouter.get("/models/:id", asyncHandler(controller.getModel));
masterDataRouter.post("/models", requireRole("admin"), asyncHandler(controller.createModel));
masterDataRouter.put("/models/:id", requireRole("admin"), asyncHandler(controller.updateModel));
masterDataRouter.delete("/models/:id", requireRole("admin"), asyncHandler(controller.removeModel));

// ─── REPAIR TYPES ────────────────────────────────────────────────────
masterDataRouter.get("/repair-types", asyncHandler(controller.listRepairTypes));
masterDataRouter.get("/repair-types/:id", asyncHandler(controller.getRepairType));
masterDataRouter.post("/repair-types", requireRole("admin"), asyncHandler(controller.createRepairType));
masterDataRouter.put("/repair-types/:id", requireRole("admin"), asyncHandler(controller.updateRepairType));
masterDataRouter.delete("/repair-types/:id", requireRole("admin"), asyncHandler(controller.removeRepairType));

// ─── PRICE LISTS ─────────────────────────────────────────────────────
masterDataRouter.get("/price-lists", asyncHandler(controller.listPriceLists));
masterDataRouter.get("/price-lists/:id", asyncHandler(controller.getPriceList));
masterDataRouter.post("/price-lists", requireRole("admin"), asyncHandler(controller.createPriceList));
masterDataRouter.put("/price-lists/:id", requireRole("admin"), asyncHandler(controller.updatePriceList));
masterDataRouter.delete("/price-lists/:id", requireRole("admin"), asyncHandler(controller.removePriceList));

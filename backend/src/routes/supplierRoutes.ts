import { Router } from "express";
import * as supplierController from "../controllers/supplierController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const supplierRouter = Router();

supplierRouter.use(requireAuth);

supplierRouter.get("/", asyncHandler(supplierController.list));
supplierRouter.get("/:id", asyncHandler(supplierController.get));
supplierRouter.post("/", asyncHandler(supplierController.create));
supplierRouter.put("/:id", asyncHandler(supplierController.update));
supplierRouter.delete("/:id", asyncHandler(supplierController.remove));

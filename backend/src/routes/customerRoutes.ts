import { Router } from "express";
import * as customerController from "../controllers/customerController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.get("/search", asyncHandler(customerController.search));
customerRouter.get("/export", asyncHandler(customerController.exportData));
customerRouter.post("/merge", asyncHandler(customerController.merge));
customerRouter.get("/", asyncHandler(customerController.list));
customerRouter.get("/:id", asyncHandler(customerController.getDetails));
customerRouter.put("/:id", asyncHandler(customerController.update));
customerRouter.delete("/:id", asyncHandler(customerController.remove));
customerRouter.post("/", asyncHandler(customerController.create));

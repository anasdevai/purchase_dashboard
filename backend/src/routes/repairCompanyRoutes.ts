import { Router } from "express";
import * as repairCompanyController from "../controllers/repairCompanyController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const repairCompanyRouter = Router();

repairCompanyRouter.use(requireAuth);

repairCompanyRouter.get("/", asyncHandler(repairCompanyController.list));
repairCompanyRouter.post("/", asyncHandler(repairCompanyController.create));
repairCompanyRouter.patch("/:id", asyncHandler(repairCompanyController.update));
repairCompanyRouter.delete("/:id", asyncHandler(repairCompanyController.remove));

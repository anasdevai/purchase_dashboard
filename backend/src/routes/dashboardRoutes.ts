import { Router } from "express";
import { dashboard } from "../controllers/contractController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, asyncHandler(dashboard));


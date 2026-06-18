import { Router } from "express";
import * as customerController from "../controllers/customerController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.get("/search", asyncHandler(customerController.search));
customerRouter.post("/", asyncHandler(customerController.create));

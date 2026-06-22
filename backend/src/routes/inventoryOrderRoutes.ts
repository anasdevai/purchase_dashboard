import { Router } from "express";
import * as inventoryOrderController from "../controllers/inventoryOrderController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const inventoryOrderRouter = Router();

inventoryOrderRouter.use(requireAuth);

inventoryOrderRouter.get("/", asyncHandler(inventoryOrderController.list));
inventoryOrderRouter.get("/:id", asyncHandler(inventoryOrderController.get));
inventoryOrderRouter.post("/", asyncHandler(inventoryOrderController.create));
inventoryOrderRouter.post("/:id/cancel", asyncHandler(inventoryOrderController.cancel));

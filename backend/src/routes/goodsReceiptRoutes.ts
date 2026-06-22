import { Router } from "express";
import * as goodsReceiptController from "../controllers/goodsReceiptController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const goodsReceiptRouter = Router();

goodsReceiptRouter.use(requireAuth);

goodsReceiptRouter.get("/", asyncHandler(goodsReceiptController.list));
goodsReceiptRouter.post("/", asyncHandler(goodsReceiptController.create));

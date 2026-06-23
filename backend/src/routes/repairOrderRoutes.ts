import { Router } from "express";
import * as repairOrderController from "../controllers/repairOrderController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { repairOrderSchema, searchRepairOrdersSchema, repairOrderStatusSchema } from "../validators/repairOrderValidators.js";

export const repairOrderRouter = Router();

repairOrderRouter.use(requireAuth);

repairOrderRouter.get("/search", validate({ query: searchRepairOrdersSchema }), asyncHandler(repairOrderController.search));
repairOrderRouter.post("/", validate({ body: repairOrderSchema }), asyncHandler(repairOrderController.create));
repairOrderRouter.get("/:id", asyncHandler(repairOrderController.get));
repairOrderRouter.patch("/:id", validate({ body: repairOrderSchema.partial() }), asyncHandler(repairOrderController.update));
repairOrderRouter.patch("/:id/status", validate({ body: repairOrderStatusSchema }), asyncHandler(repairOrderController.updateStatus));
repairOrderRouter.post("/:id/comment", asyncHandler(repairOrderController.addComment));
repairOrderRouter.post("/:id/pdf", asyncHandler(repairOrderController.generatePdf));
repairOrderRouter.get("/:id/pdf", asyncHandler(repairOrderController.openPdf));
repairOrderRouter.get("/:id/pdf/download", asyncHandler(repairOrderController.downloadPdf));
repairOrderRouter.post("/:id/email", asyncHandler(repairOrderController.sendEmail));
repairOrderRouter.delete("/:id", asyncHandler(repairOrderController.remove));


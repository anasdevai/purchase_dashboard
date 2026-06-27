import { Router } from "express";
import * as invoiceController from "../controllers/invoiceController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { invoiceSchema, searchInvoicesSchema, invoicePaymentStatusSchema } from "../validators/invoiceValidators.js";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);

invoiceRouter.get("/search", validate({ query: searchInvoicesSchema }), asyncHandler(invoiceController.search));
invoiceRouter.get("/next-number", asyncHandler(invoiceController.getNextNumber));
invoiceRouter.post("/", validate({ body: invoiceSchema }), asyncHandler(invoiceController.create));
invoiceRouter.get("/prefill-from-repair-order/:repairOrderId", asyncHandler(invoiceController.prefillFromRepairOrder));
invoiceRouter.post("/from-repair-order/:repairOrderId", asyncHandler(invoiceController.createFromRepairOrder));
invoiceRouter.get("/:id", asyncHandler(invoiceController.get));
invoiceRouter.patch("/:id", validate({ body: invoiceSchema.partial() }), asyncHandler(invoiceController.update));
invoiceRouter.patch("/:id/status", validate({ body: invoicePaymentStatusSchema }), asyncHandler(invoiceController.updateStatus));
invoiceRouter.post("/:id/pdf", asyncHandler(invoiceController.generatePdf));
invoiceRouter.get("/:id/pdf", asyncHandler(invoiceController.openPdf));
invoiceRouter.get("/:id/pdf/download", asyncHandler(invoiceController.downloadPdf));
invoiceRouter.post("/:id/email", asyncHandler(invoiceController.sendEmail));
invoiceRouter.post("/:id/copy", asyncHandler(invoiceController.copy));
invoiceRouter.post("/:id/cancel", asyncHandler(invoiceController.cancel));
invoiceRouter.post("/:id/reminder", asyncHandler(invoiceController.sendReminder));
invoiceRouter.delete("/:id", asyncHandler(invoiceController.remove));


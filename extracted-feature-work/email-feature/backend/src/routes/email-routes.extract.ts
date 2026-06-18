// Original path: backend/src/routes/contractRoutes.ts, invoiceRoutes.ts, repairOrderRoutes.ts
// Extracted: POST email endpoints (all require auth)

// contractRoutes.ts
contractRouter.post("/:id/email", asyncHandler(contractController.sendEmail));

// invoiceRoutes.ts
invoiceRouter.post("/:id/email", asyncHandler(invoiceController.sendEmail));

// repairOrderRoutes.ts
repairOrderRouter.post("/:id/email", asyncHandler(repairOrderController.sendEmail));

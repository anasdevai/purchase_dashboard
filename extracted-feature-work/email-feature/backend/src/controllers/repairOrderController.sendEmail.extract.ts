// Original path: backend/src/controllers/repairOrderController.ts
// Extracted: send repair order PDF email

export const sendEmail = async (req: Request, res: Response) => {
  const repairOrder = await repairOrderService.getRepairOrderOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!repairOrder.customerEmail) {
    throw new HttpError(400, "Repair order does not have a customer email address configured");
  }

  if (!repairOrder.pdfPath) {
    throw new HttpError(400, "Repair order PDF has not been generated yet");
  }

  await emailService.sendRepairOrderPdfEmail(
    repairOrder.customerEmail,
    repairOrder.repairOrderNumber,
    repairOrder.pdfPath,
    repairOrder.customerName
  );

  res.json({ success: true });
};

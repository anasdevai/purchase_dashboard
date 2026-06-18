// Original path: backend/src/controllers/invoiceController.ts
// Extracted: send invoice PDF email (auto-generates PDF if missing)

export const sendEmail = async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!invoice.customerEmail) {
    throw new HttpError(400, "Invoice does not have a customer email address configured");
  }

  if (!invoice.pdfPath) {
    await invoiceService.generatePdfForInvoice(paramId(req), userId(req), pdfLanguage(req));
  }

  const updatedInvoice = await invoiceService.getInvoiceOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  await emailService.sendInvoicePdfEmail(
    updatedInvoice.customerEmail!,
    updatedInvoice.invoiceNumber,
    updatedInvoice.pdfPath,
    updatedInvoice.customerName
  );

  res.json({ success: true });
};

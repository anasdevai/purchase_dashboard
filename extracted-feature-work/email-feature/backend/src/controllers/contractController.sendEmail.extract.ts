// Original path: backend/src/controllers/contractController.ts
// Extracted: send contract PDF email

export const sendEmail = async (req: Request, res: Response) => {
  const contract = await contractService.getContractOrThrow(
    paramId(req),
    userId(req),
    req.user?.role === "admin"
  );

  if (!contract.customerEmail) {
    throw new HttpError(400, "Contract does not have a customer email address configured");
  }

  if (!contract.pdfPath) {
    throw new HttpError(400, "Contract PDF has not been generated yet");
  }

  await emailService.sendContractPdfEmail(
    contract.customerEmail,
    contract.contractNumber,
    contract.pdfPath,
    contract.customerName,
    contract.salutation,
    contract.customerLastName
  );

  res.json({ success: true });
};

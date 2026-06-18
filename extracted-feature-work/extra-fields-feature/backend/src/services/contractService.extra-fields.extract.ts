// Original path: backend/src/services/contractService.ts
// Extracted: auto-derive composite customerName/customerAddress from split fields + completion mapping

const toContractData = (input: Record<string, unknown>) => {
  const parsed = draftContractSchema.parse(input);

  const firstName = (parsed.customerFirstName ?? "").trim();
  const lastName = (parsed.customerLastName ?? "").trim();
  if (firstName || lastName) {
    (parsed as Record<string, unknown>).customerName = [firstName, lastName].filter(Boolean).join(" ");
  }

  const street = (parsed.customerStreet ?? "").trim();
  const zip = (parsed.customerZipCode ?? "").trim();
  const city = (parsed.customerCity ?? "").trim();
  if (street || zip || city) {
    (parsed as Record<string, unknown>).customerAddress = [street, [zip, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  }

  return parsed;
};

const toCompletionValidationInput = (contract: ContractWithFiles) => ({
  salutation: contract.salutation ?? undefined,
  customerFirstName: contract.customerFirstName ?? undefined,
  customerLastName: contract.customerLastName ?? undefined,
  customerStreet: contract.customerStreet ?? undefined,
  customerZipCode: contract.customerZipCode ?? undefined,
  customerCity: contract.customerCity ?? undefined,
  idType: contract.idType ?? undefined,
  osVersion: (contract as Record<string, unknown>).osVersion as string | undefined ?? undefined,
  icloudStatus: (contract as Record<string, unknown>).icloudStatus as string | undefined ?? undefined,
  mdmStatus: (contract as Record<string, unknown>).mdmStatus as string | undefined ?? undefined,
  warranty: (contract as Record<string, unknown>).warranty as string | undefined ?? undefined,
  purchaseReceiptAvailable: (contract as Record<string, unknown>).purchaseReceiptAvailable as boolean | undefined ?? undefined,
  paymentStatus: (contract as Record<string, unknown>).paymentStatus as string | undefined ?? undefined,
  notes: (contract as Record<string, unknown>).notes as string | undefined ?? undefined,
  // ...remaining legacy fields...
});

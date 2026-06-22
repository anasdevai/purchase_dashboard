export const resolveCustomerEmail = (
  direct?: string | null,
  customer?: { email?: string | null } | null
): string | null => {
  const directEmail = direct?.trim();
  if (directEmail) return directEmail;

  const customerEmail = customer?.email?.trim();
  if (customerEmail) return customerEmail;

  return null;
};

export const readOptionalToEmail = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object" || !("toEmail" in body)) return undefined;
  const value = (body as { toEmail?: unknown }).toEmail;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

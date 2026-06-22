import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { createSupplierSchema, updateSupplierSchema } from "../validators/supplierValidators.js";

export const listSuppliers = async (userId: string) => {
  return prisma.supplier.findMany({
    where: { userId },
    orderBy: { companyName: "asc" }
  });
};

export const getSupplierById = async (id: string, userId: string) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id, userId }
  });

  if (!supplier) {
    throw new HttpError(404, "Supplier not found");
  }

  return supplier;
};

export const createSupplier = async (userId: string, input: Record<string, unknown>) => {
  const parsed = createSupplierSchema.parse(input);

  try {
    return await prisma.supplier.create({
      data: {
        userId,
        companyName: parsed.companyName,
        contactPerson: parsed.contactPerson || null,
        phone: parsed.phone || null,
        email: parsed.email,
        website: parsed.website || null,
        deliveryTime: parsed.deliveryTime || null,
        paymentTerms: parsed.paymentTerms || null
      }
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A supplier with this company name already exists");
    }
    throw error;
  }
};

export const updateSupplier = async (id: string, userId: string, input: Record<string, unknown>) => {
  await getSupplierById(id, userId);
  const parsed = updateSupplierSchema.parse(input);

  try {
    return await prisma.supplier.update({
      where: { id },
      data: {
        companyName: parsed.companyName,
        contactPerson: parsed.contactPerson,
        phone: parsed.phone,
        email: parsed.email,
        website: parsed.website,
        deliveryTime: parsed.deliveryTime,
        paymentTerms: parsed.paymentTerms
      }
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A supplier with this company name already exists");
    }
    throw error;
  }
};

export const deleteSupplier = async (id: string, userId: string) => {
  const existing = await getSupplierById(id, userId);
  await prisma.supplier.delete({ where: { id } });
  return { id: existing.id, companyName: existing.companyName };
};

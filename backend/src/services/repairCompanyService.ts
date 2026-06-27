import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { repairCompanySchema } from "../validators/repairCompanyValidators.js";

export const listRepairCompanies = async (userId: string) =>
  prisma.repairCompany.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });

export const createRepairCompany = async (userId: string, input: Record<string, unknown>) => {
  const parsed = repairCompanySchema.parse(input);

  try {
    return await prisma.repairCompany.create({
      data: {
        userId,
        name: parsed.name,
        contactPerson: parsed.contactPerson,
        phone: parsed.phone,
        email: parsed.email,
        address: parsed.address,
        city: parsed.city,
        country: parsed.country,
        contactInfo: parsed.contactInfo,
        notes: parsed.notes
      }
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A repair company with this name already exists");
    }
    throw error;
  }
};

export const updateRepairCompany = async (
  id: string,
  userId: string,
  input: Record<string, unknown>
) => {
  const existing = await prisma.repairCompany.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new HttpError(404, "Repair company not found");
  }

  const parsed = repairCompanySchema.parse(input);

  try {
    return await prisma.repairCompany.update({
      where: { id },
      data: {
        name: parsed.name,
        contactPerson: parsed.contactPerson,
        phone: parsed.phone,
        email: parsed.email,
        address: parsed.address,
        city: parsed.city,
        country: parsed.country,
        contactInfo: parsed.contactInfo,
        notes: parsed.notes
      }
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A repair company with this name already exists");
    }
    throw error;
  }
};

export const deleteRepairCompany = async (id: string, userId: string) => {
  const existing = await prisma.repairCompany.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new HttpError(404, "Repair company not found");
  }

  await prisma.repairCompany.delete({ where: { id } });
  return { id: existing.id, name: existing.name };
};

export const assertRepairCompanyAccess = async (
  repairCompanyId: string | undefined,
  userId: string
) => {
  if (!repairCompanyId) return;

  const company = await prisma.repairCompany.findFirst({
    where: { id: repairCompanyId, userId },
    select: { id: true }
  });

  if (!company) {
    throw new HttpError(404, "Repair company not found");
  }
};

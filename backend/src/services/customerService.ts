import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { z } from "zod";

export const customerInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(150).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
});

export const searchCustomers = async (userId: string, query: string) => {
  return prisma.customer.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: 50
  });
};

export const createCustomer = async (userId: string, input: Record<string, unknown>) => {
  const parsed = customerInputSchema.parse(input);

  const existing = await prisma.customer.findFirst({
    where: {
      userId,
      name: parsed.name,
      phone: parsed.phone
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.customer.create({
    data: {
      userId,
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      address: parsed.address || null
    }
  });
};

export const getCustomerOrThrow = async (id: string, userId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id, userId }
  });

  if (!customer) {
    throw new HttpError(404, "Customer not found");
  }

  return customer;
};

export const findOrCreateCustomerForRepair = async (
  userId: string,
  name: string,
  phone: string,
  email?: string | null,
  address?: string | null
) => {
  const existing = await prisma.customer.findFirst({
    where: {
      userId,
      name,
      phone
    }
  });

  if (existing) {
    if ((email && !existing.email) || (address && !existing.address)) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: {
          email: email || existing.email,
          address: address || existing.address
        }
      });
    }
    return existing;
  }

  return prisma.customer.create({
    data: {
      userId,
      name,
      phone,
      email: email || null,
      address: address || null
    }
  });
};

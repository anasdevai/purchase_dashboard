import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";

// ─── Types ────────────────────────────────────────────────────────

interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// ─── List Users (paginated, searchable) ──────────────────────────

export const listUsers = async (options: ListUsersOptions) => {
  const { page, limit, search, role, isActive, sortBy, sortOrder } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            contracts: true,
            invoices: true,
            repairOrders: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Get User By ID ──────────────────────────────────────────────

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          contracts: true,
          invoices: true,
          repairOrders: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

// ─── Create User ─────────────────────────────────────────────────

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new HttpError(409, "Email is already registered");
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

// ─── Update User ─────────────────────────────────────────────────

export const updateUser = async (
  userId: string,
  requestingAdminId: string,
  data: {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
  }
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  // Prevent admin from demoting themselves
  if (userId === requestingAdminId && data.role && data.role !== "admin") {
    throw new HttpError(400, "You cannot remove your own admin role");
  }

  // Prevent admin from deactivating themselves
  if (userId === requestingAdminId && data.isActive === false) {
    throw new HttpError(400, "You cannot deactivate your own account");
  }

  // Check email uniqueness if changing email
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new HttpError(409, "Email is already registered");
    }
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

// ─── Delete User ─────────────────────────────────────────────────

export const deleteUser = async (userId: string, requestingAdminId: string) => {
  if (userId === requestingAdminId) {
    throw new HttpError(400, "You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  // Delete user (cascades to contracts, invoices, repair orders)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User deleted successfully" };
};

// ─── User Data Access (cross-user browsing) ──────────────────────

export const getUserContracts = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contract.count({ where: { userId } }),
  ]);

  return {
    contracts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserInvoices = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where: { userId } }),
  ]);

  return {
    invoices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserRepairOrders = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [repairOrders, total] = await Promise.all([
    prisma.repairOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.repairOrder.count({ where: { userId } }),
  ]);

  return {
    repairOrders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

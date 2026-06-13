import { prisma } from "../config/prisma.js";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes.js";
import { HttpError } from "../utils/httpError.js";
import { signAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const signup = async (input: { name: string; email: string; password: string }) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new HttpError(409, "Email is already registered", {
      code: AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
    });
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password)
    },
    select: { id: true, name: true, email: true, createdAt: true }
  });

  return {
    user,
    token: signAuthToken({ userId: user.id })
  };
};

export const login = async (input: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password", {
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    },
    token: signAuthToken({ userId: user.id })
  };
};


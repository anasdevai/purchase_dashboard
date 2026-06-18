import { prisma } from "../config/prisma.js";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes.js";
import { HttpError } from "../utils/httpError.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import { signAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const isDev = process.env.NODE_ENV !== "production";

const devLog = (message: string, details?: Record<string, unknown>) => {
  if (!isDev) return;
  if (details) {
    console.log(`[auth:dev] ${message}`, details);
    return;
  }
  console.log(`[auth:dev] ${message}`);
};

export const signup = async (input: { name: string; email: string; password: string }) => {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new HttpError(409, "Email is already registered", {
      code: AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
    });
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  devLog("signup created user", { email: user.email, role: user.role });

  return {
    user,
    token: signAuthToken({ userId: user.id }),
  };
};

export const login = async (input: { email: string; password: string }) => {
  const email = normalizeEmail(input.email);
  devLog("login attempt", { email });

  const user = await prisma.user.findUnique({ where: { email } });
  devLog("login lookup", { userFound: Boolean(user), isActive: user?.isActive ?? null });

  if (!user) {
    throw new HttpError(401, "Invalid email or password", {
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  devLog("login password check", { passwordMatches });

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password", {
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
  }

  if (!user.isActive) {
    throw new HttpError(403, "Your account has been deactivated. Contact an administrator.");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: signAuthToken({ userId: user.id }),
  };
};

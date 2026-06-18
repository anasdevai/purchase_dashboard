import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { verifyAuthToken } from "../utils/jwt.js";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.header("authorization");
    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const queryToken =
      typeof req.query.token === "string" ? req.query.token : parsedUrl.searchParams.get("token");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : queryToken;

    if (!token) {
      throw new HttpError(401, "Authentication token is required");
    }

    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, createdAt: true, role: true, isActive: true }
    });

    if (!user) {
      throw new HttpError(401, "User no longer exists");
    }

    if (!user.isActive) {
      throw new HttpError(403, "Your account has been deactivated. Contact an administrator.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid or expired token"));
  }
};

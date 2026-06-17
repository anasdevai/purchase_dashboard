import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { HttpError } from "../../utils/httpError.js";

/**
 * Middleware that restricts access to users with specific roles.
 * Must be used AFTER requireAuth middleware.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new HttpError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(
        new HttpError(403, "You do not have permission to access this resource")
      );
    }

    next();
  };
};

import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, "id" | "name" | "email" | "createdAt" | "role" | "isActive">;
    }
  }
}

export {};


import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes.js";
import { HttpError } from "../utils/httpError.js";

const readHttpErrorCode = (error: HttpError): string | undefined => {
  const details = error.details;
  if (details && typeof details === "object" && "code" in details) {
    const code = (details as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      errors: error.flatten()
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large. Maximum allowed size is controlled by MAX_UPLOAD_SIZE_MB."
        : error.message;

    return res.status(400).json({ message });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: readHttpErrorCode(error),
      details: error.details
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({
      message: "IMEI or serial number already exists in another contract"
    });
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error(error);
    return res.status(503).json({
      message: "Database is unavailable. Start PostgreSQL and try again."
    });
  }

  console.error(error);
  if (error instanceof Error && error.message.includes("Failed to launch browser for PDF generation")) {
    return res.status(500).json({ message: "PDF could not be created. Please try again." });
  }

  return res.status(500).json({ message: "Internal server error" });
};

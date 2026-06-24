import type { Request, Response, NextFunction } from "express";
import { ZodError, type AnyZodObject } from "zod";
import { AUTH_ERROR_CODES } from "../constants/authErrorCodes.js";
import { formatZodValidationResponse } from "../utils/zodErrors.js";

export interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          code: AUTH_ERROR_CODES.VALIDATION_FAILED,
          ...formatZodValidationResponse(error),
        });
        return;
      }
      next(error);
    }
  };
};

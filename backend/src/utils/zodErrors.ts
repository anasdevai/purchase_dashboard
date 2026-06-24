import { ZodError } from "zod";

export type ValidationFieldError = {
  field: string;
  message: string;
};

export function formatZodFieldErrors(error: ZodError): ValidationFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "_form",
    message: issue.message,
  }));
}

export function formatZodValidationResponse(error: ZodError) {
  const flattened = error.flatten();
  return {
    message: "Validation failed",
    errors: formatZodFieldErrors(error),
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
  };
}

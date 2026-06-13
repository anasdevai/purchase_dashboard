export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

export function isAuthErrorCode(value: unknown): value is AuthErrorCode {
  return (
    value === AUTH_ERROR_CODES.INVALID_CREDENTIALS ||
    value === AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED ||
    value === AUTH_ERROR_CODES.VALIDATION_FAILED
  )
}

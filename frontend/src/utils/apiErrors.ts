import { getActiveTranslations } from '../i18n/active'
import type { TranslationSchema } from '../i18n/types'
import {
  AUTH_ERROR_CODES,
  isAuthErrorCode,
  type AuthErrorCode,
} from './authErrorCodes'

export type FriendlyErrorKind =
  | 'generic'
  | 'auth'
  | 'contractSave'
  | 'repairOrderSave'
  | 'invoiceCreate'
  | 'invoiceSave'
  | 'settingsSave'
  | 'pdf'
  | 'pdfDownload'
  | 'upload'
  | 'load'

export class ApiError extends Error {
  readonly status: number
  readonly rawMessage?: string
  readonly code?: AuthErrorCode
  readonly details?: unknown
  /** When true, message is safe to show in the UI (e.g. not-found). */
  readonly userFacing: boolean

  constructor(
    friendlyMessage: string,
    status: number,
    rawMessage?: string,
    userFacing = false,
    code?: AuthErrorCode,
    details?: unknown,
  ) {
    super(friendlyMessage)
    this.name = 'ApiError'
    this.status = status
    this.rawMessage = rawMessage
    this.code = code
    this.details = details
    this.userFacing = userFacing
  }
}

export function logApiError(context: string, error: unknown) {
  if (error instanceof ApiError) {
    console.error(`[${context}]`, {
      status: error.status,
      code: error.code,
      rawMessage: error.rawMessage,
      message: error.message,
    })
    return
  }
  console.error(`[${context}]`, error)
}

function resolveAuthErrorMessage(
  status: number,
  code: AuthErrorCode | undefined,
  translations: TranslationSchema,
) {
  const t = translations

  if (code === AUTH_ERROR_CODES.INVALID_CREDENTIALS || status === 401) {
    return t.common.friendlyErrors.auth
  }

  if (status === 403) {
    return t.login.accountDeactivated
  }

  if (code === AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED || status === 409) {
    return t.login.emailAlreadyRegistered
  }

  if (code === AUTH_ERROR_CODES.VALIDATION_FAILED || status === 400) {
    return t.login.validationFailed
  }

  return null
}

export function resolveApiErrorMessage(
  status: number,
  _rawMessage: string | undefined,
  translations?: TranslationSchema,
  code?: AuthErrorCode,
) {
  const t = translations ?? getActiveTranslations()

  if (code === AUTH_ERROR_CODES.INVALID_CREDENTIALS || status === 401) {
    return { message: t.common.friendlyErrors.auth, userFacing: true }
  }

  if (code === AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED) {
    return { message: t.login.emailAlreadyRegistered, userFacing: true }
  }

  if (status === 403) {
    return { message: t.login.accountDeactivated, userFacing: true }
  }

  if (status === 409) {
    return { message: _rawMessage || t.common.friendlyErrors.generic, userFacing: true }
  }

  return { message: t.common.friendlyErrors.generic, userFacing: false }
}

export function getAuthErrorMessage(error: unknown, translations?: TranslationSchema) {
  const t = translations ?? getActiveTranslations()

  if (error instanceof ApiError) {
    const authMessage = resolveAuthErrorMessage(error.status, error.code, t)
    if (authMessage) {
      return authMessage
    }
  }

  return t.common.friendlyErrors.generic
}

export function getFriendlyErrorMessage(
  error: unknown,
  kind: FriendlyErrorKind = 'generic',
  translations?: TranslationSchema,
) {
  const t = translations ?? getActiveTranslations()

  if (error instanceof ApiError && error.userFacing) {
    if (error.code && isAuthErrorCode(error.code)) {
      const authMessage = resolveAuthErrorMessage(error.status, error.code, t)
      if (authMessage) {
        return authMessage
      }
    }

    return error.message
  }

  const messages = t.common.friendlyErrors
  switch (kind) {
    case 'auth':
      return getAuthErrorMessage(error, t)
    case 'contractSave':
      return messages.contractSave
    case 'repairOrderSave':
      return messages.repairOrderSave
    case 'invoiceCreate':
      return messages.invoiceCreate
    case 'invoiceSave':
      return messages.invoiceSave
    case 'settingsSave':
      return messages.settingsSave
    case 'pdf':
      return messages.pdf
    case 'pdfDownload':
      return messages.pdfDownload
    case 'upload':
      return messages.upload
    case 'load':
      return messages.generic
    default:
      return messages.generic
  }
}

export function isDraftAlreadyCompletedError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  return Boolean(error.rawMessage?.toLowerCase().includes('only draft contracts'))
}

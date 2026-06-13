import { getActiveTranslations } from '../i18n/active'
import type { TranslationSchema } from '../i18n/types'

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
  /** When true, message is safe to show in the UI (e.g. not-found). */
  readonly userFacing: boolean

  constructor(
    friendlyMessage: string,
    status: number,
    rawMessage?: string,
    userFacing = false,
  ) {
    super(friendlyMessage)
    this.name = 'ApiError'
    this.status = status
    this.rawMessage = rawMessage
    this.userFacing = userFacing
  }
}

export function logApiError(context: string, error: unknown) {
  if (error instanceof ApiError) {
    console.error(`[${context}]`, {
      status: error.status,
      rawMessage: error.rawMessage,
      message: error.message,
    })
    return
  }
  console.error(`[${context}]`, error)
}

const isEmailAlreadyRegisteredMessage = (message?: string) =>
  Boolean(message?.toLowerCase().includes('email is already registered'))

const isInvalidCredentialsMessage = (message?: string) =>
  Boolean(message?.toLowerCase().includes('invalid email or password'))

export function resolveApiErrorMessage(
  status: number,
  rawMessage: string | undefined,
  translations?: TranslationSchema,
) {
  const t = translations ?? getActiveTranslations()

  if (status === 401 || isInvalidCredentialsMessage(rawMessage)) {
    return { message: t.common.friendlyErrors.auth, userFacing: true }
  }

  if (status === 409 && isEmailAlreadyRegisteredMessage(rawMessage)) {
    return { message: t.login.emailAlreadyRegistered, userFacing: true }
  }

  if (status === 400) {
    return { message: t.login.validationFailed, userFacing: true }
  }

  return { message: t.common.friendlyErrors.generic, userFacing: false }
}

export function getAuthErrorMessage(error: unknown, translations?: TranslationSchema) {
  const t = translations ?? getActiveTranslations()

  if (error instanceof ApiError) {
    if (error.userFacing) {
      return error.message
    }

    const resolved = resolveApiErrorMessage(error.status, error.rawMessage, t)
    if (resolved.userFacing) {
      return resolved.message
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

import { getActiveTranslations } from '../i18n/active'
import type { TranslationSchema } from '../i18n/types'

export type FriendlyErrorKind =
  | 'generic'
  | 'save'
  | 'pdf'
  | 'pdfDownload'
  | 'upload'
  | 'load'
  | 'request'

export class ApiError extends Error {
  readonly status: number
  readonly rawMessage?: string

  constructor(friendlyMessage: string, status: number, rawMessage?: string) {
    super(friendlyMessage)
    this.name = 'ApiError'
    this.status = status
    this.rawMessage = rawMessage
  }
}

export function logApiError(context: string, error: unknown) {
  console.error(`[${context}]`, error)
}

export function getFriendlyErrorMessage(
  error: unknown,
  kind: FriendlyErrorKind = 'generic',
  translations?: TranslationSchema,
) {
  const t = translations ?? getActiveTranslations()

  if (error instanceof ApiError) {
    return error.message
  }

  const messages = t.common.friendlyErrors
  switch (kind) {
    case 'save':
      return messages.save
    case 'pdf':
      return messages.pdf
    case 'pdfDownload':
      return messages.pdfDownload
    case 'upload':
      return messages.upload
    case 'load':
      return messages.load
    case 'request':
      return messages.request
    default:
      return messages.generic
  }
}

export function isDraftAlreadyCompletedError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  return Boolean(error.rawMessage?.toLowerCase().includes('only draft contracts'))
}

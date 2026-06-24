import { getActiveTranslations } from '../i18n/active'
import { ApiError, resolveApiErrorMessage } from '../utils/apiErrors'
import { isAuthErrorCode } from '../utils/authErrorCodes'

const LOCAL_API_BASE = 'http://localhost:4000'

/** API routes in this app are `/api/...`; base URL must be the origin only (no `/api` suffix). */
function normalizeApiOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (trimmed.endsWith('/api')) {
    return trimmed.slice(0, -4)
  }
  return trimmed
}

function resolveApiBaseUrl(): string {
  const fromApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  const fromBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

  if (fromApiUrl) {
    return normalizeApiOrigin(fromApiUrl)
  }
  if (fromBaseUrl) {
    return normalizeApiOrigin(fromBaseUrl)
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1'
    // Production / Tailscale / LAN UI: same public host (API via reverse proxy at /api/*).
    if (!isLocalDev) {
      return origin
    }
  }

  return LOCAL_API_BASE
}

const API_BASE_URL = resolveApiBaseUrl()

const TOKEN_KEY = 'device-contract-auth-token'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  createdAt: string
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

async function readError(response: Response) {
  const t = getActiveTranslations()
  let rawMessage: string | undefined
  let errorCode: string | undefined
  let details: unknown

  try {
    const body = (await response.json()) as {
      message?: string
      code?: string
      errors?:
        | Array<{ field: string; message: string }>
        | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }
    errorCode = body.code
    details = body.errors ?? body.fieldErrors ?? body.formErrors

    const flattenedFieldErrors =
      body.fieldErrors ??
      (Array.isArray(body.errors)
        ? Object.fromEntries(
            body.errors.map((entry) => [entry.field, [entry.message]] as const),
          )
        : undefined)

    const fieldMessages = flattenedFieldErrors
      ? Object.entries(flattenedFieldErrors).flatMap(([field, messages]) =>
          (messages ?? []).map((message) => `${field}: ${message}`),
        )
      : Array.isArray(body.errors)
        ? body.errors.map((entry) => `${entry.field}: ${entry.message}`)
        : []

    const formMessages = body.formErrors ?? []
    const detailMessages = [...formMessages, ...fieldMessages]
    rawMessage =
      detailMessages.length > 0
        ? `${body.message ?? ''} (${detailMessages.join('; ')})`.trim()
        : body.message

    console.error('[API error]', response.status, response.url, {
      code: errorCode,
      message: body.message,
      errors: body.errors,
      fieldErrors: flattenedFieldErrors,
      formErrors: body.formErrors,
      rawMessage,
    })
  } catch {
    console.error('[API error]', response.status, response.url)
  }

  const resolvedCode = isAuthErrorCode(errorCode) ? errorCode : undefined
  const { message, userFacing } = resolveApiErrorMessage(
    response.status,
    rawMessage,
    t,
    resolvedCode,
  )
  return new ApiError(message, response.status, rawMessage, userFacing, resolvedCode, details)
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw await readError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

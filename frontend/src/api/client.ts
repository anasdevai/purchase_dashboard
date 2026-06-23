import { getActiveTranslations } from '../i18n/active'
import { ApiError, resolveApiErrorMessage } from '../utils/apiErrors'
import { isAuthErrorCode } from '../utils/authErrorCodes'

const DEFAULT_DEV_API_PORT = '4000'
const DEFAULT_DEV_API_ORIGIN = `http://localhost:${DEFAULT_DEV_API_PORT}`

function firstEnvUrl(value: string | undefined) {
  return value?.split(',')[0]?.trim() || undefined
}

/** Strips trailing slashes and optional `/api` suffix; request paths already start with `/api`. */
function normalizeServerBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '')
  if (url.endsWith('/api')) {
    url = url.slice(0, -4)
  }
  return url
}

function resolveApiBaseUrl(): string {
  const fromEnv =
    firstEnvUrl(import.meta.env.VITE_API_URL as string | undefined) ||
    firstEnvUrl(import.meta.env.VITE_API_BASE_URL as string | undefined)

  if (fromEnv) {
    return normalizeServerBaseUrl(fromEnv)
  }

  // Dev-only fallback when opening the UI from another device on the same LAN.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
    if (!isLocalHost) {
      return `${protocol}//${hostname}:${DEFAULT_DEV_API_PORT}`
    }
  }

  return DEFAULT_DEV_API_ORIGIN
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
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function readError(response: Response) {
  const t = getActiveTranslations()
  let rawMessage: string | undefined
  let errorCode: string | undefined
  let errorDetails: unknown

  try {
    const body = (await response.json()) as {
      message?: string
      code?: string
      details?: unknown
      errors?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
    }
    errorDetails = body.details
    errorCode = body.code
    const fieldMessages = body.errors?.fieldErrors
      ? Object.entries(body.errors.fieldErrors).flatMap(([field, messages]) =>
          messages.map((message) => `${field}: ${message}`),
        )
      : []
    const formMessages = body.errors?.formErrors ?? []
    const details = [...formMessages, ...fieldMessages]
    rawMessage =
      details.length > 0
        ? `${body.message ?? ''} (${details.join('; ')})`.trim()
        : body.message
    console.error('[API error]', response.status, response.url, errorCode, rawMessage ?? body)
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
  return new ApiError(message, response.status, rawMessage, userFacing, resolvedCode, errorDetails)
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
  })

  if (!response.ok) {
    throw await readError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

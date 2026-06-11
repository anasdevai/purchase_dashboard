import { getActiveTranslations } from '../i18n/active'
import { ApiError } from '../utils/apiErrors'

const API_PORT = '4000'

function resolveApiBaseUrl() {
  const fromEnv =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_API_URL as string | undefined)?.trim()

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

    // When opened from another device via LAN IP, target the API on the same host.
    if (!isLocalHost) {
      return `${protocol}//${hostname}:${API_PORT}`
    }
  }

  return fromEnv || `http://localhost:${API_PORT}`
}

const API_BASE_URL = resolveApiBaseUrl()

const TOKEN_KEY = 'device-contract-auth-token'

export type AuthUser = {
  id: string
  name: string
  email: string
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
  const { friendlyErrors } = getActiveTranslations().common
  const friendly =
    response.status >= 500
      ? friendlyErrors.generic
      : response.status === 401 || response.status === 403
        ? friendlyErrors.request
        : friendlyErrors.request

  let rawMessage: string | undefined
  try {
    const body = (await response.json()) as {
      message?: string
      errors?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
    }
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
    console.error('[API error]', response.status, response.url, rawMessage ?? body)
  } catch {
    console.error('[API error]', response.status, response.url)
  }

  return new ApiError(friendly, response.status, rawMessage)
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

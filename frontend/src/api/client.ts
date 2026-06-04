const rawApiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL

const API_BASE_URL = rawApiUrl?.replace(/\/$/, '') ?? 'http://localhost:4000'

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
  try {
    const body = await response.json()
    return body.message || 'Request failed'
  } catch {
    return 'Request failed'
  }
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
    throw new Error(await readError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}


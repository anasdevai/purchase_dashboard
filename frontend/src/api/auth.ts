import { apiRequest, clearToken, setToken, type AuthUser } from './client'

type AuthResponse = {
  user: AuthUser
  token: string
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
  setToken(response.token)
  return response.user
}

export async function signup(name: string, email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ name, email, password }),
  })
  setToken(response.token)
  return response.user
}

export async function fetchCurrentUser() {
  const response = await apiRequest<{ user: AuthUser }>('/api/auth/me')
  return response.user
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Failed to log out on backend:', error)
  } finally {
    clearToken()
  }
}


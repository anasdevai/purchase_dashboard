import { apiRequest, type AuthUser } from './client'

// ─── Types ────────────────────────────────────────────────────────

export type AdminUser = AuthUser & {
  isActive: boolean
  _count: {
    contracts: number
    invoices: number
    repairOrders: number
  }
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminDashboard = {
  users: {
    total: number
    active: number
    inactive: number
    admins: number
    staff: number
  }
  contracts: {
    total: number
    today: number
    draft: number
    completed: number
    cancelled: number
    totalPurchaseAmount: number
    todayPurchaseAmount: number
  }
  invoices: {
    total: number
    today: number
    paid: number
    open: number
    cancelled: number
    totalRevenue: number
    todayRevenue: number
  }
  repairOrders: {
    total: number
    today: number
    received: number
    inProgress: number
    completed: number
    readyForPickup: number
  }
  recentUsers: AdminUser[]
}

export type ListUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: 'admin' | 'staff'
  isActive?: boolean
  sortBy?: 'name' | 'email' | 'createdAt' | 'role'
  sortOrder?: 'asc' | 'desc'
}

export type CreateUserData = {
  name: string
  email: string
  password: string
  role: 'admin' | 'staff'
}

export type UpdateUserData = {
  name?: string
  email?: string
  role?: 'admin' | 'staff'
  isActive?: boolean
  password?: string
}

// ─── Dashboard ────────────────────────────────────────────────────

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/api/admin/dashboard')
}

// ─── User Management ─────────────────────────────────────────────

export async function fetchUsers(
  params: ListUsersParams = {},
): Promise<{ users: AdminUser[]; pagination: Pagination }> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.role) searchParams.set('role', params.role)
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const query = searchParams.toString()
  return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`)
}

export async function fetchUser(userId: string): Promise<{ user: AdminUser }> {
  return apiRequest(`/api/admin/users/${userId}`)
}

export async function createUser(data: CreateUserData): Promise<{ user: AdminUser }> {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(
  userId: string,
  data: UpdateUserData,
): Promise<{ user: AdminUser }> {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

// ─── User Data Browsing ──────────────────────────────────────────

export async function fetchUserContracts(
  userId: string,
  page: number = 1,
  limit: number = 20,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ contracts: any[]; pagination: Pagination }> {
  return apiRequest(`/api/admin/users/${userId}/contracts?page=${page}&limit=${limit}`)
}

export async function fetchUserInvoices(
  userId: string,
  page: number = 1,
  limit: number = 20,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ invoices: any[]; pagination: Pagination }> {
  return apiRequest(`/api/admin/users/${userId}/invoices?page=${page}&limit=${limit}`)
}

export async function fetchUserRepairOrders(
  userId: string,
  page: number = 1,
  limit: number = 20,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ repairOrders: any[]; pagination: Pagination }> {
  return apiRequest(`/api/admin/users/${userId}/repair-orders?page=${page}&limit=${limit}`)
}

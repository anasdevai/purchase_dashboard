import { apiRequest } from '../../api/client'
import type {
  AdminDashboard,
  AdminUser,
  CreateUserData,
  ListUsersParams,
  Pagination,
  UpdateUserData,
} from '../types/admin'

export type {
  AdminDashboard,
  AdminUser,
  CreateUserData,
  ListUsersParams,
  Pagination,
  UpdateUserData,
} from '../types/admin'

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/api/admin/dashboard')
}

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

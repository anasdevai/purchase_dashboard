import type { AuthUser } from '../../api/client'

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
    open: number
    workPending: number
    sentToRepairCompany: number
    appointmentScheduled: number
    completed: number
    cancelled: number
    inProgress: number
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

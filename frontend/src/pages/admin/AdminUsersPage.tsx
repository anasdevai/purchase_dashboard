import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  UserPlus,
  Shield,
  UserX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  Wrench,
} from 'lucide-react'
import { fetchUsers, type AdminUser, type Pagination, type ListUsersParams } from '../../api/admin'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters state
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'admin' | 'staff' | ''>('')
  const [isActive, setIsActive] = useState<boolean | ''>('')
  const [page, setPage] = useState(1)

  const loadUsers = () => {
    setLoading(true)
    const params: ListUsersParams = {
      page,
      limit: 10,
      search: search || undefined,
      role: role || undefined,
      isActive: isActive === '' ? undefined : isActive,
    }

    fetchUsers(params)
      .then((res) => {
        setUsers(res.users)
        setPagination(res.pagination)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load users')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadUsers()
  }, [page, role, isActive])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleReset = () => {
    setSearch('')
    setRole('')
    setIsActive('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Manage Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and manage roles or statuses for all staff and admin accounts.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="btn btn-primary h-11 px-4 text-sm font-semibold"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="label">
              Search Users
            </label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input h-10 pl-10"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label className="label">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as any)
                setPage(1)
              }}
              className="input h-10"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="w-full lg:w-48">
            <label className="label">
              Status
            </label>
            <select
              value={isActive === '' ? '' : isActive ? 'true' : 'false'}
              onChange={(e) => {
                const val = e.target.value
                setIsActive(val === '' ? '' : val === 'true')
                setPage(1)
              }}
              className="input h-10"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <button
              type="submit"
              className="btn btn-primary h-10 px-5"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary h-10 px-4"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Table card */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="text-xs font-medium text-slate-500">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[350px] items-center justify-center text-center px-4">
            <div>
              <UserX className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
              <button
                onClick={loadUsers}
                className="btn btn-secondary mt-4 h-9 text-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-center px-4">
            <div>
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">No users found matching filters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">User Details</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Contracts</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoices</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Repairs</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="group cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-xs font-bold text-violet-600">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-violet-50 text-violet-700 border border-violet-100'
                              : 'bg-sky-50 text-sky-700 border border-sky-100'
                          }`}
                        >
                          {u.role === 'admin' && <Shield className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {u._count?.contracts ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                          <Receipt className="h-3.5 w-3.5 text-slate-400" />
                          {u._count?.invoices ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                          <Wrench className="h-3.5 w-3.5 text-slate-400" />
                          {u._count?.repairOrders ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                <p className="text-xs text-slate-500">
                  Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-slate-800">{pagination.totalPages}</span> · Total{' '}
                  <span className="font-semibold text-slate-800">{pagination.total}</span> users
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn btn-secondary h-9 w-9 p-0 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-secondary h-9 w-9 p-0 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

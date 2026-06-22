import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  FileText,
  Receipt,
  Wrench,
  UserCog,
  AlertTriangle,
  Calendar,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { fetchUser, updateUser, deleteUser, type AdminUser } from '../../api/admin'
import { useAuth } from '../../auth/AuthContext'
import {
  adminAlertClass,
  adminBackLinkClass,
  adminLoadingSpinnerClass,
  adminLoadingTextClass,
  adminStatusBadge,
} from './adminUi'

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isSelf = currentUser?.id === userId

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchUser(userId)
      .then((res) => {
        setUser(res.user)
        setName(res.user.name)
        setEmail(res.user.email)
        setRole(res.user.role)
        setIsActive(res.user.isActive)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load user details')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await updateUser(userId, {
        name,
        email,
        role,
        isActive,
        password: password || undefined,
      })
      setUser(res.user)
      setPassword('')
      setEditing(false)
      setMessage({ type: 'success', text: 'User updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to update user'
      setMessage({ type: 'error', text })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return
    setDeleting(true)
    setMessage(null)

    try {
      await deleteUser(userId)
      setDeleteModalOpen(false)
      navigate('/admin/users')
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to delete user'
      setMessage({ type: 'error', text })
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  const resetForm = () => {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
    setRole(user.role)
    setIsActive(user.isActive)
    setPassword('')
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className={adminLoadingSpinnerClass} />
          <p className={adminLoadingTextClass}>Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <div>
          <UserX className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-red-700">{error || 'User not found'}</p>
          <button type="button" onClick={() => navigate('/admin/users')} className="btn btn-secondary mt-4 h-9 text-xs">
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  const analyticsLinks = [
    {
      to: `/admin/users/${user.id}/contracts`,
      label: 'Contracts',
      subtitle: 'Purchase agreements',
      count: user._count?.contracts ?? 0,
      icon: FileText,
      iconClass: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
      countClass: 'text-sky-700',
    },
    {
      to: `/admin/users/${user.id}/invoices`,
      label: 'Invoices',
      subtitle: 'Billing history',
      count: user._count?.invoices ?? 0,
      icon: Receipt,
      iconClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
      countClass: 'text-emerald-700',
    },
    {
      to: `/admin/users/${user.id}/repair-orders`,
      label: 'Repair Orders',
      subtitle: 'Device repairs',
      count: user._count?.repairOrders ?? 0,
      icon: Wrench,
      iconClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
      countClass: 'text-amber-700',
    },
  ] as const

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/admin/users')} className={adminBackLinkClass}>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Users</span>
      </button>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </div>

      {message ? (
        <div className={message.type === 'success' ? adminAlertClass.success : adminAlertClass.error}>
          {message.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className={user.role === 'admin' ? adminStatusBadge.admin : adminStatusBadge.staff}>
                  {user.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                  {user.role}
                </span>
                <span className={user.isActive ? adminStatusBadge.active : adminStatusBadge.inactive}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3.5 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Joined
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex shrink-0 items-center gap-2 text-slate-500">
                  <UserCog className="h-4 w-4 text-slate-400" />
                  User ID
                </span>
                <span className="truncate font-mono text-[10px] text-slate-400" title={user.id}>
                  {user.id}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button type="button" onClick={() => setEditing(!editing)} className="btn btn-secondary w-full">
                {editing ? 'Cancel Editing' : 'Edit Account'}
              </button>
              {!isSelf ? (
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="btn w-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete Account
                </button>
              ) : null}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">User Analytics</h3>
            <div className="mt-4 space-y-2">
              {analyticsLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-lg font-bold ${item.countClass}`}>{item.count}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {editing ? (
            <div className="card p-6 sm:p-8">
              <h3 className="mb-6 text-base font-bold text-slate-900">Modify Account Settings</h3>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="label">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input h-11"
                  />
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input h-11"
                  />
                </div>

                <div>
                  <label className="label">Change Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input h-11 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Account Status</label>
                  {isSelf ? (
                    <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      You cannot deactivate your own administrative account.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck className="h-4 w-4" />
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          !isActive
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <UserX className="h-4 w-4" />
                        Inactive
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Account Role</label>
                  {isSelf ? (
                    <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      You cannot demote or change your own administrative role.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('staff')}
                        className={`rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'staff'
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'admin'
                            ? 'border-violet-200 bg-violet-50 text-violet-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button type="submit" disabled={saving} className="btn btn-primary h-11 flex-1">
                    {saving ? 'Saving Changes...' : 'Save User Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      resetForm()
                    }}
                    className="btn btn-secondary h-11 px-6"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card flex min-h-[280px] flex-col items-center justify-center p-8 text-center sm:min-h-[350px]">
              <UserCog className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">Overview &amp; Insights</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Use the profile column to edit account settings or browse contracts, invoices, and repair
                orders created by this user.
              </p>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="card w-full max-w-md p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{user.name}</span>?
              This action is permanent and will remove all associated contracts, invoices, and repair orders.
            </p>
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button type="button" onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary h-10">
                No, Keep Account
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn h-10 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

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
} from 'lucide-react'
import { fetchUser, updateUser, deleteUser, type AdminUser } from '../services/admin'
import { useAuth } from '../../auth/AuthContext'

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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user' })
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user' })
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-xs font-medium text-slate-500">Loading user details...</p>
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
          <button onClick={() => navigate('/admin/users')} className="btn btn-secondary mt-4 h-9 text-xs">
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <button
        onClick={() => navigate('/admin/users')}
        className="group mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Users</span>
      </button>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-violet-50 text-violet-700 border border-violet-100'
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}
                >
                  {user.role === 'admin' && <Shield className="h-3 w-3" />}
                  {user.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    user.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Joined
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-500">
                  <UserCog className="h-4 w-4 text-slate-400" />
                  User ID
                </span>
                <span className="max-w-[120px] truncate font-mono text-[10px] text-slate-400" title={user.id}>
                  {user.id}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => setEditing(!editing)}
                className="btn btn-secondary w-full h-10 text-xs font-bold"
              >
                {editing ? 'Cancel Editing' : 'Edit Account'}
              </button>
              {!isSelf && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">User Data</h3>

            <Link
              to={`/admin/users/${user.id}/contracts`}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Contracts</p>
                  <p className="text-[10px] text-slate-500">Purchase agreements</p>
                </div>
              </div>
              <span className="text-lg font-bold text-sky-600">{user._count?.contracts ?? 0}</span>
            </Link>

            <Link
              to={`/admin/users/${user.id}/invoices`}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Invoices</p>
                  <p className="text-[10px] text-slate-500">Billing history</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-600">{user._count?.invoices ?? 0}</span>
            </Link>

            <Link
              to={`/admin/users/${user.id}/repair-orders`}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Repair Orders</p>
                  <p className="text-[10px] text-slate-500">Device repairs</p>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-600">{user._count?.repairOrders ?? 0}</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          {editing ? (
            <div className="card p-6 sm:p-8">
              <h3 className="mb-6 text-base font-bold text-slate-900">Modify Account Settings</h3>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="label">Display Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input h-11" />
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input h-11" />
                </div>

                <div>
                  <label className="label">Change Password</label>
                  <div className="relative mt-1.5">
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
                    <p className="mt-1.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      You cannot deactivate your own administrative account.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          !isActive
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <UserX className="h-4 w-4" />
                        <span>Inactive</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Account Role</label>
                  {isSelf ? (
                    <p className="mt-1.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      You cannot demote or change your own administrative role.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('staff')}
                        className={`rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'staff'
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'admin'
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="btn btn-primary h-11 flex-1 font-semibold">
                    {saving ? 'Saving Changes...' : 'Save User Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setName(user.name)
                      setEmail(user.email)
                      setRole(user.role)
                      setIsActive(user.isActive)
                      setPassword('')
                    }}
                    className="btn btn-secondary h-11 px-6"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
              <UserCog className="mb-4 h-12 w-12 text-slate-200" />
              <h3 className="text-base font-bold text-slate-700">Overview & Insights</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Use the left column to edit account settings or browse this user&apos;s contracts, invoices, and repair orders.
              </p>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{user.name}</span>?
              This permanently removes all associated contracts, invoices, and repair orders.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="btn btn-secondary h-10 px-4 text-xs">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

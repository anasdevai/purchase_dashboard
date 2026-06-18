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
import { fetchUser, updateUser, deleteUser, type AdminUser } from '../../api/admin'
import { useAuth } from '../../auth/AuthContext'

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')

  // UI state
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
      const data = {
        name,
        email,
        role,
        isActive,
        password: password || undefined,
      }
      const res = await updateUser(userId, data)
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          <p className="text-xs font-medium text-white/40">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <UserX className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-300">{error || 'User not found'}</p>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-8 py-8">
      {/* Back link */}
      <button
        onClick={() => navigate('/admin/users')}
        className="group mb-6 flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Users</span>
      </button>

      {/* Alert Message */}
      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
              : 'border-red-500/20 bg-red-500/5 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main layout grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 shadow-xl">
            {/* Header info */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">{user.name}</h2>
              <p className="text-xs text-white/40">{user.email}</p>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-sky-500/10 text-sky-400'
                  }`}
                >
                  {user.role === 'admin' && <Shield className="h-3 w-3" />}
                  {user.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    user.isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* General metadata */}
            <div className="mt-6 border-t border-white/[0.06] pt-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/40">
                  <Calendar className="h-4 w-4 text-white/20" />
                  Joined
                </span>
                <span className="font-semibold text-white/80">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/40">
                  <UserCog className="h-4 w-4 text-white/20" />
                  User ID
                </span>
                <span className="font-mono text-[10px] text-white/30 truncate max-w-[120px]" title={user.id}>
                  {user.id}
                </span>
              </div>
            </div>

            {/* Actions for editing and deleting */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setEditing(!editing)}
                className="w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"
              >
                {editing ? 'Cancel Editing' : 'Edit Account'}
              </button>
              {!isSelf && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full rounded-xl bg-red-500/10 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/15"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>

          {/* Stats & Data Browsing Cards */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">User Analytics</h3>

            <Link
              to={`/admin/users/${user.id}/contracts`}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">Contracts</p>
                  <p className="text-[10px] text-white/30">Purchase agreements</p>
                </div>
              </div>
              <span className="text-lg font-bold text-sky-400">{user._count?.contracts ?? 0}</span>
            </Link>

            <Link
              to={`/admin/users/${user.id}/invoices`}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Receipt className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">Invoices</p>
                  <p className="text-[10px] text-white/30">Billing history</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-400">{user._count?.invoices ?? 0}</span>
            </Link>

            <Link
              to={`/admin/users/${user.id}/repair-orders`}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">Repair Orders</p>
                  <p className="text-[10px] text-white/30">Device repairs</p>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-400">{user._count?.repairOrders ?? 0}</span>
            </Link>
          </div>
        </div>

        {/* Editing Column */}
        <div className="lg:col-span-2">
          {editing ? (
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6">Modify Account Settings</h3>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    Change Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-violet-500 focus:bg-white/[0.05] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    Account Status
                  </label>
                  {isSelf ? (
                    <div className="mt-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 text-xs text-white/40">
                      You cannot deactivate your own administrative account.
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        <UserCheck className="h-4.5 w-4.5" />
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          !isActive
                            ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        <UserX className="h-4.5 w-4.5" />
                        <span>Inactive</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    Account Role
                  </label>
                  {isSelf ? (
                    <div className="mt-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 text-xs text-white/40">
                      You cannot demote or change your own administrative role.
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('staff')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'staff'
                            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                            : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>Staff</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          role === 'admin'
                            ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                            : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        <Shield className="h-4.5 w-4.5" />
                        <span>Admin</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {saving ? 'Saving Changes...' : 'Save User Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      // Reset values
                      setName(user.name)
                      setEmail(user.email)
                      setRole(user.role)
                      setIsActive(user.isActive)
                      setPassword('')
                    }}
                    className="rounded-xl bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/50 transition hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Dashboard user insights placeholders */
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
              <UserCog className="h-12 w-12 text-white/10 mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-white/60">Overview & Insights</h3>
              <p className="mt-2 text-sm text-white/30 max-w-sm">
                Use the left-hand column to edit account configurations or browse contracts, invoices, and repair orders generated by this user.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-gray-900 p-6 shadow-2xl animate-scale-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete User Account</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              Are you absolutely sure you want to delete <span className="font-semibold text-white/80">{user.name}</span>?
              This action is <span className="text-red-400 font-semibold">permanent</span> and will cascade, hard-deleting
              all associated contracts, invoices, and repair orders.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08]"
              >
                No, Keep Account
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

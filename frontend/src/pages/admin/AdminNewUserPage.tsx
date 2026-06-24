import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft, Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createUser } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'

export function AdminNewUserPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')

  // Form UX
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createUser({ name, email, password, role })
      setSuccess(true)
      setTimeout(() => {
        navigate('/admin/users')
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.admin.createUserFailed
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8">
      <div className="w-full max-w-xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/users')}
          className="group mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{t.admin.backToUsers}</span>
        </button>

        {/* Card */}
        <div className="card p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.admin.newUserTitle}</h2>
              <p className="text-xs text-slate-500">{t.admin.newUserSubtitle}</p>
            </div>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-emerald-700">{t.admin.userCreated}</p>
              <p className="mt-1 text-xs text-slate-400">Redirecting you back to the user list...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="label">{t.admin.fullName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input h-11"
                />
              </div>

              <div>
                <label className="label">{t.admin.emailAddress}</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input h-11"
                />
              </div>

              <div>
                <label className="label">{t.admin.password}</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter user password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Must be at least 6 characters.</p>
              </div>

              <div>
                <label className="label">{t.admin.accountRole}</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold uppercase tracking-wider transition ${
                      role === 'staff'
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <span>{t.admin.roleStaffLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold uppercase tracking-wider transition ${
                      role === 'admin'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{t.admin.roleAdminLabel}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-12 w-full font-semibold disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>{t.admin.createUser}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

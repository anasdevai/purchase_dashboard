import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageProvider'

type LoginValues = {
  name?: string
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<LoginValues>({
    defaultValues: { name: '', email: '', password: '' },
  })

  const destination =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/dashboard'

  const onSubmit = async (values: LoginValues) => {
    setError(null)
    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        await signup(values.name?.trim() || t.common.defaultStaffUser, values.email, values.password)
      } else {
        await login(values.email, values.password)
      }
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errors.authFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50">
      <div className="flex shrink-0 justify-end px-4 py-4 sm:px-6">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="card w-full max-w-[460px] rounded-2xl p-8 shadow-sm md:p-10">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-lg font-semibold text-slate-900">
                {t.app.nameLine1} {t.app.nameLine2}
              </div>
              <div className="mt-0.5 text-sm text-slate-500">
                {mode === 'signup' ? t.login.signupSubtitle : t.login.subtitle}
              </div>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {mode === 'signup' ? (
              <div>
                <label className="label">{t.login.name}</label>
                <input
                  className="input h-12 text-sm"
                  placeholder={t.login.namePlaceholder}
                  {...register('name', { required: mode === 'signup' })}
                />
              </div>
            ) : null}

            <div>
              <label className="label">{t.login.email}</label>
              <input
                className="input h-12 text-sm"
                placeholder={t.login.emailPlaceholder}
                {...register('email', { required: true })}
              />
            </div>
            <div>
              <label className="label">{t.login.password}</label>
              <div className="relative">
                <input
                  className="input h-12 pr-11 text-sm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.login.passwordPlaceholder}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  {...register('password', { required: true, minLength: 8 })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                  aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary mt-2 h-12 w-full text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? t.common.pleaseWait
                : mode === 'signup'
                  ? t.login.createAccount
                  : t.login.login}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signup' ? t.login.alreadyHaveAccount : t.login.needAccount}{' '}
            <button
              type="button"
              onClick={() => {
                setError(null)
                reset()
                setShowPassword(false)
                setMode((current) => (current === 'signup' ? 'login' : 'signup'))
              }}
              className="font-semibold text-primary hover:text-primary-hover"
            >
              {mode === 'signup' ? t.login.login : t.login.signup}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageProvider'

const CLICK_INTERNET_LOGO = '/company_logo.png'
const SCELRA_LOGO = '/assets/sclera-logo.png'

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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-100">
      <div className="flex shrink-0 justify-end px-4 py-4 sm:px-6">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60">
          <div className="bg-primary px-8 pb-9 pt-10 text-center text-white">
            <img
              src={CLICK_INTERNET_LOGO}
              alt="Click Internet"
              className="mx-auto h-[4.5rem] w-auto max-w-[240px] object-contain sm:h-20"
            />
            <h1 className="mt-6 text-lg font-bold leading-snug tracking-tight">
              {t.login.appTitle}
            </h1>
            <p className="mt-2 text-sm font-normal text-white/90">
              {mode === 'signup' ? t.login.signupSubtitle : t.login.subtitle}
            </p>
          </div>

          <div className="px-8 pb-4 pt-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
              {mode === 'signup' ? (
                <div>
                  <label className="label">{t.login.name}</label>
                  <input
                    className="input h-12 text-sm"
                    placeholder={t.login.namePlaceholder}
                    data-testid="login-name-input"
                    {...register('name', { required: mode === 'signup' })}
                  />
                </div>
              ) : null}

              <div>
                <label className="label">{t.login.email}</label>
                <input
                  className="input h-12 text-sm"
                  placeholder={t.login.emailPlaceholder}
                  data-testid="login-email-input"
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
                    data-testid="login-password-input"
                    {...register('password', { required: true, minLength: 8 })}
                  />
                  <button
                    type="button"
                    data-testid="login-toggle-password"
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
                <div
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100"
                  data-testid="login-error"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                data-testid="login-submit-btn"
                disabled={isSubmitting}
                className="btn btn-primary mt-1 h-12 w-full text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? t.common.pleaseWait
                  : mode === 'signup'
                    ? t.login.createAccount
                    : t.login.login}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-500">
              {mode === 'signup' ? t.login.alreadyHaveAccount : t.login.needAccount}{' '}
              <button
                type="button"
                data-testid="login-mode-toggle"
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

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex min-w-0 items-center justify-center gap-2.5">
                <span className="shrink-0 text-xs font-medium leading-none text-slate-500">
                  {t.login.poweredBy}
                </span>
                <img
                  src={SCELRA_LOGO}
                  alt="Scelra"
                  className="h-[72px] w-auto max-w-[18rem] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

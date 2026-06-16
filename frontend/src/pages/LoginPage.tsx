import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageProvider'
import { getAuthErrorMessage, logApiError } from '../utils/apiErrors'

const SCLERA_LOGO = '/assets/sclera-logo.png'

const loginInputClassName =
  'input h-12 border-slate-200 text-sm text-[#111111] placeholder:text-slate-400 focus:border-[#111111] focus:ring-[#111111]/15'

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
  const [error, setError] = useState<unknown>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<LoginValues>({
    defaultValues: { name: '', email: '', password: '' },
  })

  const destination =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/dashboard'

  const onSubmit = async (values: LoginValues) => {
    setError(null)
    setShowSuccess(false)
    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        await signup(values.name?.trim() || t.common.defaultStaffUser, values.email, values.password)
        setShowSuccess(true)
        window.setTimeout(() => {
          navigate(destination, { replace: true })
        }, 900)
      } else {
        await login(values.email, values.password)
        navigate(destination, { replace: true })
      }
    } catch (err) {
      logApiError(mode === 'login' ? 'login' : 'signup', err)
      setError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-auto bg-app-bg">
      <div className="flex shrink-0 justify-end px-4 py-4 sm:px-6">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60">
        <div className="bg-primary px-8 pb-3 pt-2 text-center text-white">
            <img
              src={SCLERA_LOGO}
              alt="Sclera"
              className="mx-auto h-28 w-auto max-w-[380px] object-contain invert sm:h-32"
              data-testid="login-logo"
            />
            <h1 className="mt-3 text-lg font-bold leading-snug tracking-tight">
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
                  <label className="label text-[#111111]">{t.login.name}</label>
                  <input
                    className={loginInputClassName}
                    placeholder={t.login.namePlaceholder}
                    data-testid="login-name-input"
                    {...register('name', { required: mode === 'signup' })}
                  />
                </div>
              ) : null}

              <div>
                <label className="label text-[#111111]">{t.login.email}</label>
                <input
                  className={loginInputClassName}
                  placeholder={t.login.emailPlaceholder}
                  data-testid="login-email-input"
                  {...register('email', { required: true })}
                />
              </div>
              <div>
                <label className="label text-[#111111]">{t.login.password}</label>
                <div className="relative">
                  <input
                    className={`${loginInputClassName} pr-11`}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
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

              {showSuccess ? (
                <div
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100"
                  data-testid="login-success"
                >
                  {t.login.accountCreatedSuccess}
                </div>
              ) : null}

              {error ? (
                <div
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100"
                  data-testid="login-error"
                  role="alert"
                >
                  {getAuthErrorMessage(error, t)}
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
                  setShowSuccess(false)
                  reset()
                  setShowPassword(false)
                  setMode((current) => (current === 'signup' ? 'login' : 'signup'))
                }}
                className="font-semibold text-[#111111] underline-offset-2 hover:underline"
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
                  src={SCLERA_LOGO}
                  alt="Sclera"
                  className="h-[102px] w-auto max-w-[10rem] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

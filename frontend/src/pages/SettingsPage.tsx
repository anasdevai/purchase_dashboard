import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageProvider'
import {
  defaultShopSettings,
  loadShopSettings,
  saveShopSettings,
  validateShopSettings,
  type ShopSettings,
  type ShopSettingsValidationErrors,
} from '../services/shopSettings'

const MAX_LOGO_BYTES = 2 * 1024 * 1024

export function SettingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | undefined>()
  const [fieldErrors, setFieldErrors] = useState<ShopSettingsValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue } = useForm<ShopSettings>({
    defaultValues: defaultShopSettings(),
  })

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    loadShopSettings(user.id).then((saved) => {
      if (!alive) return
      reset(saved)
      setLogoPreview(saved.logoDataUrl)
    })
    return () => {
      alive = false
    }
  }, [user?.id, reset])

  const mapValidationMessage = (key: keyof ShopSettingsValidationErrors) => {
    const code = fieldErrors[key]
    if (!code) return null
    if (key === 'shopEmail' && code === 'invalid') return t.settings.errors.invalidEmail
    return t.settings.errors.required
  }

  const onSubmit = async (values: ShopSettings) => {
    if (!user?.id) return

    const trimmed: ShopSettings = {
      shopName: values.shopName.trim(),
      shopAddress: values.shopAddress.trim(),
      shopPhone: values.shopPhone.trim(),
      shopEmail: values.shopEmail.trim(),
      ownerName: values.ownerName.trim(),
      logoDataUrl: logoPreview,
    }

    const errors = validateShopSettings(trimmed)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaveError(null)
    try {
      const saved = await saveShopSettings(user.id, trimmed)
      reset(saved)
      setLogoPreview(saved.logoDataUrl)
      setSuccessMessage(t.settings.savedSuccess)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err) {
      setSuccessMessage(null)
      setSaveError(err instanceof Error ? err.message : t.common.errors.settingsSaveFailed)
    }
  }

  const onLogoSelected = async (file: File | undefined) => {
    setLogoError(null)
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setLogoError(t.settings.errors.logoType)
      return
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(t.settings.errors.logoSize)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined
      if (!result?.startsWith('data:image/')) {
        setLogoError(t.settings.errors.logoType)
        return
      }
      setLogoPreview(result)
      setValue('logoDataUrl', result)
    }
    reader.onerror = () => setLogoError(t.settings.errors.logoRead)
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview(undefined)
    setValue('logoDataUrl', undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-slate-900">{t.pages.settings}</div>
      <p className="max-w-2xl text-sm text-slate-600">{t.settings.description}</p>

      {successMessage ? (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
          {successMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {saveError}
        </div>
      ) : null}

      <form
        className="card mx-auto w-full max-w-2xl overflow-hidden"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="card-header">
          <div className="text-sm font-semibold text-slate-900">{t.settings.shopDetails}</div>
        </div>

        <div className="card-body space-y-5">
          <div>
            <label className="label">{t.settings.shopName}</label>
            <input
              className="input h-12 text-sm"
              placeholder={t.settings.shopNamePlaceholder}
              {...register('shopName')}
            />
          </div>

          <div>
            <label className="label">{t.settings.shopAddress}</label>
            <textarea
              className="input min-h-[88px] resize-y py-3 text-sm"
              rows={3}
              placeholder={t.settings.shopAddressPlaceholder}
              {...register('shopAddress')}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label">{t.settings.shopPhone}</label>
              <input
                className="input h-12 text-sm"
                type="tel"
                placeholder={t.settings.shopPhonePlaceholder}
                {...register('shopPhone')}
              />
            </div>
            <div>
              <label className="label">{t.settings.shopEmail}</label>
              <input
                className="input h-12 text-sm"
                type="email"
                placeholder={t.settings.shopEmailPlaceholder}
                {...register('shopEmail')}
              />
              {mapValidationMessage('shopEmail') ? (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {mapValidationMessage('shopEmail')}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="label">{t.settings.ownerName}</label>
            <input
              className="input h-12 text-sm"
              placeholder={t.settings.ownerNamePlaceholder}
              {...register('ownerName')}
            />
          </div>

          <div>
            <label className="label">{t.settings.shopLogo}</label>
            <p className="mb-2 text-xs text-slate-500">{t.settings.shopLogoHint}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-2 text-center text-[10px] font-medium text-slate-400">
                    {t.settings.noLogo}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(event) => onLogoSelected(event.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-secondary h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t.settings.uploadLogo}
                </button>
                {logoPreview ? (
                  <button type="button" className="btn btn-ghost h-10" onClick={removeLogo}>
                    {t.settings.removeLogo}
                  </button>
                ) : null}
              </div>
            </div>
            {logoError ? (
              <p className="mt-1 text-xs font-medium text-red-600">{logoError}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="btn btn-primary h-12 w-full text-base font-medium sm:w-auto sm:min-w-[200px]"
          >
            {t.settings.save}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Info, Save, Shield, Upload, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../auth/AuthContext'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import {
  defaultShopSettings,
  loadShopSettings,
  saveShopSettings,
  validateShopSettings,
  type ShopSettings,
  type ShopSettingsValidationErrors,
} from '../services/shopSettings'
import { RepairCompaniesCard } from '../components/settings/RepairCompaniesCard'
import { FloatingSelect } from '../components/common/FloatingSelect'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const VAT_RATES = ['20', '10', '13', '0'] as const
const COUNTRIES = ['Austria', 'Germany', 'Switzerland', 'Other'] as const

function SettingsCard(props: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${props.className ?? ''}`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{props.title}</h2>
      </div>
      <div className="space-y-4 px-5 py-5">{props.children}</div>
    </section>
  )
}

function FieldLabel(props: { label: string; required?: boolean; optional?: boolean; optionalText?: string }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-600">
      {props.label}
      {props.required ? <span className="text-red-500"> *</span> : null}
      {props.optional ? (
        <span className="font-normal text-slate-400"> ({props.optionalText})</span>
      ) : null}
    </label>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { showToast } = useAppConfirm()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | undefined>()
  const [fieldErrors, setFieldErrors] = useState<ShopSettingsValidationErrors>({})
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<ShopSettings>({
    defaultValues: defaultShopSettings(),
  })

  const defaultVatRate = watch('defaultVatRate')
  const country = watch('country')

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
    if (key === 'defaultVatCustom' && code === 'invalid') return t.settings.errors.invalidCustomVat
    return t.settings.errors.required
  }

  const onSubmit = async (values: ShopSettings) => {
    if (!user?.id) return

    const trimmed: ShopSettings = {
      ...values,
      shopName: values.shopName.trim(),
      shopPhone: values.shopPhone.trim(),
      shopEmail: values.shopEmail.trim(),
      ownerName: values.ownerName.trim(),
      street: values.street.trim(),
      zipCode: values.zipCode.trim(),
      city: values.city.trim(),
      country: values.country.trim(),
      website: values.website.trim(),
      vatNumber: values.vatNumber.trim(),
      companyRegistrationNumber: values.companyRegistrationNumber.trim(),
      taxNumber: values.taxNumber.trim(),
      accountHolder: values.accountHolder.trim(),
      iban: values.iban.trim(),
      bicSwift: values.bicSwift.trim(),
      bankName: values.bankName.trim(),
      defaultVatCustom: values.defaultVatRate === 'custom' ? values.defaultVatCustom.trim() : '',
      logoDataUrl: logoPreview,
    }

    const errors = validateShopSettings(trimmed)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const saved = await saveShopSettings(user.id, trimmed)
      reset(saved)
      setLogoPreview(saved.logoDataUrl)
      showToast('success', t.common.toasts.settingsSaved)
    } catch (err) {
      logApiError('settings save', err)
      showToast('error', getFriendlyErrorMessage(err, 'settingsSave', t))
    } finally {
      setSaving(false)
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
      showToast('success', t.common.toasts.logoUpdated)
    }
    reader.onerror = () => setLogoError(t.settings.errors.logoRead)
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview(undefined)
    setValue('logoDataUrl', undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onLogoDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    onLogoSelected(event.dataTransfer.files?.[0])
  }

  const vatBadgeClass = (rate: string) => {
    if (rate === '20') return 'bg-blue-100 text-blue-700'
    if (rate === '10') return 'bg-emerald-100 text-emerald-700'
    if (rate === '13') return 'bg-teal-100 text-teal-700'
    return 'bg-sky-100 text-sky-700'
  }

  const vatBadgeLabel = (rate: string) => {
    if (rate === '20') return t.settings.vatStandard
    if (rate === '10') return t.settings.vatReduced
    if (rate === '13') return t.settings.vatSpecial
    return t.settings.vatExempt
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t.pages.settings}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{t.settings.description}</p>
      </div>

      <form
        data-testid="settings-form"
        className="space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <SettingsCard title={t.settings.companyInformation}>
              <div>
                <FieldLabel label={t.settings.shopName} required />
                <input
                  data-testid="settings-shop-name"
                  className="input h-11"
                  placeholder={t.settings.shopNamePlaceholder}
                  {...register('shopName')}
                />
              </div>

              <div>
                <FieldLabel label={t.settings.ownerName} required />
                <input
                  data-testid="settings-owner-name"
                  className="input h-11"
                  placeholder={t.settings.ownerNamePlaceholder}
                  {...register('ownerName')}
                />
              </div>

              <div>
                <FieldLabel label={t.settings.street} required />
                <input
                  data-testid="settings-shop-address"
                  className="input h-11"
                  placeholder={t.settings.streetPlaceholder}
                  {...register('street')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel label={t.settings.zipCode} required />
                  <input
                    className="input h-11"
                    placeholder={t.settings.zipCodePlaceholder}
                    {...register('zipCode')}
                  />
                </div>
                <div>
                  <FieldLabel label={t.settings.city} required />
                  <input
                    className="input h-11"
                    placeholder={t.settings.cityPlaceholder}
                    {...register('city')}
                  />
                </div>
              </div>

              <div>
                <FieldLabel label={t.settings.country} required />
                <FloatingSelect
                  value={country ?? ''}
                  placeholder={t.settings.countryPlaceholder}
                  options={[
                    { value: '', label: t.settings.countryPlaceholder },
                    ...COUNTRIES.map((countryOption) => ({
                      value: countryOption,
                      label: countryOption,
                    })),
                  ]}
                  onChange={(value) => setValue('country', value, { shouldDirty: true })}
                />
              </div>
            </SettingsCard>

            <SettingsCard title={t.settings.bankInformation}>
              <div>
                <FieldLabel label={t.settings.accountHolder} required />
                <input
                  className="input h-11"
                  placeholder={t.settings.accountHolderPlaceholder}
                  {...register('accountHolder')}
                />
              </div>

              <div>
                <FieldLabel label={t.settings.iban} required />
                <input
                  className="input h-11"
                  placeholder={t.settings.ibanPlaceholder}
                  {...register('iban')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel label={t.settings.bicSwift} required />
                  <input
                    className="input h-11"
                    placeholder={t.settings.bicSwiftPlaceholder}
                    {...register('bicSwift')}
                  />
                </div>
                <div>
                  <FieldLabel label={t.settings.bankName} required />
                  <input
                    className="input h-11"
                    placeholder={t.settings.bankNamePlaceholder}
                    {...register('bankName')}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{t.settings.bankSecurityNote}</span>
              </div>
            </SettingsCard>
          </div>

          <div className="space-y-5">
            <SettingsCard title={t.settings.taxInformation}>
              <div>
                <FieldLabel label={t.settings.vatNumber} required />
                <input
                  className="input h-11"
                  placeholder={t.settings.vatNumberPlaceholder}
                  {...register('vatNumber')}
                />
              </div>

              <div>
                <FieldLabel
                  label={t.settings.companyRegistrationNumber}
                  optional
                  optionalText={t.settings.optional}
                />
                <input
                  className="input h-11"
                  placeholder={t.settings.companyRegistrationPlaceholder}
                  {...register('companyRegistrationNumber')}
                />
              </div>

              <div>
                <FieldLabel label={t.settings.taxNumber} optional optionalText={t.settings.optional} />
                <input
                  className="input h-11"
                  placeholder={t.settings.taxNumberPlaceholder}
                  {...register('taxNumber')}
                />
              </div>
            </SettingsCard>

            <SettingsCard title={t.settings.contactInformation}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                  <FieldLabel label={t.settings.shopPhone} required />
                  <input
                    data-testid="settings-shop-phone"
                    className="input h-11"
                    type="tel"
                    placeholder={t.settings.shopPhonePlaceholder}
                    {...register('shopPhone')}
                  />
                </div>
                <div>
                  <FieldLabel label={t.settings.shopEmail} required />
                  <input
                    data-testid="settings-shop-email"
                    className="input h-11"
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
                <div>
                  <FieldLabel label={t.settings.website} optional optionalText={t.settings.optional} />
                  <input
                    className="input h-11"
                    type="url"
                    placeholder={t.settings.websitePlaceholder}
                    {...register('website')}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title={t.settings.branding}>
              <div>
                <FieldLabel label={t.settings.shopLogo} />
                <p className="mb-3 text-xs text-slate-500">{t.settings.shopLogoHint}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 text-xs font-medium text-slate-600">{t.settings.currentLogo}</div>
                    <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain p-2" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-800"
                            onClick={removeLogo}
                            aria-label={t.settings.removeLogo}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="px-3 text-center text-xs font-medium text-slate-400">
                          {t.settings.noLogo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border-2 border-dashed p-4 transition ${
                      dragActive
                        ? 'border-primary bg-primary-light/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onLogoDrop}
                  >
                    <div className="mb-3 text-xs font-medium text-slate-600">{t.settings.uploadNewLogo}</div>
                    <button
                      type="button"
                      className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg text-slate-500 transition hover:bg-slate-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-medium">{t.settings.uploadDragHint}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      data-testid="settings-logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(event) => onLogoSelected(event.target.files?.[0])}
                    />
                  </div>
                </div>

                {logoError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{logoError}</p>
                ) : null}
              </div>
            </SettingsCard>

            <SettingsCard title={t.settings.defaultVatRate}>
              <p className="text-xs text-slate-500">{t.settings.defaultVatRateHint}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                {VAT_RATES.map((rate) => (
                  <label
                    key={rate}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                      defaultVatRate === rate
                        ? 'border-primary bg-primary-light/30 ring-1 ring-primary/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={rate}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                      {...register('defaultVatRate')}
                    />
                    <span className="font-semibold text-slate-800">{rate}%</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${vatBadgeClass(rate)}`}
                    >
                      {vatBadgeLabel(rate)}
                    </span>
                  </label>
                ))}

                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                    defaultVatRate === 'custom'
                      ? 'border-primary bg-primary-light/30 ring-1 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="custom"
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    {...register('defaultVatRate')}
                  />
                  <span className="font-medium text-slate-700">{t.settings.vatCustom}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="h-8 w-16 rounded-md border border-slate-200 px-2 text-sm"
                    placeholder={t.settings.vatCustomPlaceholder}
                    disabled={defaultVatRate !== 'custom'}
                    {...register('defaultVatCustom')}
                  />
                  <span className="text-sm text-slate-500">%</span>
                </label>
              </div>
              {mapValidationMessage('defaultVatCustom') ? (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {mapValidationMessage('defaultVatCustom')}
                </p>
              ) : null}
            </SettingsCard>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>{t.settings.infoBanner}</p>
        </div>

        <RepairCompaniesCard />

        <button
          type="submit"
          data-testid="settings-save"
          disabled={saving}
          className="btn btn-primary h-12 min-w-[220px] px-6 text-sm font-semibold disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {t.settings.save}
        </button>
      </form>
    </div>
  )
}

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
import {
  fetchEmailSettings,
  saveSmtpSettings,
  saveImapSettings,
  testSmtpConnection,
  saveEmailTemplate,
  previewTemplate,
} from '../api/email'
import type { EmailTemplateName } from '../types/email'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const VAT_RATES = ['20', '10', '13', '0'] as const
const COUNTRIES = ['Austria', 'Germany', 'Switzerland', 'Other'] as const

const emailLocalizations = {
  de: {
    tabTitleShop: 'Shop-Branding',
    tabTitleEmail: 'E-Mail & Vorlagen',
    smtpSettings: 'SMTP-Konfiguration (Ausgehende E-Mails)',
    imapSettings: 'IMAP-Konfiguration (Eingehende E-Mails)',
    host: 'Server / Host',
    port: 'Port',
    encryption: 'Verschlüsselung',
    username: 'Benutzername / E-Mail',
    password: 'Passwort',
    passwordPlaceholder: 'Unverändert (Passwort gesetzt)',
    passwordRequiredPlaceholder: 'Passwort eingeben',
    saveSettings: 'Einstellungen speichern',
    testConnection: 'Verbindung testen',
    testConnectionPlaceholder: 'Empfänger-E-Mail eingeben',
    testing: 'Wird getestet...',
    saving: 'Wird gespeichert...',
    templatesTitle: 'E-Mail-Vorlagen anpassen',
    templateSelect: 'Vorlage auswählen',
    templateSubject: 'E-Mail-Betreff',
    templateBody: 'E-Mail-Inhalt',
    placeholdersTitle: 'Verfügbare Platzhalter (Klicken zum Einfügen)',
    previewTitle: 'Live-Vorschau der Vorlage',
    previewButton: 'Vorschau generieren',
    previewExplanation: 'Unten sehen Sie, wie die E-Mail mit Beispiel-Kaufdaten kompiliert aussieht.',
    smtpDesc: 'Konfigurieren Sie Ihren SMTP-Server, um E-Mails direkt von Ihrer eigenen Adresse zu senden.',
    imapDesc: 'Geben Sie Ihre IMAP-Zugangsdaten an, um den E-Mail-Empfang und die Protokolle zu synchronisieren.',
    templatesDesc: 'Passen Sie die Betreffzeile und den E-Mail-Text für Ihre automatischen Benachrichtigungen an.',
  },
  en: {
    tabTitleShop: 'Shop & Branding',
    tabTitleEmail: 'Email & Templates',
    smtpSettings: 'SMTP Configuration (Outgoing Email)',
    imapSettings: 'IMAP Configuration (Incoming Email)',
    host: 'Server / Host',
    port: 'Port',
    encryption: 'Encryption',
    username: 'Username / Email',
    password: 'Password',
    passwordPlaceholder: 'Unchanged (Password is set)',
    passwordRequiredPlaceholder: 'Enter password',
    saveSettings: 'Save Settings',
    testConnection: 'Test Connection',
    testConnectionPlaceholder: 'Enter recipient email',
    testing: 'Testing...',
    saving: 'Saving...',
    templatesTitle: 'Customize Email Templates',
    templateSelect: 'Select Template',
    templateSubject: 'Email Subject',
    templateBody: 'Email Body',
    placeholdersTitle: 'Available Placeholders (Click to insert)',
    previewTitle: 'Live Template Preview',
    previewButton: 'Generate Preview',
    previewExplanation: 'Below is how the email compiles with sample transaction data.',
    smtpDesc: 'Configure your SMTP mail server to send emails directly from your own domain email address.',
    imapDesc: 'Provide your IMAP credentials to synchronize incoming mail statuses and logs.',
    templatesDesc: 'Adjust the subjects and body texts sent automatically for notifications.',
  }
}

const templateDisplayNames = {
  de: {
    Quotation: 'Angebot an Kunden',
    Invoice: 'Rechnung an Kunden',
    OrderConfirmation: 'Reparatur-Auftragsbestätigung',
    ReadyForPickup: 'Bereit zur Abholung',
    PickupReminder: 'Erinnerung zur Abholung (nach 3 Tagen)',
    PaymentReminder: 'Zahlungserinnerung (Rechnung offen)',
    AppointmentConfirmation: 'Terminbestätigung',
  },
  en: {
    Quotation: 'Send Quotation',
    Invoice: 'Send Invoice',
    OrderConfirmation: 'Order Confirmation',
    ReadyForPickup: 'Ready for Pickup',
    PickupReminder: 'Pickup Reminder (after 3 days)',
    PaymentReminder: 'Payment Reminder',
    AppointmentConfirmation: 'Appointment Confirmation',
  }
}

const getDefaultSubject = (name: string) => {
  if (name === 'Quotation') return 'Angebot - {ORDER_NUMBER}';
  if (name === 'Invoice') return 'Rechnung - {ORDER_NUMBER}';
  if (name === 'OrderConfirmation') return 'Reparaturauftrag - {ORDER_NUMBER}';
  if (name === 'ReadyForPickup') return 'Bereit zur Abholung - {ORDER_NUMBER}';
  if (name === 'PickupReminder') return 'Erinnerung: Ihr Gerät ist abholbereit - {ORDER_NUMBER}';
  if (name === 'PaymentReminder') return 'Zahlungserinnerung – Rechnung {ORDER_NUMBER}';
  if (name === 'AppointmentConfirmation') return 'Terminbestätigung - {ORDER_NUMBER}';
  return '';
};

const getDefaultBody = (name: string) => {
  if (name === 'Quotation') return 'Guten Tag,\n\nvielen Dank für Ihre Anfrage.\nAnbei erhalten Sie Ihr persönliches Angebot. Bitte prüfen Sie die enthaltenen Leistungen und Preise. Sollten Sie Fragen haben oder Änderungen wünschen, stehen wir Ihnen gerne zur Verfügung.\n\nNach Ihrer Freigabe können wir die Arbeiten umgehend einplanen und durchführen.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen';
  if (name === 'Invoice') return 'Guten Tag,\n\nvielen Dank für Ihren Auftrag.\nAnbei erhalten Sie die Rechnung zu den durchgeführten Leistungen. Wir bedanken uns für Ihr Vertrauen und freuen uns, dass wir Ihnen weiterhelfen durften.\n\nBei Fragen zur Rechnung oder zu unseren Leistungen stehen wir Ihnen jederzeit gerne zur Verfügung.\nWir würden uns sehr über eine Bewertung freuen.\n\nMit freundlichen Grüßen';
  if (name === 'OrderConfirmation') return 'Sehr geehrte(r) {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME},\n\nanbei senden wir Ihnen die Bestätigung und Details zu Ihrem Reparaturauftrag {ORDER_NUMBER} als PDF-Anhang.\n\nWir informieren Sie umgehend, sobald Ihr Gerät fertiggestellt und zur Abholung bereit ist.\n\nMit freundlichen Grüßen,\nIhr Service-Team';
  if (name === 'ReadyForPickup') return 'Sehr geehrte(r) {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME},\n\nIhr Gerät für den Reparaturauftrag {ORDER_NUMBER} ist fertiggestellt und steht zur Abholung bereit.\n\nBitte bringen Sie diesen Beleg oder Ihren Ausweis zur Abholung mit.\n\nMit freundlichen Grüßen,\nIhr Service-Team';
  if (name === 'PickupReminder') return 'Sehr geehrte(r) {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME},\n\ndies ist eine freundliche Erinnerung, dass Ihr Gerät ({DEVICE}) für den Reparaturauftrag {ORDER_NUMBER} bereits zur Abholung bereitsteht.\n\nBitte holen Sie das Gerät baldmöglichst ab.\n\nMit freundlichen Grüßen,\nIhr Service-Team';
  if (name === 'PaymentReminder') return 'Sehr geehrte(r) {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME},\n\nwir möchten Sie freundlich an die offene Zahlung der Rechnung {ORDER_NUMBER} über {PRICE} erinnern.\n\nBitte überweisen Sie den Betrag so bald wie möglich.\n\nMit freundlichen Grüßen,\nIhr Shop-Team';
  if (name === 'AppointmentConfirmation') return 'Sehr geehrte(r) {CUSTOMER_FIRST_NAME} {CUSTOMER_LAST_NAME},\n\nwir bestätigen Ihren Termin für Ihre Gerätereparatur am {DATE}.\n\nMit freundlichen Grüßen,\nIhr Service-Team';
  return '';
};

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

  // Sub-tab state
  const [activeTab, setActiveTab] = useState<'shop' | 'email'>('shop')
  const loc = t.pages.settings === 'Einstellungen' ? emailLocalizations.de : emailLocalizations.en

  // SMTP settings state
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(1025)
  const [smtpEncryption, setSmtpEncryption] = useState<'none' | 'SSL' | 'TLS' | 'STARTTLS'>('none')
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpHasPassword, setSmtpHasPassword] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [testEmail, setTestEmail] = useState(user?.email || '')
  const [testingSmtp, setTestingSmtp] = useState(false)

  // IMAP settings state
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState(143)
  const [imapEncryption, setImapEncryption] = useState<'none' | 'SSL' | 'TLS' | 'STARTTLS'>('none')
  const [imapUsername, setImapUsername] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [imapHasPassword, setImapHasPassword] = useState(false)
  const [imapSaving, setImapSaving] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Quotation')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<ShopSettings>({
    defaultValues: defaultShopSettings(),
  })

  const defaultVatRate = watch('defaultVatRate')

  // Load shop settings
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

  // Load email configurations
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    fetchEmailSettings()
      .then((data) => {
        if (!alive) return
        if (data.smtp) {
          setSmtpHost(data.smtp.host)
          setSmtpPort(data.smtp.port)
          setSmtpEncryption(data.smtp.encryption)
          setSmtpUsername(data.smtp.username)
          setSmtpHasPassword(!!data.smtp.hasPassword)
        }
        if (data.imap) {
          setImapHost(data.imap.host)
          setImapPort(data.imap.port)
          setImapEncryption(data.imap.encryption)
          setImapUsername(data.imap.username)
          setImapHasPassword(!!data.imap.hasPassword)
        }
        if (data.templates) {
          setTemplates(data.templates)
          const currentTemp = data.templates.find(t => t.name === selectedTemplateName)
          if (currentTemp) {
            setTemplateSubject(currentTemp.subject)
            setTemplateBody(currentTemp.body)
          } else {
            setTemplateSubject(getDefaultSubject(selectedTemplateName))
            setTemplateBody(getDefaultBody(selectedTemplateName))
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load email settings:", err)
      })
    return () => {
      alive = false
    }
  }, [user?.id])

  // Sync templates on selectedTemplateName changes
  useEffect(() => {
    const currentTemp = templates.find(t => t.name === selectedTemplateName)
    if (currentTemp) {
      setTemplateSubject(currentTemp.subject)
      setTemplateBody(currentTemp.body)
    } else {
      setTemplateSubject(getDefaultSubject(selectedTemplateName))
      setTemplateBody(getDefaultBody(selectedTemplateName))
    }
    setPreviewData(null)
  }, [selectedTemplateName, templates])

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

  // SMTP/IMAP/Templates Save Handlers
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!smtpHost || !smtpPort || !smtpUsername) {
      showToast('error', 'SMTP Host, Port, and Username are required.')
      return
    }
    if (!smtpHasPassword && !smtpPassword) {
      showToast('error', 'SMTP Password is required.')
      return
    }

    setSmtpSaving(true)
    try {
      await saveSmtpSettings({
        host: smtpHost,
        port: Number(smtpPort),
        encryption: smtpEncryption,
        username: smtpUsername,
        password: smtpPassword || undefined,
      })
      setSmtpHasPassword(true)
      setSmtpPassword('')
      showToast('success', 'SMTP settings saved successfully.')
    } catch (err) {
      logApiError('save SMTP', err)
      showToast('error', getFriendlyErrorMessage(err, 'settingsSave', t))
    } finally {
      setSmtpSaving(false)
    }
  }

  const handleTestSmtp = async () => {
    if (!testEmail) {
      showToast('error', 'Recipient email address is required for testing.')
      return
    }
    setTestingSmtp(true)
    try {
      await testSmtpConnection(testEmail)
      showToast('success', `Test email sent successfully to ${testEmail}. Check your inbox!`)
    } catch (err) {
      logApiError('test SMTP', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setTestingSmtp(false)
    }
  }

  const handleSaveImap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imapHost || !imapPort || !imapUsername) {
      showToast('error', 'IMAP Host, Port, and Username are required.')
      return
    }
    if (!imapHasPassword && !imapPassword) {
      showToast('error', 'IMAP Password is required.')
      return
    }

    setImapSaving(true)
    try {
      await saveImapSettings({
        host: imapHost,
        port: Number(imapPort),
        encryption: imapEncryption,
        username: imapUsername,
        password: imapPassword || undefined,
      })
      setImapHasPassword(true)
      setImapPassword('')
      showToast('success', 'IMAP settings saved successfully.')
    } catch (err) {
      logApiError('save IMAP', err)
      showToast('error', getFriendlyErrorMessage(err, 'settingsSave', t))
    } finally {
      setImapSaving(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateSubject || !templateBody) {
      showToast('error', 'Template Subject and Body are required.')
      return
    }
    setSavingTemplate(true)
    try {
      const result = await saveEmailTemplate({
        name: selectedTemplateName as EmailTemplateName,
        subject: templateSubject,
        body: templateBody,
      })
      setTemplates((prev) => {
        const filtered = prev.filter((t) => t.name !== selectedTemplateName)
        return [...filtered, result.template]
      })
      showToast('success', 'Email template saved successfully.')
    } catch (err) {
      logApiError('save template', err)
      showToast('error', getFriendlyErrorMessage(err, 'settingsSave', t))
    } finally {
      setSavingTemplate(false)
    }
  }

  const handlePreviewTemplate = async () => {
    setLoadingPreview(true)
    setPreviewData(null)
    try {
      const result = await previewTemplate(selectedTemplateName as EmailTemplateName)
      setPreviewData(result.preview)
    } catch (err) {
      logApiError('preview template', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setLoadingPreview(false)
    }
  }

  const insertPlaceholder = (placeholder: string) => {
    setTemplateBody((prev) => prev + `{${placeholder}}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t.pages.settings}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">{t.settings.description}</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'shop'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            {loc.tabTitleShop}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'email'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            {loc.tabTitleEmail}
          </button>
        </nav>
      </div>

      {activeTab === 'shop' && (
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
                  <select className="input h-11" {...register('country')}>
                    <option value="">{t.settings.countryPlaceholder}</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
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
      )}

      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* SMTP Card */}
            <SettingsCard title={loc.smtpSettings}>
              <p className="text-xs text-slate-500 mb-4">{loc.smtpDesc}</p>
              <form onSubmit={handleSaveSmtp} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FieldLabel label={loc.host} required />
                    <input
                      className="input h-11"
                      placeholder="e.g. smtp.ionos.de"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label={loc.port} required />
                    <input
                      type="number"
                      className="input h-11"
                      placeholder="e.g. 587"
                      value={smtpPort || ''}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel label={loc.encryption} required />
                  <select
                    className="input h-11"
                    value={smtpEncryption}
                    onChange={(e) => setSmtpEncryption(e.target.value as any)}
                  >
                    <option value="none">none</option>
                    <option value="SSL">SSL</option>
                    <option value="TLS">TLS</option>
                    <option value="STARTTLS">STARTTLS</option>
                  </select>
                </div>

                <div>
                  <FieldLabel label={loc.username} required />
                  <input
                    className="input h-11"
                    placeholder="Username or email address"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel label={loc.password} required={!smtpHasPassword} />
                  <input
                    type="password"
                    className="input h-11"
                    placeholder={smtpHasPassword ? loc.passwordPlaceholder : loc.passwordRequiredPlaceholder}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={smtpSaving}
                    className="btn btn-primary h-11 px-5 text-sm font-semibold disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {smtpSaving ? loc.saving : loc.saveSettings}
                  </button>
                </div>
              </form>

              {/* SMTP Test connection block */}
              <div className="mt-5 border-t border-slate-200 pt-5">
                <FieldLabel label={loc.testConnection} />
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input h-11 flex-1"
                    placeholder={loc.testConnectionPlaceholder}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={testingSmtp}
                    onClick={handleTestSmtp}
                    className="btn btn-outline h-11 px-5 text-sm font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
                  >
                    {testingSmtp ? loc.testing : loc.testConnection}
                  </button>
                </div>
              </div>
            </SettingsCard>

            {/* IMAP Card */}
            <SettingsCard title={loc.imapSettings}>
              <p className="text-xs text-slate-500 mb-4">{loc.imapDesc}</p>
              <form onSubmit={handleSaveImap} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FieldLabel label={loc.host} required />
                    <input
                      className="input h-11"
                      placeholder="e.g. imap.ionos.de"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label={loc.port} required />
                    <input
                      type="number"
                      className="input h-11"
                      placeholder="e.g. 993"
                      value={imapPort || ''}
                      onChange={(e) => setImapPort(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel label={loc.encryption} required />
                  <select
                    className="input h-11"
                    value={imapEncryption}
                    onChange={(e) => setImapEncryption(e.target.value as any)}
                  >
                    <option value="none">none</option>
                    <option value="SSL">SSL</option>
                    <option value="TLS">TLS</option>
                    <option value="STARTTLS">STARTTLS</option>
                  </select>
                </div>

                <div>
                  <FieldLabel label={loc.username} required />
                  <input
                    className="input h-11"
                    placeholder="Username or email address"
                    value={imapUsername}
                    onChange={(e) => setImapUsername(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel label={loc.password} required={!imapHasPassword} />
                  <input
                    type="password"
                    className="input h-11"
                    placeholder={imapHasPassword ? loc.passwordPlaceholder : loc.passwordRequiredPlaceholder}
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={imapSaving}
                  className="btn btn-primary h-11 px-5 text-sm font-semibold disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {imapSaving ? loc.saving : loc.saveSettings}
                </button>
              </form>
            </SettingsCard>
          </div>

          {/* Templates Editor Card */}
          <SettingsCard title={loc.templatesTitle}>
            <p className="text-xs text-slate-500 mb-4">{loc.templatesDesc}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Template selection & placeholders helper */}
              <div className="space-y-4">
                <div>
                  <FieldLabel label={loc.templateSelect} />
                  <select
                    className="input h-11"
                    value={selectedTemplateName}
                    onChange={(e) => setSelectedTemplateName(e.target.value)}
                  >
                    {Object.entries(templateDisplayNames[t.pages.settings === 'Einstellungen' ? 'de' : 'en']).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">{loc.placeholdersTitle}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['CUSTOMER_FIRST_NAME', 'CUSTOMER_LAST_NAME', 'ORDER_NUMBER', 'DEVICE', 'PRICE', 'DATE', 'LINK'].map((placeholder) => (
                      <button
                        key={placeholder}
                        type="button"
                        onClick={() => insertPlaceholder(placeholder)}
                        className="inline-flex items-center rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium px-2 py-1 transition cursor-pointer shadow-sm"
                        title={`Insert {${placeholder}}`}
                      >
                        {`{${placeholder}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle & Right Column: Subject & Body text area editor */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <FieldLabel label={loc.templateSubject} required />
                  <input
                    className="input h-11 font-medium text-slate-800"
                    placeholder="Enter email subject"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel label={loc.templateBody} required />
                  <textarea
                    rows={8}
                    className="input py-3 font-mono text-xs leading-relaxed text-slate-800"
                    placeholder="Enter email template body content..."
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={savingTemplate}
                    onClick={handleSaveTemplate}
                    className="btn btn-primary h-11 px-5 text-sm font-semibold disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingTemplate ? loc.saving : loc.saveSettings}
                  </button>

                  <button
                    type="button"
                    disabled={loadingPreview}
                    onClick={handlePreviewTemplate}
                    className="btn btn-outline h-11 px-5 text-sm font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loadingPreview ? loc.testing : loc.previewButton}
                  </button>
                </div>
              </div>
            </div>

            {/* Compiled Preview Section */}
            {previewData && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{loc.previewTitle}</h3>
                <p className="text-xs text-slate-500 mb-3">{loc.previewExplanation}</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Betreff / Subject</span>
                    <div className="font-semibold text-slate-800 text-sm mt-0.5">{previewData.subject}</div>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Inhalt / Body</span>
                    <div className="bg-white rounded-lg p-4 border border-slate-200/60 whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800 shadow-inner">
                      {previewData.body}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SettingsCard>
        </div>
      )}
    </div>
  )
}

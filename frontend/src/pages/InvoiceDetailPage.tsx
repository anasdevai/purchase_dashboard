import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Info,
  Mail,
  Plus,
  Save,
  ShoppingCart,
  Store,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  downloadInvoicePdf,
  emailInvoicePdf,
  fetchInvoice,
  fetchInvoicePrefillFromRepairOrder,
  fetchNextInvoiceNumber,
  generateInvoicePdf,
  openInvoicePdf,
  saveInvoice,
  copyInvoice,
  cancelInvoice,
  sendInvoiceReminder,
} from '../api/invoices'
import { fetchEmployees, type Employee } from '../api/repairOrders'
import { useAuth } from '../auth/AuthContext'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { FormActionFooter } from '../components/common/FormActionFooter'
import { useLanguage } from '../i18n/LanguageProvider'
import {
  defaultShopSettings,
  loadShopSettings,
  makeEmptyInvoiceItem,
  type ShopSettings,
} from '../services/shopSettings'
import { InvoicePaymentStatusBadge } from '../components/invoices/InvoicePaymentStatusBadge'
import { InvoicePaymentStatusSelect } from '../components/invoices/InvoicePaymentStatusSelect'
import type { Invoice, InvoiceItem, InvoicePayload, InvoicePaymentStatus } from '../types/invoice'
import { getFriendlyErrorMessage, logApiError, ApiError } from '../utils/apiErrors'
import { formatWholeMoney } from '../utils/formatMoney'
import {
  normalizeQuantityInput,
  normalizeWholeInput,
  parseWholeNumber,
} from '../utils/invoiceNumbers'
import { calculateInvoiceLine, calculateInvoiceTotals } from '../utils/invoiceCalculations'

const VAT_PRESETS = ['0', '10', '13', '20'] as const

type InvoiceForm = Omit<InvoicePayload, 'items'> & {
  invoiceNumber?: string
  items: Array<{
    description: string
    quantity: string
    unitPrice: string
    vatPercent: string
  }>
}

const today = () => new Date().toISOString().slice(0, 10)

// Flexible manual invoice numbers: uppercase letters, digits, hyphens and slashes
// (e.g. INV-0001, INV-003, RE-50141, RE-2026-001). Empty is allowed (auto-generated on save).
const INVOICE_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9/-]*$/

function createEmptyForm(shopSettings: ShopSettings): InvoiceForm {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  const defaultDue = d.toISOString().slice(0, 10)
  return {
    invoiceDate: today(),
    serviceDate: today(),
    dueDate: defaultDue,
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    deviceSummary: '',
    repairSummary: '',
    paymentStatus: 'Open',
    paymentMethod: undefined,
    paymentDate: '',
    paymentReference: '',
    cancellationReason: '',
    employeeId: '',
    notes: '',
    items: [makeEmptyInvoiceItem(shopSettings)],
  }
}

function calculate(items: InvoiceForm['items']) {
  const lineInputs = items.map((item) => ({
    quantity: Math.max(1, parseWholeNumber(item.quantity, 1)),
    unitPrice: parseWholeNumber(item.unitPrice, 0),
    vatPercent: parseWholeNumber(item.vatPercent, 0),
  }))
  return calculateInvoiceTotals(lineInputs)
}

function fromInvoice(invoice: Invoice): InvoiceForm {
  return {
    repairOrderId: invoice.repairOrderId ?? undefined,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.slice(0, 10),
    serviceDate: invoice.serviceDate ? invoice.serviceDate.slice(0, 10) : today(),
    dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : undefined,
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress ?? '',
    customerPhone: invoice.customerPhone ?? '',
    customerEmail: invoice.customerEmail ?? '',
    deviceSummary: invoice.deviceSummary ?? '',
    repairSummary: invoice.repairSummary ?? '',
    paymentMethod: invoice.paymentMethod ?? undefined,
    paymentStatus: invoice.paymentStatus ?? undefined,
    paymentDate: invoice.paymentDate ? invoice.paymentDate.slice(0, 10) : '',
    paymentReference: invoice.paymentReference ?? '',
    cancellationReason: invoice.cancellationReason ?? '',
    employeeId: invoice.employeeId ?? '',
    notes: invoice.notes ?? '',
    items: invoice.items.map((item: InvoiceItem) => ({
      description: item.description,
      quantity: String(Math.max(1, parseWholeNumber(item.quantity, 1))),
      unitPrice: String(parseWholeNumber(item.unitPrice, 0)),
      vatPercent: String(parseWholeNumber(item.vatPercent, 0)),
    })),
  }
}

function cleanForm(form: InvoiceForm): InvoicePayload {
  const { invoiceNumber, items, ...rest } = form

  return {
    ...rest,
    invoiceNumber: invoiceNumber?.trim() || undefined,
    paymentDate: form.paymentDate || null,
    paymentReference: form.paymentReference || null,
    cancellationReason: form.cancellationReason || null,
    employeeId: form.employeeId || null,
    items: items.map((item) => ({
      description: item.description,
      quantity: Math.max(1, parseWholeNumber(item.quantity, 1)),
      unitPrice: parseWholeNumber(item.unitPrice, 0),
      vatPercent: parseWholeNumber(item.vatPercent, 0),
    })),
  }
}

export function NewInvoicePage() {
  return <InvoiceDetailPage mode="new" />
}

export function InvoiceDetailPage(props: { mode?: 'new' }) {
  const { user } = useAuth()
  const { t, interpolate, language } = useLanguage()
  const { showToast, confirm, prompt } = useAppConfirm()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const invoiceId = props.mode === 'new' ? undefined : params.invoiceId
  const repairOrderIdFromQuery = searchParams.get('repairOrderId') ?? undefined
  const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultShopSettings())
  const [form, setForm] = useState<InvoiceForm>(() => createEmptyForm(defaultShopSettings()))
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [linkedRepairOrderNumber, setLinkedRepairOrderNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(invoiceId))
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    customerAddress?: string
    invoiceNumber?: string
    items?: string
  }>({})
  const [pdfNeedsRegeneration, setPdfNeedsRegeneration] = useState(false)
  const totals = useMemo(() => calculate(form.items), [form.items])

  const paymentMethods = useMemo(
    () =>
      (['Cash', 'BankTransfer', 'Card', 'PayPal', 'Other'] as const).map((value) => ({
        value,
        label: t.invoices.paymentMethods[value],
      })),
    [t],
  )

  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetchEmployees()
      .then((data) => setEmployees(data))
      .catch((err) => console.error('Failed to fetch employees:', err))
  }, [])

  const handleCancelInvoice = () => {
    if (!invoice) return
    prompt({title:language==='de'?'Rechnung stornieren':'Cancel invoice',message:language==='de'?'Bitte geben Sie einen Stornierungsgrund ein.':'Please enter a cancellation reason.',onSubmit:async reason=>{
    setSaving(true)
    setError(null)
    try {
      const updated = await cancelInvoice(invoice.id, reason || undefined)
      setInvoice(updated)
      setForm(fromInvoice(updated))
      showToast('success', language === 'de' ? 'Rechnung erfolgreich storniert.' : 'Invoice successfully cancelled.')
    } catch (err) {
      logApiError('invoice cancel', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setSaving(false)
    }
    }})
  }

  const handleCopyInvoice = async () => {
    if (!invoice) return
    setSaving(true)
    setError(null)
    try {
      const copied = await copyInvoice(invoice.id)
      showToast('success', language === 'de' ? 'Kopie der Rechnung erfolgreich erstellt.' : 'Copy of invoice successfully created.')
      navigate(`/invoices/${copied.id}`)
    } catch (err) {
      logApiError('invoice copy', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setSaving(false)
    }
  }

  const handleSendReminder = () => {
    if (!invoice) return
    confirm({
      title: language === 'de' ? 'Zahlungserinnerung senden' : 'Send Payment Reminder',
      message: language === 'de' 
        ? 'Möchten Sie eine Zahlungserinnerung für diese Rechnung an den Kunden senden?' 
        : 'Do you want to send a payment reminder for this invoice to the customer?',
      onConfirm: async () => {
        setSaving(true)
        try {
          await sendInvoiceReminder(invoice.id)
          showToast('success', language === 'de' ? 'Zahlungserinnerung gesendet.' : 'Payment reminder sent.')
          const updated = await fetchInvoice(invoice.id)
          setInvoice(updated)
          setForm(fromInvoice(updated))
        } catch (err) {
          logApiError('invoice reminder send', err)
          showToast('error', language === 'de' ? 'Senden der Zahlungserinnerung fehlgeschlagen.' : 'Failed to send payment reminder.')
        } finally {
          setSaving(false)
        }
      }
    })
  }

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    loadShopSettings(user.id).then((settings) => {
      if (alive) setShopSettings(settings)
    })
    return () => {
      alive = false
    }
  }, [user?.id])

  useEffect(() => {
    if (invoiceId || !user?.id) return

    let alive = true

    const initializeNewInvoice = async () => {
      // Load shop settings first so the default VAT (and any prefilled line items)
      // are built on top of the correct settings. Doing this sequentially avoids a
      // race where a late shop-settings load resets the prefilled form.
      const settings = await loadShopSettings(user.id)
      if (!alive) return

      try {
        if (repairOrderIdFromQuery) {
          const prefill = await fetchInvoicePrefillFromRepairOrder(repairOrderIdFromQuery)
          if (!alive) return

          const prefilledItems = prefill.draft.items.map((item) => ({
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            vatPercent: String(item.vatPercent),
          }))

          setForm({
            ...createEmptyForm(settings),
            repairOrderId: prefill.draft.repairOrderId,
            customerName: prefill.draft.customerName ?? '',
            customerAddress: prefill.draft.customerAddress ?? '',
            customerPhone: prefill.draft.customerPhone ?? '',
            customerEmail: prefill.draft.customerEmail ?? '',
            deviceSummary: prefill.draft.deviceSummary ?? '',
            repairSummary: prefill.draft.repairSummary ?? '',
            paymentStatus: prefill.draft.paymentStatus ?? 'Open',
            invoiceNumber: prefill.suggestedInvoiceNumber,
            items: prefilledItems.length ? prefilledItems : [makeEmptyInvoiceItem(settings)],
          })
          setLinkedRepairOrderNumber(prefill.repairOrderNumber ?? null)
          return
        }

        const nextNumber = await fetchNextInvoiceNumber()
        if (!alive) return
        setForm({ ...createEmptyForm(settings), invoiceNumber: nextNumber })
      } catch (err) {
        logApiError('invoice number suggestion', err)
        if (!alive) return

        // An invoice already exists for this repair order: jump straight to it.
        if (
          repairOrderIdFromQuery &&
          err instanceof ApiError &&
          err.status === 409 &&
          err.details &&
          typeof err.details === 'object' &&
          'invoiceId' in err.details &&
          typeof (err.details as { invoiceId?: unknown }).invoiceId === 'string'
        ) {
          navigate(`/invoices/${(err.details as { invoiceId: string }).invoiceId}`, { replace: true })
          return
        }

        // Keep a usable empty form even if number/prefill lookup failed.
        setForm(createEmptyForm(settings))
      }
    }

    void initializeNewInvoice()

    return () => {
      alive = false
    }
  }, [invoiceId, user?.id, repairOrderIdFromQuery, navigate])

  useEffect(() => {
    if (!invoiceId) return
    let alive = true
    setLoading(true)
    fetchInvoice(invoiceId)
      .then((data) => {
        if (!alive) return
        setInvoice(data)
        setForm(fromInvoice(data))
        setPdfNeedsRegeneration(false)
        setError(null)
      })
      .catch((err) => {
        logApiError('invoice detail load', err)
        if (alive) setError(getFriendlyErrorMessage(err, 'load', t))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [invoiceId, t.invoices.errors.loadDetailFailed])

  const markPdfOutdated = () => {
    if (invoice) setPdfNeedsRegeneration(true)
  }

  const setField = (name: keyof InvoiceForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
    markPdfOutdated()
  }

  const setItem = (index: number, name: keyof InvoiceForm['items'][number], value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }))
    markPdfOutdated()
  }

  const setQuantity = (index: number, value: string) => {
    setItem(index, 'quantity', normalizeQuantityInput(value))
  }

  const setWholeField = (index: number, name: 'unitPrice' | 'vatPercent', value: string) => {
    setItem(index, name, normalizeWholeInput(value))
  }

  const finalizeQuantity = (index: number) => {
    const current = form.items[index]?.quantity ?? ''
    setItem(index, 'quantity', current.trim() ? normalizeQuantityInput(current) : '1')
  }

  const finalizeWholeField = (index: number, name: 'unitPrice' | 'vatPercent') => {
    const current = form.items[index]?.[name] ?? ''
    setItem(index, name, current.trim() ? normalizeWholeInput(current) : '0')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors: {
      customerName?: string
      customerEmail?: string
      customerPhone?: string
      customerAddress?: string
      invoiceNumber?: string
      items?: string
    } = {}

    const invoiceNumber = form.invoiceNumber?.trim()
    if (invoiceNumber && !INVOICE_NUMBER_PATTERN.test(invoiceNumber)) {
      errors.invoiceNumber = t.invoices.validation.invoiceNumberInvalid
    }

    if (!form.customerName.trim()) {
      errors.customerName = t.invoices.validation.customerNameRequired
    }

    if (!form.customerEmail?.trim()) {
      errors.customerEmail = t.invoices.validation.customerEmailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
      errors.customerEmail = t.invoices.validation.emailInvalid
    }

    if (!form.customerPhone?.trim()) errors.customerPhone = t.invoices.validation.customerPhoneRequired
    if (!form.customerAddress?.trim()) errors.customerAddress = t.invoices.validation.customerAddressRequired

    if (!form.items.some((item) => item.description.trim())) {
      errors.items = t.invoices.validation.itemDescriptionRequired
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSaving(true)
    setError(null)
    try {
      const saved = await saveInvoice(cleanForm(form), invoiceId, language)
      setInvoice(saved)
      setForm(fromInvoice(saved))
      setPdfNeedsRegeneration(false)
      if (saved.pdfPath) {
        showToast('success', t.common.toasts.invoiceSaved)
      } else {
        showToast('success', t.common.toasts.invoiceSaved)
        showToast('error', t.invoices.errors.pdfFailed)
      }
      if (!invoiceId) navigate(`/invoices/${saved.id}`, { replace: true })
    } catch (err) {
      logApiError('invoice save', err)
      showToast(
        'error',
        getFriendlyErrorMessage(err, invoiceId ? 'invoiceSave' : 'invoiceCreate', t),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!invoice) return
    setSaving(true)
    setError(null)
    try {
      const updated = await generateInvoicePdf(invoice.id, language)
      setInvoice(updated)
      setPdfNeedsRegeneration(false)
      showToast('success', t.common.toasts.invoicePdfGenerated)
    } catch (err) {
      logApiError('invoice pdf generate', err)
      showToast('error', getFriendlyErrorMessage(err, 'pdf', t))
    } finally {
      setSaving(false)
    }
  }

  const resolveCustomerEmail = () =>
    form.customerEmail?.trim() ||
    invoice?.customerEmail?.trim() ||
    invoice?.customer?.email?.trim() ||
    ''

  const handleSendEmail = () => {
    const email = resolveCustomerEmail()
    if (!email) {
      showToast('error', t.invoices.detail.emailSendFailed)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('error', t.invoices.validation.emailInvalid)
      return
    }

    confirm({
      title: t.invoices.detail.sendEmailConfirmTitle,
      message: interpolate(t.invoices.detail.sendEmailConfirmMessage, {
        email,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          let current = invoice
          if (invoiceId) {
            const saved = await saveInvoice(cleanForm({ ...form, customerEmail: email }), invoiceId, language)
            current = saved
            setInvoice(saved)
            setForm(fromInvoice(saved))
            setPdfNeedsRegeneration(false)
          }
          if (!current?.id) {
            showToast('error', t.invoices.detail.emailSendFailed)
            return
          }
          await emailInvoicePdf(current.id, email)
          showToast('success', t.invoices.detail.emailSentSuccess)
        } catch (err) {
          logApiError('invoice email send', err)
          showToast('error', getFriendlyErrorMessage(err, 'generic', t))
        } finally {
          setSendingEmail(false)
        }
      },
    })
  }

  const addLineItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, makeEmptyInvoiceItem(shopSettings)],
    }))
    markPdfOutdated()
  }

  if (loading) {
    return <div className="text-sm font-semibold text-slate-600">{t.invoices.detail.loading}</div>
  }

  const pageTitle = invoice
    ? interpolate(t.invoices.detail.titleExisting, { invoiceNumber: invoice.invoiceNumber })
    : t.invoices.detail.titleNew

  const breadcrumbCurrent = invoice
    ? interpolate(t.invoices.detail.breadcrumbExisting, { invoiceNumber: invoice.invoiceNumber })
    : t.invoices.detail.breadcrumbNew

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.invoices.detail.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/invoices" className="font-medium text-slate-600 hover:text-primary">
              {t.invoices.detail.breadcrumbInvoices}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-800">{breadcrumbCurrent}</span>
            {form.paymentStatus ? (
              <InvoicePaymentStatusBadge
                status={form.paymentStatus as InvoicePaymentStatus}
                testId="invoice-payment-status-badge"
              />
            ) : null}
          </div>
          {invoice?.repairOrder ? (
            <div className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{t.invoices.detail.sourceRepairOrder}: </span>
              <Link
                to={`/repair-orders/${invoice.repairOrder.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {interpolate(t.invoices.detail.viewRepairOrder, {
                  repairOrderNumber: invoice.repairOrder.repairOrderNumber,
                })}
              </Link>
            </div>
          ) : !invoice && linkedRepairOrderNumber && form.repairOrderId ? (
            <div className="mt-2 text-sm text-slate-600" data-testid="invoice-source-repair-order">
              <span className="font-medium">{t.invoices.detail.sourceRepairOrder}: </span>
              <Link
                to={`/repair-orders/${form.repairOrderId}`}
                className="font-semibold text-primary hover:underline"
              >
                {interpolate(t.invoices.detail.viewRepairOrder, {
                  repairOrderNumber: linkedRepairOrderNumber,
                })}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice ? (
            <>
              <button
                type="button"
                className="btn btn-secondary h-11 px-5"
                onClick={handleCopyInvoice}
                disabled={saving}
              >
                {language === 'de' ? 'Kopieren' : 'Copy'}
              </button>
              {invoice.paymentStatus !== 'Cancelled' ? (
                <button
                  type="button"
                  className="btn btn-secondary h-11 px-5 text-red-600 hover:bg-red-50"
                  onClick={handleCancelInvoice}
                  disabled={saving}
                >
                  {language === 'de' ? 'Stornieren' : 'Cancel'}
                </button>
              ) : null}
              {['Sent', 'Open', 'Overdue'].includes(form.paymentStatus || '') ? (
                <button
                  type="button"
                  className="btn btn-secondary h-11 px-5"
                  onClick={handleSendReminder}
                  disabled={saving}
                >
                  {language === 'de' ? 'Mahnung senden' : 'Send Reminder'}
                </button>
              ) : null}
            </>
          ) : null}
          <Link to="/invoices" className="btn btn-secondary h-11 px-5">
            {t.invoices.detail.cancel}
          </Link>
          <button
            type="submit"
            form="invoice-form"
            data-testid="invoice-save-top"
            className="btn btn-primary h-11 px-5"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? t.invoices.detail.saving : t.invoices.detail.saveInvoice}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-blue-100">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {t.invoices.detail.shopDetailsBannerTitle}
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{t.invoices.detail.shopDetailsBannerText}</p>
          </div>
        </div>
        <Link to="/settings" className="btn btn-secondary h-10 shrink-0 bg-white px-4">
          <ExternalLink className="h-4 w-4" />
          {t.invoices.detail.viewShopDetails}
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      {pdfNeedsRegeneration ? (
        <div
          data-testid="invoice-pdf-outdated"
          className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100"
        >
          {t.invoices.detail.pdfOutdated}
        </div>
      ) : null}

      <form id="invoice-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <InvoiceCard title={t.invoices.detail.customerInfo}>
            <Field
              testId="invoice-customer-name"
              label={t.invoices.detail.customerName}
              placeholder={t.invoices.detail.customerNamePlaceholder}
              required
              value={form.customerName}
              error={fieldErrors.customerName}
              onChange={(value) => {
                setField('customerName', value)
                if (fieldErrors.customerName) setFieldErrors({})
              }}
            />
            <Field
              testId="invoice-customer-email"
              label={t.invoices.detail.customerEmail}
              type="email"
              placeholder={t.invoices.detail.customerEmailPlaceholder}
              required
              value={form.customerEmail ?? ''}
              error={fieldErrors.customerEmail}
              onChange={(value) => {
                setField('customerEmail', value)
                if (fieldErrors.customerEmail) {
                  setFieldErrors((current) => ({ ...current, customerEmail: undefined }))
                }
              }}
            />
            <Field
              testId="invoice-customer-phone"
              label={t.invoices.detail.customerPhone}
              placeholder={t.invoices.detail.customerPhonePlaceholder}
              required
              value={form.customerPhone ?? ''}
              error={fieldErrors.customerPhone}
              onChange={(value) => {
                setField('customerPhone', value)
                if (fieldErrors.customerPhone) setFieldErrors((current) => ({ ...current, customerPhone: undefined }))
              }}
            />
            <Field
              label={t.invoices.detail.customerAddress}
              placeholder={t.invoices.detail.customerAddressPlaceholder}
              required
              value={form.customerAddress ?? ''}
              error={fieldErrors.customerAddress}
              onChange={(value) => {
                setField('customerAddress', value)
                if (fieldErrors.customerAddress) setFieldErrors((current) => ({ ...current, customerAddress: undefined }))
              }}
              multiline
            />
          </InvoiceCard>

          <InvoiceCard title={t.invoices.detail.invoiceInfo}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                testId="invoice-number"
                label={t.invoices.detail.invoiceNumber}
                value={form.invoiceNumber ?? ''}
                placeholder={t.invoices.detail.invoiceNumberAutoGenerated}
                error={fieldErrors.invoiceNumber}
                onChange={(value) => {
                  setField('invoiceNumber', value)
                  if (fieldErrors.invoiceNumber) {
                    setFieldErrors((current) => ({ ...current, invoiceNumber: undefined }))
                  }
                }}
              />
              <Field
                label={t.invoices.detail.invoiceDate}
                type="date"
                value={form.invoiceDate ?? today()}
                onChange={(value) => setField('invoiceDate', value)}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{t.invoices.detail.invoiceNumberHint}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <Field
                label={t.invoices.detail.serviceDate}
                type="date"
                value={form.serviceDate ?? today()}
                onChange={(value) => setField('serviceDate', value)}
              />
              <Field
                label={t.invoices.detail.dueDate}
                type="date"
                value={form.dueDate ?? ''}
                onChange={(value) => setField('dueDate', value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <label>
                <span className="label">{t.invoices.detail.paymentMethod}</span>
                <select
                  className="input h-11"
                  value={form.paymentMethod ?? ''}
                  onChange={(event) => setField('paymentMethod', event.target.value)}
                >
                  <option value="">{t.invoices.detail.selectPaymentMethod}</option>
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{t.invoices.detail.paymentStatus}</span>
                <InvoicePaymentStatusSelect
                  className="w-full"
                  size="md"
                  allowEmpty
                  emptyLabel={t.invoices.detail.selectStatus}
                  value={form.paymentStatus ?? ''}
                  onChange={(value) => setField('paymentStatus', value)}
                />
              </label>
            </div>
            <label className="block mt-4">
              <span className="label">{t.invoices.detail.employee}</span>
              <select
                className="input h-11"
                value={form.employeeId ?? ''}
                onChange={(event) => setField('employeeId', event.target.value)}
              >
                <option value="">{t.invoices.detail.selectEmployee}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
            {['Paid', 'PartiallyPaid'].includes(form.paymentStatus || '') ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <Field
                  label={t.invoices.detail.paymentDate}
                  type="date"
                  value={form.paymentDate ?? ''}
                  onChange={(value) => setField('paymentDate', value)}
                />
                <Field
                  label={t.invoices.detail.paymentReference}
                  value={form.paymentReference ?? ''}
                  onChange={(value) => setField('paymentReference', value)}
                />
              </div>
            ) : null}
            {form.paymentStatus === 'Cancelled' && form.cancellationReason ? (
              <div className="mt-4">
                <Field
                  label={t.invoices.detail.cancellationReason}
                  value={form.cancellationReason ?? ''}
                  readOnly
                  onChange={() => undefined}
                />
              </div>
            ) : null}
            <Field
              label={t.invoices.detail.deviceSummary}
              value={form.deviceSummary ?? ''}
              onChange={(value) => setField('deviceSummary', value)}
            />
            <Field
              label={t.invoices.detail.repairSummary}
              value={form.repairSummary ?? ''}
              onChange={(value) => setField('repairSummary', value)}
            />
          </InvoiceCard>
        </div>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">{t.invoices.detail.lineItems}</h2>
            </div>
            <button
              type="button"
              data-testid="invoice-add-line"
              className="btn btn-primary h-10"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4" />
              {t.invoices.detail.addLineShort}
            </button>
          </div>
          <div className="flex items-start gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-slate-700">{t.invoices.detail.pricesIncludeVatNote}</p>
          </div>
          <div className="px-5 py-5">
            <div className="table-scroll rounded-xl border border-slate-200">
              <table className="w-full min-w-[880px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-12 px-4 py-3">{t.invoices.detail.rowNumber}</th>
                    <th className="px-4 py-3">{t.invoices.detail.descriptionCol}</th>
                    <th className="w-24 px-4 py-3">{t.invoices.detail.quantity}</th>
                    <th className="w-32 px-4 py-3">{t.invoices.detail.unitPrice}</th>
                    <th className="w-32 px-4 py-3">{t.invoices.detail.vatPercent}</th>
                    <th className="w-32 px-4 py-3 text-right">{t.invoices.detail.total}</th>
                    <th className="w-14 px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => {
                    const quantity = Math.max(1, parseWholeNumber(item.quantity, 1))
                    const unitPrice = parseWholeNumber(item.unitPrice, 0)
                    const vatPercent = parseWholeNumber(item.vatPercent, 0)
                    const { lineGross } = calculateInvoiceLine({ quantity, unitPrice, vatPercent })
                    return (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-sm font-medium text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10"
                            data-testid={`invoice-line-${index}-description`}
                            value={item.description}
                            onChange={(event) => setItem(index, 'description', event.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10"
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            data-testid={`invoice-line-${index}-quantity`}
                            value={item.quantity}
                            onChange={(event) => setQuantity(index, event.target.value)}
                            onBlur={() => finalizeQuantity(index)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10"
                            type="number"
                            step={1}
                            data-testid={`invoice-line-${index}-unit-price`}
                            value={item.unitPrice}
                            onChange={(event) => setWholeField(index, 'unitPrice', event.target.value)}
                            onBlur={() => finalizeWholeField(index, 'unitPrice')}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <VatPercentField
                            testId={`invoice-line-${index}-vat`}
                            value={item.vatPercent}
                            otherLabel={t.invoices.detail.vatOtherOption}
                            customPlaceholder={t.invoices.detail.vatCustomPlaceholder}
                            onChange={(value) => setItem(index, 'vatPercent', value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {formatWholeMoney(lineGross)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="btn h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                items:
                                  current.items.filter((_, itemIndex) => itemIndex !== index) ||
                                  [makeEmptyInvoiceItem(shopSettings)],
                              }))
                            }
                            disabled={form.items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-primary hover:bg-primary-light/20 hover:text-primary"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4" />
              {t.invoices.detail.addAnotherLine}
            </button>
            {fieldErrors.items ? (
              <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.items}</p>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <InvoiceCard title={t.invoices.detail.notes} className="lg:col-span-2">
            <textarea
              data-testid="invoice-notes"
              className="min-h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              placeholder={t.invoices.detail.notesPlaceholder}
              value={form.notes ?? ''}
              onChange={(event) => setField('notes', event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">{t.invoices.detail.notesHelper}</p>
          </InvoiceCard>

          <InvoiceCard title={t.invoices.detail.totals}>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <TotalRow testId="invoice-total-net" label={t.invoices.detail.netAmount} value={formatWholeMoney(totals.net)} />
              <TotalRow testId="invoice-total-vat" label={t.invoices.detail.vatAmount} value={formatWholeMoney(totals.vat)} />
              <TotalRow
                testId="invoice-total-gross"
                label={t.invoices.detail.grossTotal}
                value={formatWholeMoney(totals.gross)}
                strong
              />
            </div>
          </InvoiceCard>
        </div>

        <FormActionFooter
          testId="invoice-form-footer"
          tall
          note={
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{t.invoices.detail.pdfFooterNote}</span>
            </div>
          }
        >
          <button
            type="submit"
            data-testid="invoice-save"
            className="btn btn-primary h-11 px-5"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? t.invoices.detail.saving : t.invoices.detail.saveInvoice}
          </button>
          {invoice ? (
            <button
              type="button"
              data-testid="invoice-generate-pdf"
              className="btn btn-primary h-11 px-5"
              onClick={handleGeneratePdf}
              disabled={saving}
            >
              <FileText className="h-4 w-4" />
              {t.invoices.detail.generatePdf}
            </button>
          ) : null}
          {invoice ? (
            <>
              <button
                type="button"
                data-testid="invoice-open-pdf"
                className="btn btn-primary h-11 px-5"
                disabled={saving || downloadingPdf}
                onClick={async () => {
                  setDownloadingPdf(true)
                  try {
                    await openInvoicePdf(invoice.id, language)
                  } catch (err) {
                    logApiError('invoice pdf open', err)
                    showToast('error', getFriendlyErrorMessage(err, 'pdf', t))
                  } finally {
                    setDownloadingPdf(false)
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
                {t.invoices.detail.openPdf}
              </button>
              <button
                type="button"
                data-testid="invoice-download-pdf"
                className="btn btn-primary h-11 px-5"
                disabled={saving || downloadingPdf}
                onClick={async () => {
                  setDownloadingPdf(true)
                  try {
                    await downloadInvoicePdf(invoice.id, `${invoice.invoiceNumber}.pdf`, language)
                    showToast('success', t.common.toasts.pdfDownloaded)
                  } catch (err) {
                    logApiError('invoice pdf download', err)
                    showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
                  } finally {
                    setDownloadingPdf(false)
                  }
                }}
              >
                <Download className="h-4 w-4" />
                {t.invoices.detail.downloadPdf}
              </button>
            </>
          ) : null}
          {resolveCustomerEmail() ? (
            <button
              type="button"
              data-testid="invoice-send-email"
              className="btn btn-secondary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSendEmail}
              disabled={saving || sendingEmail}
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? t.common.pleaseWait : t.invoices.detail.sendEmailBtn}
            </button>
          ) : null}
        </FormActionFooter>
      </form>
    </div>
  )
}

function InvoiceCard(props: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${props.className ?? ''}`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{props.title}</h2>
      </div>
      <div className="space-y-4 px-5 py-5">{props.children}</div>
    </section>
  )
}

function VatPercentField(props: {
  testId?: string
  value: string
  otherLabel: string
  customPlaceholder: string
  onChange: (value: string) => void
}) {
  const normalized = props.value.trim()
  const preset = (VAT_PRESETS as readonly string[]).includes(normalized) ? normalized : 'Other'

  return (
    <div>
      <select
        className="input h-10"
        data-testid={props.testId}
        value={preset}
        onChange={(event) => {
          const nextPreset = event.target.value
          if (nextPreset === 'Other' && preset !== 'Other') {
            props.onChange('')
          } else if (nextPreset !== 'Other') {
            props.onChange(nextPreset)
          }
        }}
      >
        {VAT_PRESETS.map((option) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
        <option value="Other">{props.otherLabel}</option>
      </select>
      {preset === 'Other' ? (
        <input
          className="input mt-2"
          type="number"
          step={1}
          min={0}
          max={100}
          inputMode="numeric"
          data-testid={props.testId ? `${props.testId}-custom` : undefined}
          placeholder={props.customPlaceholder}
          value={props.value}
          onChange={(event) => props.onChange(normalizeWholeInput(event.target.value))}
          onBlur={() => {
            const normalized = props.value.trim() ? normalizeWholeInput(props.value) : '0'
            props.onChange(normalized)
          }}
        />
      ) : null}
    </div>
  )
}

function Field(props: {
  testId?: string
  label: string
  value: string
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  multiline?: boolean
  readOnly?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="label">
        {props.label}
        {props.required ? <span className="text-red-500"> *</span> : null}
      </span>
      {props.multiline ? (
        <textarea
          className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          data-testid={props.testId}
          placeholder={props.placeholder}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
      ) : (
        <input
          className={`input h-11${props.readOnly ? ' cursor-default bg-slate-50 text-slate-600' : ''}`}
          data-testid={props.testId}
          type={props.type ?? 'text'}
          step={props.type === 'number' ? '0.01' : undefined}
          placeholder={props.placeholder}
          value={props.value}
          readOnly={props.readOnly}
          onChange={(event) => props.onChange(event.target.value)}
        />
      )}
      {props.error ? (
        <p className="mt-1 text-xs font-medium text-red-600" data-testid={props.testId ? `${props.testId}-error` : undefined}>
          {props.error}
        </p>
      ) : null}
    </label>
  )
}

function TotalRow(props: { testId?: string; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{props.label}</span>
      <span
        data-testid={props.testId}
        className={props.strong ? 'font-bold text-slate-950' : 'font-semibold text-slate-900'}
      >
        {props.value}
      </span>
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ChevronRight, Copy, Download, FileText, Info, Mail, Plus, Save, ShoppingCart, Trash2, Check, X, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchQuotation,
  saveQuotation,
  updateQuotationStatus,
  generateQuotationPdf,
  downloadQuotationPdf,
  emailQuotationPdf,
  copyQuotation,
  convertToRepairOrder,
} from '../api/quotations'
import { fetchEmployees, type Employee } from '../api/repairOrders'
import { loadShopSettings, type ShopSettings, defaultShopSettings } from '../services/shopSettings'
import { CustomerSearchInput } from '../components/repairOrders/CustomerSearchInput'
import { PresetSelectField } from '../components/common/PresetSelectField'
import { FormActionFooter } from '../components/common/FormActionFooter'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import { formatWholeMoney } from '../utils/formatMoney'
import { normalizeQuantityInput, normalizeWholeInput, parseWholeNumber } from '../utils/invoiceNumbers'
import type { Quotation, QuotationPayload, QuotationStatus } from '../types/quotation'

const DEVICE_TYPE_PRESETS = [
  'iPhone',
  'Samsung phone',
  'iPad',
  'Android tablet',
  'MacBook',
  'Windows laptop',
  'PlayStation',
  'Xbox',
  'Nintendo Switch',
  'Other',
] as const

const BRAND_PRESETS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Huawei',
  'Lenovo',
  'HP',
  'Dell',
  'Sony',
  'Microsoft',
  'Nintendo',
  'Other',
] as const

const MODEL_PRESETS = [
  'iPhone 11',
  'iPhone 12',
  'iPhone 13',
  'iPhone 14',
  'iPhone 15',
  'Samsung Galaxy S21',
  'Samsung Galaxy S22',
  'Samsung Galaxy S23',
  'Samsung Galaxy S24',
  'iPad Pro',
  'iPad Air',
  'MacBook Air',
  'MacBook Pro',
  'PlayStation 5',
  'Xbox Series X',
  'Nintendo Switch',
  'Other',
] as const

type QuotationForm = Omit<QuotationPayload, 'items'> & {
  quotationNumber?: string
  items: Array<{
    id?: string
    repairType: string
    description: string
    unitPrice: string
    quantity: string
    discount: string
  }>
}

const getTwoWeeksFromToday = () => {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

const makeEmptyQuotationItem = () => ({
  repairType: '',
  description: '',
  unitPrice: '0',
  quantity: '1',
  discount: '0',
})

const createEmptyForm = (): QuotationForm => ({
  validUntilDate: getTwoWeeksFromToday(),
  status: 'Draft',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  deviceType: '',
  brand: '',
  model: '',
  imeiOrSerial: '',
  notes: '',
  items: [makeEmptyQuotationItem()],
})

function fromQuotation(quotation: Quotation): QuotationForm {
  return {
    quotationNumber: quotation.quotationNumber,
    validUntilDate: quotation.validUntilDate.slice(0, 10),
    status: quotation.status,
    employeeId: quotation.employeeId ?? undefined,
    customerId: quotation.customerId ?? undefined,
    customerName: quotation.customerName,
    customerPhone: quotation.customerPhone,
    customerEmail: quotation.customerEmail ?? '',
    customerAddress: quotation.customerAddress ?? '',
    deviceType: quotation.deviceType,
    brand: quotation.brand ?? '',
    model: quotation.model,
    imeiOrSerial: quotation.imeiOrSerial ?? '',
    notes: quotation.notes ?? '',
    items: quotation.items.map((item) => ({
      id: item.id,
      repairType: item.repairType,
      description: item.description,
      unitPrice: String(parseWholeNumber(item.unitPrice, 0)),
      quantity: String(parseWholeNumber(item.quantity, 1)),
      discount: item.discount ? String(parseWholeNumber(item.discount, 0)) : '0',
    })),
  }
}

function cleanForm(form: QuotationForm): QuotationPayload {
  const { quotationNumber: _qNum, items, ...rest } = form
  return {
    ...rest,
    items: items.map((item) => ({
      id: item.id,
      repairType: item.repairType,
      description: item.description,
      unitPrice: parseWholeNumber(item.unitPrice, 0),
      quantity: parseWholeNumber(item.quantity, 1),
      discount: parseWholeNumber(item.discount, 0),
    })),
  }
}

export function NewQuotationPage() {
  return <QuotationDetailPage mode="new" />
}

export function QuotationDetailPage(props: { mode?: 'new' }) {
  const { t, interpolate } = useLanguage()
  const { confirm, showToast } = useAppConfirm()
  const params = useParams()
  const navigate = useNavigate()
  const quotationId = props.mode === 'new' ? undefined : params.quotationId

  const [form, setForm] = useState<QuotationForm>(createEmptyForm)
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(Boolean(quotationId))
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultShopSettings())
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuotationForm, string>>>({})

  // Load shop settings & employee list
  useEffect(() => {
    fetchEmployees()
      .then((data) => setEmployees(data))
      .catch((err) => console.error('Failed to fetch employees:', err))

    loadShopSettings('')
      .then((data) => setShopSettings(data))
      .catch((err) => console.error('Failed to load shop settings:', err))
  }, [])

  // Fetch Quotation Detail
  useEffect(() => {
    if (!quotationId) {
      setForm(createEmptyForm())
      setQuotation(null)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    fetchQuotation(quotationId)
      .then((data) => {
        if (!alive) return
        setQuotation(data)
        setForm(fromQuotation(data))
      })
      .catch((err) => {
        logApiError('quotation load', err)
        if (alive) setError(getFriendlyErrorMessage(err, 'load', t))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [quotationId, t])

  // Subtotals Calculation
  const totals = useMemo(() => {
    let grossTotal = 0
    form.items.forEach((item) => {
      const price = parseWholeNumber(item.unitPrice, 0)
      const qty = parseWholeNumber(item.quantity, 1)
      const discount = parseWholeNumber(item.discount, 0)
      grossTotal += Math.round(price * qty * (1 - discount / 100))
    })

    const vatPercent = shopSettings?.defaultVatRate ? Number(shopSettings.defaultVatRate) : 20
    const netAmount = Math.round(grossTotal / (1 + vatPercent / 100))
    const vatAmount = grossTotal - netAmount

    return {
      net: netAmount,
      vat: vatAmount,
      gross: grossTotal,
      vatPercent,
    }
  }, [form.items, shopSettings])

  const setField = (name: keyof QuotationForm, value: any) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const setItem = (index: number, name: string, value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }))
  }

  const addLineItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, makeEmptyQuotationItem()],
    }))
  }

  const handleStatusChange = async (nextStatus: QuotationStatus) => {
    if (!quotation) return
    setSaving(true)
    try {
      const updated = await updateQuotationStatus(quotation.id, nextStatus)
      setQuotation(updated)
      setForm(fromQuotation(updated))
      showToast('success', t.quotations.detail.statusChangedSuccess)
    } catch (err) {
      logApiError('quotation status update', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!quotation) return
    setSaving(true)
    try {
      const updated = await generateQuotationPdf(quotation.id)
      setQuotation(updated)
      showToast('success', t.common.toasts.pdfDownloaded)
    } catch (err) {
      logApiError('quotation pdf generate', err)
      showToast('error', getFriendlyErrorMessage(err, 'pdf', t))
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!quotation) return
    try {
      await downloadQuotationPdf(quotation.id, `${quotation.quotationNumber}.pdf`)
      showToast('success', t.common.toasts.pdfDownloaded)
    } catch (err) {
      logApiError('quotation pdf download', err)
      showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
    }
  }

  const resolveCustomerEmail = () =>
    form.customerEmail?.trim() ||
    quotation?.customerEmail?.trim() ||
    quotation?.customer?.email?.trim() ||
    ''

  const handleSendEmail = () => {
    const email = resolveCustomerEmail()
    if (!quotation || !email) {
      showToast('error', t.quotations.detail.emailSendFailed)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('error', t.invoices.validation.emailInvalid)
      return
    }

    confirm({
      title: t.quotations.detail.sendEmailConfirmTitle,
      message: interpolate(t.quotations.detail.sendEmailConfirmMessage, {
        email,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          const saved = await saveQuotation(cleanForm({ ...form, customerEmail: email }), quotation.id)
          setQuotation(saved)
          setForm(fromQuotation(saved))
          await emailQuotationPdf(saved.id, email)
          showToast('success', t.quotations.detail.emailSentSuccess)
        } catch (err) {
          logApiError('quotation email send', err)
          showToast('error', t.quotations.detail.emailSendFailed)
        } finally {
          setSendingEmail(false)
        }
      },
    })
  }

  const handleClone = async () => {
    if (!quotation) return
    setSaving(true)
    try {
      const cloned = await copyQuotation(quotation.id)
      showToast('success', t.quotations.detail.copySuccess)
      navigate(`/quotations/${cloned.id}`)
    } catch (err) {
      logApiError('quotation clone', err)
      showToast('error', t.quotations.detail.copyFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleConvert = () => {
    if (!quotation) return

    confirm({
      title: t.quotations.detail.convertConfirmTitle,
      message: t.quotations.detail.convertConfirmMessage,
      onConfirm: async () => {
        setSaving(true)
        try {
          const repairOrder = await convertToRepairOrder(quotation.id)
          showToast('success', t.quotations.detail.convertSuccess)
          navigate(`/repair-orders/${repairOrder.id}`)
        } catch (err) {
          logApiError('quotation convert', err)
          showToast('error', t.quotations.detail.convertFailed)
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const errors: Partial<Record<keyof QuotationForm, string>> = {}

    if (!form.customerName.trim()) errors.customerName = t.repairOrders.validation.customerNameRequired
    if (!form.customerPhone.trim()) errors.customerPhone = t.repairOrders.validation.customerPhoneRequired
    if (!form.deviceType.trim()) errors.deviceType = t.repairOrders.validation.deviceTypeRequired
    if (!form.model.trim()) errors.model = t.repairOrders.validation.modelRequired
    if (!form.validUntilDate.trim()) errors.validUntilDate = t.repairOrders.validation.dateInvalid

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSaving(true)

    try {
      const saved = await saveQuotation(cleanForm(form), quotationId)
      setQuotation(saved)
      setForm(fromQuotation(saved))
      showToast('success', t.common.toasts.repairOrderSaved) // generic save toast
      if (!quotationId) {
        navigate(`/quotations/${saved.id}`, { replace: true })
      }
    } catch (err) {
      logApiError('quotation save', err)
      showToast('error', getFriendlyErrorMessage(err, 'repairOrderSave', t))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm font-semibold text-slate-600">{t.quotations.detail.loading}</div>
  }

  const pageTitle = quotation
    ? interpolate(t.quotations.detail.titleExisting, { quotationNumber: quotation.quotationNumber })
    : t.quotations.detail.titleNew

  const isConverted = Boolean(quotation?.repairOrders && quotation.repairOrders.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.quotations.detail.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/quotations" className="font-medium text-slate-600 hover:text-primary">
              {t.quotations.title}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-800">
              {quotation ? quotation.quotationNumber : t.quotations.detail.titleNew}
            </span>
          </div>
          {isConverted && quotation?.repairOrders?.[0] ? (
            <div className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{t.invoices.detail.sourceRepairOrder}: </span>
              <Link
                to={`/repair-orders/${quotation.repairOrders[0].id}`}
                className="font-semibold text-primary hover:underline"
              >
                {quotation.repairOrders[0].repairOrderNumber}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/quotations" className="btn btn-secondary h-11 px-5">
            {t.invoices.detail.cancel}
          </Link>
          <button
            type="submit"
            form="quotation-form"
            data-testid="quotation-save-top"
            className="btn btn-primary h-11 px-5"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? t.quotations.detail.saving : t.quotations.detail.saveQuotation}
          </button>
        </div>
      </div>

      {quotation && (
        <div className="card" data-testid="quotation-actions-card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.quotations.detail.actionsTitle}</div>
          </div>
          <div className="card-body flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" />
              {t.quotations.detail.downloadPdf}
            </button>
            {!quotation.pdfPath ? (
              <button type="button" className="btn btn-secondary" onClick={handleGeneratePdf} disabled={saving}>
                <RefreshCw className="h-4 w-4" />
                {t.invoices.detail.generatePdf}
              </button>
            ) : null}

            {resolveCustomerEmail() && (
              <button
                type="button"
                data-testid="quotation-send-email"
                className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSendEmail}
                disabled={sendingEmail || saving}
              >
                <Mail className="h-4 w-4" />
                {sendingEmail ? t.common.pleaseWait : t.quotations.detail.sendEmailBtn}
              </button>
            )}

            <button type="button" className="btn btn-secondary" onClick={handleClone} disabled={saving}>
              <Copy className="h-4 w-4" />
              {t.quotations.detail.copyBtn}
            </button>

            {quotation.status !== 'Accepted' && !isConverted && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleStatusChange('Accepted')}
                  disabled={saving}
                >
                  <Check className="h-4 w-4" />
                  {t.quotations.detail.acceptBtn}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary text-rose-600 hover:bg-rose-50"
                  onClick={() => handleStatusChange('Rejected')}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  {t.quotations.detail.rejectBtn}
                </button>
              </>
            )}

            {!isConverted && (
              <button type="button" className="btn btn-primary" onClick={handleConvert} disabled={saving}>
                <FileText className="h-4 w-4" />
                {t.quotations.detail.convertBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      <form id="quotation-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <QuotationCard title={t.quotations.detail.customerInfo}>
            <CustomerSearchInput
              label={t.quotations.detail.customerName}
              value={form.customerName}
              error={fieldErrors.customerName}
              onChange={(name, phone, email, address, customerId) => {
                setForm((current) => ({
                  ...current,
                  customerName: name,
                  customerPhone: phone || current.customerPhone,
                  customerEmail: email || current.customerEmail,
                  customerAddress: address || current.customerAddress,
                  customerId: customerId || undefined,
                }))
                setFieldErrors((current) => {
                  const next = { ...current }
                  delete next.customerName
                  return next
                })
              }}
            />
            <Field
              testId="quotation-customer-phone"
              label={t.quotations.detail.customerPhone}
              value={form.customerPhone}
              error={fieldErrors.customerPhone}
              onChange={(value) => setField('customerPhone', value)}
            />
            <Field
              testId="quotation-customer-email"
              label={t.quotations.detail.customerEmail}
              type="email"
              value={form.customerEmail ?? ''}
              onChange={(value) => setField('customerEmail', value)}
            />
            <Field
              label={t.quotations.detail.customerAddress}
              value={form.customerAddress ?? ''}
              onChange={(value) => setField('customerAddress', value)}
              multiline
            />
          </QuotationCard>

          <QuotationCard title={t.quotations.detail.deviceInfo}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PresetSelectField
                testId="quotation-device-type"
                label={t.quotations.detail.deviceType}
                value={form.deviceType}
                presets={DEVICE_TYPE_PRESETS}
                presetLabels={t.contractWizard.options}
                otherLabel={t.repairOrders.detail.otherOption}
                customPlaceholder={t.repairOrders.detail.deviceTypeCustomPlaceholder}
                error={fieldErrors.deviceType}
                onChange={(value) => setField('deviceType', value)}
              />
              <PresetSelectField
                testId="quotation-brand"
                label={t.quotations.detail.brand}
                value={form.brand ?? ''}
                presets={BRAND_PRESETS}
                otherLabel={t.repairOrders.detail.otherOption}
                customPlaceholder={t.repairOrders.detail.brandCustomPlaceholder}
                onChange={(value) => setField('brand', value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PresetSelectField
                testId="quotation-model"
                label={t.quotations.detail.model}
                value={form.model}
                presets={MODEL_PRESETS}
                otherLabel={t.repairOrders.detail.otherOption}
                customPlaceholder={t.repairOrders.detail.modelCustomPlaceholder}
                error={fieldErrors.model}
                onChange={(value) => setField('model', value)}
              />

              <Field
                label={t.quotations.detail.imeiOrSerial}
                value={form.imeiOrSerial ?? ''}
                onChange={(value) => setField('imeiOrSerial', value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t.quotations.detail.validUntilDate}
                type="date"
                value={form.validUntilDate}
                error={fieldErrors.validUntilDate}
                onChange={(value) => setField('validUntilDate', value)}
              />
              <label>
                <span className="label">{t.quotations.detail.employee}</span>
                <select
                  className="input h-11"
                  value={form.employeeId ?? ''}
                  onChange={(e) => setField('employeeId', e.target.value || null)}
                >
                  <option value="">{t.quotations.detail.selectEmployee}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </QuotationCard>
        </div>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">{t.quotations.detail.quotationItems}</h2>
            </div>
            <button type="button" className="btn btn-primary h-10" onClick={addLineItem}>
              <Plus className="h-4 w-4" />
              {t.quotations.detail.addItem}
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
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="w-48 px-4 py-3">{t.quotations.detail.repairType}</th>
                    <th className="px-4 py-3">{t.quotations.detail.descriptionCol}</th>
                    <th className="w-32 px-4 py-3">{t.quotations.detail.unitPrice}</th>
                    <th className="w-24 px-4 py-3 text-center">{t.quotations.detail.quantity}</th>
                    <th className="w-24 px-4 py-3 text-center">{t.quotations.detail.discount}</th>
                    <th className="w-32 px-4 py-3 text-right">{t.quotations.detail.total}</th>
                    <th className="w-14 px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => {
                    const price = parseWholeNumber(item.unitPrice, 0)
                    const qty = parseWholeNumber(item.quantity, 1)
                    const discount = parseWholeNumber(item.discount, 0)
                    const lineGross = Math.round(price * qty * (1 - discount / 100))

                    return (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-sm font-medium text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10"
                            placeholder="Display, Battery, logic board..."
                            value={item.repairType}
                            onChange={(e) => setItem(index, 'repairType', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10"
                            placeholder="Detailed service description..."
                            value={item.description}
                            onChange={(e) => setItem(index, 'description', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10 text-right"
                            type="number"
                            step={1}
                            value={item.unitPrice}
                            onChange={(e) => setItem(index, 'unitPrice', normalizeWholeInput(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10 text-center"
                            type="number"
                            step={1}
                            min={1}
                            value={item.quantity}
                            onChange={(e) => setItem(index, 'quantity', normalizeQuantityInput(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input h-10 text-center"
                            type="number"
                            step={1}
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={(e) => setItem(index, 'discount', normalizeWholeInput(e.target.value))}
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
                                  [makeEmptyQuotationItem()],
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
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <QuotationCard title={t.quotations.detail.notes} className="lg:col-span-2">
            <textarea
              className="min-h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              placeholder={t.quotations.detail.notesPlaceholder}
              value={form.notes ?? ''}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </QuotationCard>

          <QuotationCard title={t.invoices.detail.totals}>
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <TotalRow label={t.quotations.detail.netAmount} value={formatWholeMoney(totals.net)} />
              <TotalRow label={`${t.quotations.detail.vatAmount} (${totals.vatPercent}%)`} value={formatWholeMoney(totals.vat)} />
              <TotalRow label={t.quotations.detail.grossTotal} value={formatWholeMoney(totals.gross)} strong />
            </div>
          </QuotationCard>
        </div>

        <FormActionFooter
          testId="quotation-form-footer"
          note={
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{t.invoices.detail.pdfFooterNote}</span>
            </div>
          }
        >
          <button
            type="submit"
            data-testid="quotation-save"
            className="btn btn-primary h-11 px-5"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? t.quotations.detail.saving : t.quotations.detail.saveQuotation}
          </button>
        </FormActionFooter>
      </form>
    </div>
  )
}

function QuotationCard(props: { title: string; children: any; className?: string }) {
  return (
    <section className={`card overflow-hidden ${props.className ?? ''}`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{props.title}</h2>
      </div>
      <div className="space-y-4 px-5 py-5">{props.children}</div>
    </section>
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

function TotalRow(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{props.label}</span>
      <span className={props.strong ? 'font-bold text-slate-950 text-base' : 'font-semibold text-slate-900'}>
        {props.value}
      </span>
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Download, Eye, FileText, Mail, Pencil, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  downloadRepairOrderPdf,
  fetchRepairOrder,
  generateRepairOrderPdf,
  saveRepairOrder,
  emailRepairOrderPdf,
} from '../api/repairOrders'
import { createInvoiceFromRepairOrder } from '../api/invoices'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TranslationSchema } from '../i18n/types'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { RepairOrder, RepairOrderPayload } from '../types/repairOrder'

const repairStatusValues = [
  'Received',
  'InProgress',
  'WaitingForParts',
  'ReadyForPickup',
  'Completed',
  'Cancelled',
] as const

const accessoryOptionKeys = [
  'charger',
  'powerSupply',
  'controller',
  'cable',
  'carryingCase',
  'other',
] as const

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

type AccessoryKey = (typeof accessoryOptionKeys)[number]
type FieldErrorKey = keyof RepairOrderPayload | 'accessoriesOther'
type FieldErrors = Partial<Record<FieldErrorKey, string>>

const emptyForm: RepairOrderPayload = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  deviceType: '',
  brand: '',
  model: '',
  imeiOrSerial: '',
  passwordPin: '',
  accessoriesReceived: '',
  problemDescription: '',
  visibleDamage: '',
  technicianNotes: '',
  status: 'Received',
}

function labelToAccessoryKey(
  label: string,
  accessories: TranslationSchema['repairOrders']['accessories'],
): AccessoryKey | null {
  for (const key of accessoryOptionKeys) {
    if (accessories[key] === label) return key
  }
  return null
}

function parseAccessories(
  value: string,
  accessories: TranslationSchema['repairOrders']['accessories'],
): { selected: Set<AccessoryKey>; otherText: string } {
  const selected = new Set<AccessoryKey>()
  let otherText = ''

  if (!value.trim()) {
    return { selected, otherText }
  }

  for (const part of value.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (part.startsWith('other:')) {
      selected.add('other')
      otherText = part.slice(6).trim()
      continue
    }

    if (part === 'other') {
      selected.add('other')
      continue
    }

    if ((accessoryOptionKeys as readonly string[]).includes(part)) {
      selected.add(part as AccessoryKey)
      continue
    }

    const matchedKey = labelToAccessoryKey(part, accessories)
    if (matchedKey) {
      selected.add(matchedKey)
      continue
    }

    selected.add('other')
    otherText = part
  }

  return { selected, otherText }
}

function serializeAccessories(selected: Set<AccessoryKey>, otherText: string) {
  const parts: string[] = []

  for (const key of accessoryOptionKeys) {
    if (key === 'other') continue
    if (selected.has(key)) parts.push(key)
  }

  if (selected.has('other')) {
    const trimmed = otherText.trim()
    parts.push(trimmed ? `other:${trimmed}` : 'other')
  }

  return parts.join(',')
}

function formatDateInputValue(value: RepairOrder['expectedCompletionDate']) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  return ''
}

function fromRepairOrder(order: RepairOrder): RepairOrderPayload {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? '',
    customerAddress: order.customerAddress ?? '',
    deviceType: order.deviceType,
    brand: order.brand ?? '',
    model: order.model,
    imeiOrSerial: order.imeiOrSerial ?? '',
    passwordPin: order.passwordPin ?? '',
    accessoriesReceived: order.accessoriesReceived ?? '',
    problemDescription: order.problemDescription,
    visibleDamage: order.visibleDamage ?? '',
    technicianNotes: order.technicianNotes ?? '',
    estimatedPrice:
      order.estimatedPrice === null || order.estimatedPrice === undefined
        ? undefined
        : Number(order.estimatedPrice),
    depositAmount:
      order.depositAmount === null || order.depositAmount === undefined
        ? undefined
        : Number(order.depositAmount),
    expectedCompletionDate: formatDateInputValue(order.expectedCompletionDate),
    status: order.status,
  }
}

function applyRepairOrderToForm(
  order: RepairOrder,
  accessories: TranslationSchema['repairOrders']['accessories'],
) {
  return {
    form: fromRepairOrder(order),
    accessoriesState: parseAccessories(order.accessoriesReceived ?? '', accessories),
  }
}

function parseOptionalMoney(
  raw: string | number | undefined,
  invalidMessage: string,
): { value?: number; error?: string } {
  if (raw === '' || raw === undefined || raw === null) {
    return { value: undefined }
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: invalidMessage }
  }

  return { value: parsed }
}

function validateForm(
  form: RepairOrderPayload,
  selectedAccessories: Set<AccessoryKey>,
  accessoryOtherText: string,
  t: TranslationSchema,
): { errors: FieldErrors; payload?: RepairOrderPayload } {
  const v = t.repairOrders.validation
  const errors: FieldErrors = {}

  if (!form.customerName.trim()) errors.customerName = v.customerNameRequired
  if (!form.customerPhone.trim()) errors.customerPhone = v.customerPhoneRequired

  if (form.customerEmail?.trim()) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())
    if (!emailValid) errors.customerEmail = v.emailInvalid
  }

  if (!form.deviceType.trim()) errors.deviceType = v.deviceTypeRequired
  if (!form.brand?.trim()) errors.brand = v.brandRequired
  if (!form.model.trim()) errors.model = v.modelRequired
  if (!form.problemDescription.trim()) errors.problemDescription = v.problemDescriptionRequired
  if (!form.visibleDamage?.trim()) errors.visibleDamage = v.visibleDamageRequired

  if (selectedAccessories.has('other') && !accessoryOtherText.trim()) {
    errors.accessoriesOther = v.otherAccessoryRequired
  }

  const estimated = parseOptionalMoney(form.estimatedPrice, v.priceInvalid)
  if (estimated.error) errors.estimatedPrice = estimated.error

  const deposit = parseOptionalMoney(form.depositAmount, v.depositInvalid)
  if (deposit.error) errors.depositAmount = deposit.error

  let expectedCompletionDate = form.expectedCompletionDate?.trim() || undefined
  if (expectedCompletionDate) {
    const parsedDate = new Date(`${expectedCompletionDate}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      errors.expectedCompletionDate = v.dateInvalid
      expectedCompletionDate = undefined
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    errors,
    payload: {
      ...form,
      customerEmail: form.customerEmail?.trim() || undefined,
      customerAddress: form.customerAddress?.trim() || undefined,
      brand: form.brand?.trim(),
      imeiOrSerial: form.imeiOrSerial?.trim() || undefined,
      passwordPin: form.passwordPin?.trim() || undefined,
      accessoriesReceived: serializeAccessories(selectedAccessories, accessoryOtherText) || undefined,
      visibleDamage: form.visibleDamage?.trim(),
      technicianNotes: form.technicianNotes?.trim() || undefined,
      estimatedPrice: estimated.value,
      depositAmount: deposit.value,
      expectedCompletionDate,
    },
  }
}

export function NewRepairOrderPage() {
  return <RepairOrderDetailPage mode="new" />
}

export function RepairOrderDetailPage(props: { mode?: 'new' }) {
  const { t, interpolate } = useLanguage()
  const { confirm, showToast } = useAppConfirm()
  const params = useParams()
  const navigate = useNavigate()
  const repairOrderId = props.mode === 'new' ? undefined : params.repairOrderId
  const [form, setForm] = useState<RepairOrderPayload>(emptyForm)
  const [repairOrder, setRepairOrder] = useState<RepairOrder | null>(null)
  const [selectedAccessories, setSelectedAccessories] = useState<Set<AccessoryKey>>(new Set())
  const [accessoryOtherText, setAccessoryOtherText] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(Boolean(repairOrderId))
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  const isExistingOrder = Boolean(repairOrderId)

  const repairStatuses = useMemo(
    () =>
      repairStatusValues.map((value) => ({
        value,
        label: t.repairOrders.statuses[value],
      })),
    [t],
  )

  const accessoryOptions = useMemo(
    () =>
      accessoryOptionKeys.map((key) => ({
        key,
        label: t.repairOrders.accessories[key],
      })),
    [t],
  )

  useEffect(() => {
    if (!repairOrderId) {
      setLoading(false)
      setRepairOrder(null)
      setForm(emptyForm)
      setSelectedAccessories(new Set())
      setAccessoryOtherText('')
      setShowActions(false)
      setError(null)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    void fetchRepairOrder(repairOrderId)
      .then((data) => {
        if (!alive) return
        const next = applyRepairOrderToForm(data, t.repairOrders.accessories)
        setRepairOrder(data)
        setForm(next.form)
        setSelectedAccessories(next.accessoriesState.selected)
        setAccessoryOtherText(next.accessoriesState.otherText)
        setShowActions(true)
      })
      .catch((err) => {
        if (!alive) return
        logApiError('repair order detail load', err)
        setRepairOrder(null)
        setError(getFriendlyErrorMessage(err, 'load', t))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [repairOrderId, t])

  const setField = (name: keyof RepairOrderPayload, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const toggleAccessory = (key: AccessoryKey) => {
    setSelectedAccessories((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    if (key === 'other') {
      setFieldErrors((current) => {
        if (!current.accessoriesOther) return current
        const next = { ...current }
        delete next.accessoriesOther
        return next
      })
    }
  }

  const handleGeneratePdf = async (order = repairOrder) => {
    if (!order) return null
    setSaving(true)
    try {
      const updated = await generateRepairOrderPdf(order.id)
      setRepairOrder(updated)
      showToast('success', t.common.toasts.repairOrderPdfGenerated)
      return updated
    } catch (err) {
      logApiError('repair order pdf generate', err)
      showToast('error', getFriendlyErrorMessage(err, 'pdf', t))
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!repairOrder || saving) return
    try {
      let current = repairOrder
      if (!current.pdfPath) {
        const updated = await handleGeneratePdf(current)
        if (!updated?.pdfPath) return
        current = updated
      }
      await downloadRepairOrderPdf(current.id, `${current.repairOrderNumber}.pdf`)
      showToast('success', t.common.toasts.pdfDownloaded)
    } catch (err) {
      logApiError('repair order pdf download', err)
      showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
    }
  }

  const handleSendEmail = () => {
    if (!repairOrder || !repairOrder.customerEmail) return

    confirm({
      title: t.repairOrders.detail.sendEmailConfirmTitle,
      message: interpolate(t.repairOrders.detail.sendEmailConfirmMessage, {
        email: repairOrder.customerEmail,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          await emailRepairOrderPdf(repairOrder.id)
          showToast('success', t.repairOrders.detail.emailSentSuccess)
        } catch (err) {
          logApiError('repair order email send', err)
          showToast('error', t.repairOrders.detail.emailSendFailed)
        } finally {
          setSendingEmail(false)
        }
      },
    })
  }

  const linkedInvoice = repairOrder?.invoices?.[0] ?? null

  const handleCreateInvoice = async () => {
    if (!repairOrder) return

    if (linkedInvoice) {
      confirm({
        title: t.repairOrders.detail.invoiceExistsTitle,
        message: interpolate(t.repairOrders.detail.invoiceExistsMessage, {
          repairOrderNumber: repairOrder.repairOrderNumber,
          invoiceNumber: linkedInvoice.invoiceNumber,
        }),
        confirmLabel: t.repairOrders.detail.openExistingInvoice,
        cancelLabel: t.common.cancel,
        onConfirm: () => navigate(`/invoices/${linkedInvoice.id}`),
      })
      return
    }

    setSaving(true)
    setError(null)
    try {
      const invoice = await createInvoiceFromRepairOrder(repairOrder.id)
      navigate(`/invoices/${invoice.id}`)
    } catch (err) {
      logApiError('repair order invoice create', err)
      showToast('error', getFriendlyErrorMessage(err, 'invoiceCreate', t))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const validation = validateForm(form, selectedAccessories, accessoryOtherText, t)
    if (Object.keys(validation.errors).length > 0) {
      setFieldErrors(validation.errors)
      return
    }

    setFieldErrors({})
    setSaving(true)

    try {
      const saved = await saveRepairOrder(validation.payload!, repairOrderId)
      const next = applyRepairOrderToForm(saved, t.repairOrders.accessories)
      setRepairOrder(saved)
      setForm(next.form)
      setSelectedAccessories(next.accessoriesState.selected)
      setAccessoryOtherText(next.accessoriesState.otherText)
      setShowActions(true)
      showToast('success', t.common.toasts.repairOrderSaved)

      if (!repairOrderId) {
        navigate(`/repair-orders/${saved.id}`, { replace: true })
      }

      await handleGeneratePdf(saved)
    } catch (err) {
      logApiError('repair order save', err)
      showToast('error', getFriendlyErrorMessage(err, 'repairOrderSave', t))
    } finally {
      setSaving(false)
    }
  }

  if (isExistingOrder && loading) {
    return <div className="text-sm font-semibold text-slate-600">{t.repairOrders.detail.loading}</div>
  }

  if (isExistingOrder && error && !repairOrder) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
        <Link to="/repair-orders" className="btn btn-secondary w-full sm:w-auto">
          {t.repairOrders.detail.backToList}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            {repairOrder
              ? interpolate(t.repairOrders.detail.titleExisting, {
                  repairOrderNumber: repairOrder.repairOrderNumber,
                })
              : t.repairOrders.detail.titleNew}
          </div>
          <div className="mt-1 text-sm text-slate-600">{t.repairOrders.detail.description}</div>
          {repairOrder ? (
            <div className="mt-2 text-sm font-medium text-slate-700">
              {t.repairOrders.detail.repairOrderNumber}:{' '}
              <span className="font-semibold text-slate-900">{repairOrder.repairOrderNumber}</span>
            </div>
          ) : null}
        </div>
        <Link to="/repair-orders" className="btn btn-secondary w-full sm:w-auto">
          {t.repairOrders.detail.backToList}
        </Link>
      </div>

      {showActions && repairOrder ? (
        <div className="card" data-testid="repair-order-actions">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.repairOrders.detail.actionsTitle}</div>
          </div>
          <div className="card-body space-y-3">
            {linkedInvoice ? (
              <div className="text-sm text-slate-600" data-testid="repair-order-linked-invoice">
                <span className="font-medium">{t.repairOrders.detail.linkedInvoice}: </span>
                <Link
                  to={`/invoices/${linkedInvoice.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {interpolate(t.repairOrders.detail.viewInvoice, {
                    invoiceNumber: linkedInvoice.invoiceNumber,
                  })}
                </Link>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link to={`/repair-orders/${repairOrder.id}`} className="btn btn-secondary">
                <Eye className="h-4 w-4" />
                {t.repairOrders.detail.viewRepairOrder}
              </Link>
              <a href="#repair-order-form" className="btn btn-secondary">
                <Pencil className="h-4 w-4" />
                {t.repairOrders.detail.editRepairOrder}
              </a>
              <button
                type="button"
                data-testid="repair-order-action-download-pdf"
                className="btn btn-secondary"
                onClick={handleDownloadPdf}
                disabled={saving}
              >
                <Download className="h-4 w-4" />
                {t.repairOrders.detail.downloadPdf}
              </button>
              {repairOrder.customerEmail ? (
                <button
                  type="button"
                  data-testid="repair-order-action-send-email"
                  className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSendEmail}
                  disabled={sendingEmail || saving}
                >
                  <Mail className="h-4 w-4" />
                  {t.repairOrders.detail.sendEmailBtn}
                </button>
              ) : null}
              {linkedInvoice ? (
                <Link
                  to={`/invoices/${linkedInvoice.id}`}
                  data-testid="repair-order-action-open-invoice"
                  className="btn btn-primary"
                >
                  <FileText className="h-4 w-4" />
                  {interpolate(t.repairOrders.detail.viewInvoice, {
                    invoiceNumber: linkedInvoice.invoiceNumber,
                  })}
                </Link>
              ) : (
                <button
                  type="button"
                  data-testid="repair-order-action-create-invoice"
                  className="btn btn-primary"
                  onClick={handleCreateInvoice}
                  disabled={saving}
                >
                  <FileText className="h-4 w-4" />
                  {t.repairOrders.detail.createInvoice}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <form id="repair-order-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.repairOrders.detail.customerInfo}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <Field
              testId="ro-customer-name"
              label={t.repairOrders.detail.customerName}
              value={form.customerName}
              error={fieldErrors.customerName}
              onChange={(value) => setField('customerName', value)}
            />
            <Field
              testId="ro-customer-phone"
              label={t.repairOrders.detail.customerPhone}
              value={form.customerPhone}
              error={fieldErrors.customerPhone}
              onChange={(value) => setField('customerPhone', value)}
            />
            <Field
              testId="ro-customer-email"
              label={t.repairOrders.detail.customerEmail}
              type="email"
              value={form.customerEmail ?? ''}
              error={fieldErrors.customerEmail}
              onChange={(value) => setField('customerEmail', value)}
            />
            <Field
              testId="ro-customer-address"
              label={t.repairOrders.detail.customerAddress}
              value={form.customerAddress ?? ''}
              onChange={(value) => setField('customerAddress', value)}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.repairOrders.detail.deviceInfo}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <PresetSelectField
              testId="ro-device-type"
              label={t.repairOrders.detail.deviceType}
              value={form.deviceType}
              presets={DEVICE_TYPE_PRESETS}
              presetLabels={t.contractWizard.options}
              otherLabel={t.repairOrders.detail.otherOption}
              customPlaceholder={t.repairOrders.detail.deviceTypeCustomPlaceholder}
              error={fieldErrors.deviceType}
              onChange={(value) => setField('deviceType', value)}
            />
            <PresetSelectField
              testId="ro-brand"
              label={t.repairOrders.detail.brand}
              value={form.brand ?? ''}
              presets={BRAND_PRESETS}
              otherLabel={t.repairOrders.detail.otherOption}
              customPlaceholder={t.repairOrders.detail.brandCustomPlaceholder}
              error={fieldErrors.brand}
              onChange={(value) => setField('brand', value)}
            />
            <PresetSelectField
              testId="ro-model"
              label={t.repairOrders.detail.model}
              value={form.model}
              presets={MODEL_PRESETS}
              otherLabel={t.repairOrders.detail.otherOption}
              customPlaceholder={t.repairOrders.detail.modelCustomPlaceholder}
              error={fieldErrors.model}
              onChange={(value) => setField('model', value)}
            />
            <Field
              label={t.repairOrders.detail.imeiOrSerial}
              value={form.imeiOrSerial ?? ''}
              onChange={(value) => setField('imeiOrSerial', value)}
            />
            <Field
              label={t.repairOrders.detail.passwordPin}
              value={form.passwordPin ?? ''}
              onChange={(value) => setField('passwordPin', value)}
            />
            <div className="md:col-span-2">
              <span className="label">{t.repairOrders.detail.accessoriesReceived}</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {accessoryOptions.map((option) => (
                  <label key={option.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      data-testid={`ro-accessory-${option.key}`}
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                      checked={selectedAccessories.has(option.key)}
                      onChange={() => toggleAccessory(option.key)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {selectedAccessories.has('other') ? (
                <div className="mt-3">
                  <Field
                    testId="ro-accessory-other-text"
                    label={t.repairOrders.detail.accessoriesManual}
                    value={accessoryOtherText}
                    error={fieldErrors.accessoriesOther}
                    onChange={(value) => {
                      setAccessoryOtherText(value)
                      setFieldErrors((current) => {
                        if (!current.accessoriesOther) return current
                        const next = { ...current }
                        delete next.accessoriesOther
                        return next
                      })
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.repairOrders.detail.repairDetails}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <TextArea
              testId="ro-problem"
              label={t.repairOrders.detail.problemDescription}
              value={form.problemDescription}
              error={fieldErrors.problemDescription}
              onChange={(value) => setField('problemDescription', value)}
            />
            <TextArea
              testId="ro-visible-damage"
              label={t.repairOrders.detail.visibleDamage}
              value={form.visibleDamage ?? ''}
              error={fieldErrors.visibleDamage}
              onChange={(value) => setField('visibleDamage', value)}
            />
            <TextArea
              label={t.repairOrders.detail.technicianNotes}
              value={form.technicianNotes ?? ''}
              onChange={(value) => setField('technicianNotes', value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                testId="ro-estimated-price"
                label={t.repairOrders.detail.estimatedPrice}
                type="number"
                min="0"
                step="0.01"
                value={String(form.estimatedPrice ?? '')}
                error={fieldErrors.estimatedPrice}
                onChange={(value) => setField('estimatedPrice', value)}
              />
              <Field
                label={t.repairOrders.detail.depositAmount}
                type="number"
                min="0"
                step="0.01"
                value={String(form.depositAmount ?? '')}
                error={fieldErrors.depositAmount}
                onChange={(value) => setField('depositAmount', value)}
              />
              <Field
                label={t.repairOrders.detail.expectedCompletionDate}
                type="date"
                value={form.expectedCompletionDate ?? ''}
                error={fieldErrors.expectedCompletionDate}
                onChange={(value) => setField('expectedCompletionDate', value)}
              />
              <label>
                <span className="label">{t.repairOrders.detail.status}</span>
                <select
                  className="input"
                  value={form.status ?? 'Received'}
                  onChange={(event) => setField('status', event.target.value)}
                >
                  {repairStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" data-testid="repair-order-save" className="btn btn-primary w-full sm:w-auto" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t.repairOrders.detail.saving : t.repairOrders.detail.saveRepairOrder}
          </button>
        </div>
      </form>
    </div>
  )
}

function PresetSelectField(props: {
  testId?: string
  label: string
  value: string
  presets: readonly string[]
  presetLabels?: Partial<Record<string, string>>
  otherLabel: string
  customPlaceholder: string
  error?: string
  onChange: (value: string) => void
}) {
  const preset = (props.presets as readonly string[]).includes(props.value) ? props.value : 'Other'

  return (
    <div>
      <label className="label">{props.label}</label>
      <select
        className="input"
        data-testid={props.testId}
        value={preset}
        onChange={(event) => {
          const nextPreset = event.target.value
          const isCustomCurrently = preset === 'Other'

          if (nextPreset === 'Other' && !isCustomCurrently) {
            props.onChange('')
          } else if (nextPreset !== 'Other') {
            props.onChange(nextPreset)
          }
        }}
      >
        {(props.presets as readonly string[]).filter((option) => option !== 'Other').map((option) => (
          <option key={option} value={option}>
            {props.presetLabels?.[option] ?? option}
          </option>
        ))}
        <option value="Other">{props.otherLabel}</option>
      </select>
      {preset === 'Other' ? (
        <input
          className="input mt-2"
          data-testid={props.testId ? `${props.testId}-custom` : undefined}
          placeholder={props.customPlaceholder}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
      ) : null}
      {props.error ? (
        <p className="mt-1 text-xs font-medium text-red-600" data-testid={props.testId ? `${props.testId}-error` : undefined}>
          {props.error}
        </p>
      ) : null}
    </div>
  )
}

function Field(props: {
  testId?: string
  label: string
  value: string
  type?: string
  min?: string
  step?: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="label">{props.label}</span>
      <input
        className="input"
        data-testid={props.testId}
        type={props.type ?? 'text'}
        min={props.min}
        step={props.step ?? (props.type === 'number' ? '0.01' : undefined)}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      {props.error ? (
        <p className="mt-1 text-xs font-medium text-red-600" data-testid={props.testId ? `${props.testId}-error` : undefined}>
          {props.error}
        </p>
      ) : null}
    </label>
  )
}

function TextArea(props: {
  testId?: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="label">{props.label}</span>
      <textarea
        data-testid={props.testId}
        className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      {props.error ? (
        <p className="mt-1 text-xs font-medium text-red-600" data-testid={props.testId ? `${props.testId}-error` : undefined}>
          {props.error}
        </p>
      ) : null}
    </label>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Download, Eye, FileText, Mail, Pencil, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  downloadRepairOrderPdf,
  emailRepairOrderPdf,
  fetchRepairOrder,
  generateRepairOrderPdf,
  saveRepairOrder,
  updateRepairOrderStatus,
  addRepairOrderComment,
  fetchEmployees,
  type Employee,
} from '../api/repairOrders'
import { fetchRepairCompanies } from '../api/repairCompanies'
import { RepairCompanyFields } from '../components/repairOrders/RepairCompanyFields'
import { RepairOrderOcrScan } from '../components/repairOrders/RepairOrderOcrScan'
import { RepairOrderStatusSelect } from '../components/repairOrders/RepairOrderStatusSelect'
import { PresetSelectField } from '../components/common/PresetSelectField'
import { FormActionFooter } from '../components/common/FormActionFooter'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TranslationSchema } from '../i18n/types'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import { mergeOcrIntoRepairOrderForm } from '../utils/repairOrderOcr'
import type { RepairOrderOcrResult } from '../api/ocr'
import type { RepairCompany } from '../types/repairCompany'
import type { RepairOrder, RepairOrderPayload, RepairOrderStatus } from '../types/repairOrder'
import { RepairOrderHistory } from '../components/repairOrders/RepairOrderHistory'
import { CustomerSearchInput } from '../components/repairOrders/CustomerSearchInput'

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
  issueCategory: undefined,
  diagnosis: '',
  requiredSpareParts: '',
  sparePartStatus: undefined,
  visibleDamage: '',
  technicianNotes: '',
  status: 'Open',
  discountPercent: undefined,
  depositAmount: undefined,
  paymentMethod: undefined,
  assignedEmployeeId: undefined,
  customerId: undefined,
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
    issueCategory: order.issueCategory ?? undefined,
    diagnosis: order.diagnosis ?? '',
    requiredSpareParts: order.requiredSpareParts ?? '',
    sparePartStatus: order.sparePartStatus ?? undefined,
    visibleDamage: order.visibleDamage ?? '',
    technicianNotes: order.technicianNotes ?? '',
    estimatedPrice:
      order.estimatedPrice === null || order.estimatedPrice === undefined
        ? undefined
        : Number(order.estimatedPrice),
    discountPercent:
      order.discountPercent === null || order.discountPercent === undefined
        ? undefined
        : Number(order.discountPercent),
    depositAmount:
      order.depositAmount === null || order.depositAmount === undefined
        ? undefined
        : Number(order.depositAmount),
    paymentMethod: order.paymentMethod ?? undefined,
    expectedCompletionDate: formatDateInputValue(order.expectedCompletionDate),
    status: order.status,
    repairCompanyId: order.repairCompanyId ?? undefined,
    repairCompanyNotes: order.repairCompanyNotes ?? '',
    assignedEmployeeId: order.assignedEmployeeId ?? undefined,
    customerId: order.customerId ?? undefined,
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

  const discount = parseOptionalMoney(form.discountPercent, v.discountInvalid)
  if (discount.error) errors.discountPercent = discount.error
  else if (discount.value !== undefined && (discount.value < 0 || discount.value > 100)) {
    errors.discountPercent = v.discountInvalid
  }

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
      issueCategory: form.issueCategory || undefined,
      diagnosis: form.diagnosis?.trim() || undefined,
      requiredSpareParts: form.requiredSpareParts?.trim() || undefined,
      sparePartStatus: form.sparePartStatus || undefined,
      visibleDamage: form.visibleDamage?.trim(),
      technicianNotes: form.technicianNotes?.trim() || undefined,
      estimatedPrice: estimated.value,
      discountPercent: discount.value,
      depositAmount: deposit.value,
      paymentMethod: form.paymentMethod || undefined,
      expectedCompletionDate,
      repairCompanyId: form.repairCompanyId?.trim() || undefined,
      repairCompanyNotes: form.repairCompanyNotes?.trim() || undefined,
      assignedEmployeeId: form.assignedEmployeeId || undefined,
      customerId: form.customerId || undefined,
    },
  }
}

export function NewRepairOrderPage() {
  return <RepairOrderDetailPage mode="new" />
}

export function RepairOrderDetailPage(props: { mode?: 'new' }) {
  const { t, interpolate } = useLanguage()
  const { confirm, showToast, prompt } = useAppConfirm()
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
  const [repairCompanies, setRepairCompanies] = useState<RepairCompany[]>([])
  const [repairCompaniesLoading, setRepairCompaniesLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const isExistingOrder = Boolean(repairOrderId)

  const accessoryOptions = useMemo(
    () =>
      accessoryOptionKeys.map((key) => ({
        key,
        label: t.repairOrders.accessories[key],
      })),
    [t],
  )

  useEffect(() => {
    let alive = true
    setRepairCompaniesLoading(true)
    fetchRepairCompanies()
      .then((data) => {
        if (alive) setRepairCompanies(data)
      })
      .catch((err) => {
        logApiError('repair companies load', err)
      })
      .finally(() => {
        if (alive) setRepairCompaniesLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!repairOrderId) {
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
    // Load only when the repair order id changes — not when UI language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairOrderId])

  useEffect(() => {
    fetchEmployees()
      .then((data) => setEmployees(data))
      .catch((err) => console.error('Failed to fetch employees:', err))
  }, [])

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

  const handleStatusChange = (nextStatus: RepairOrderStatus) => {
    if (!repairOrder) return
    prompt({title:t.repairOrders.detail.historyPromptCommentTitle,message:t.repairOrders.detail.historyPromptCommentMessage.replace('{status}',t.repairOrders.statuses[nextStatus]),onSubmit:async commentInput=>{
    setSaving(true)
    try {
      const updated = await updateRepairOrderStatus(repairOrder.id, nextStatus, commentInput.trim() || undefined)
      setRepairOrder(updated)
      setForm((current) => ({ ...current, status: updated.status }))
      showToast('success', t.common.toasts.repairOrderSaved)
      await handleGeneratePdf(updated)
    } catch (err) {
      logApiError('repair order status update', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setSaving(false)
    }
    }})
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

  const resolveCustomerEmail = () =>
    form.customerEmail?.trim() ||
    repairOrder?.customerEmail?.trim() ||
    repairOrder?.customer?.email?.trim() ||
    ''

  const handleSendEmail = () => {
    const email = resolveCustomerEmail()
    if (!email) {
      showToast('error', t.repairOrders.detail.emailSendFailed)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('error', t.repairOrders.validation.emailInvalid)
      return
    }

    confirm({
      title: t.repairOrders.detail.sendEmailConfirmTitle,
      message: interpolate(t.repairOrders.detail.sendEmailConfirmMessage, {
        email,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          const validation = validateForm(
            { ...form, customerEmail: email },
            selectedAccessories,
            accessoryOtherText,
            t,
          )
          if (Object.keys(validation.errors).length > 0) {
            setFieldErrors(validation.errors)
            showToast('error', t.repairOrders.detail.emailSendFailed)
            return
          }

          let current = repairOrder
          if (repairOrderId && validation.payload) {
            const saved = await saveRepairOrder(validation.payload, repairOrderId)
            const next = applyRepairOrderToForm(saved, t.repairOrders.accessories)
            current = saved
            setRepairOrder(saved)
            setForm(next.form)
            setSelectedAccessories(next.accessoriesState.selected)
            setAccessoryOtherText(next.accessoriesState.otherText)
          }

          if (!current?.id) {
            showToast('error', t.repairOrders.detail.emailSendFailed)
            return
          }

          if (!current.pdfPath) {
            const updated = await handleGeneratePdf(current)
            if (!updated?.pdfPath) {
              showToast('error', t.repairOrders.detail.emailSendFailed)
              return
            }
            current = updated
          }

          await emailRepairOrderPdf(current.id, email)
          showToast('success', t.repairOrders.detail.emailSentSuccess)
        } catch (err) {
          logApiError('repair order email send', err)
          showToast('error', getFriendlyErrorMessage(err, 'generic', t))
        } finally {
          setSendingEmail(false)
        }
      },
    })
  }

  const linkedInvoice = repairOrder?.invoices?.[0] ?? null

  const handleCreateInvoice = () => {
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

    navigate(`/invoices/new?repairOrderId=${repairOrder.id}`)
  }

  const handleOcrApply = (result: RepairOrderOcrResult) => {
    const merged = mergeOcrIntoRepairOrderForm(
      form,
      result,
      { selected: selectedAccessories, otherText: accessoryOtherText },
      (value) => parseAccessories(value, t.repairOrders.accessories),
    )
    setForm(merged.form)
    setSelectedAccessories(merged.accessoriesState.selected)
    setAccessoryOtherText(merged.accessoriesState.otherText)
    setFieldErrors({})
    showToast('success', t.repairOrders.detail.ocrSuccess)
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

    if (import.meta.env.DEV) {
      console.log('[RepairOrderDetailPage] submit payload', validation.payload)
    }

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
              {resolveCustomerEmail() ? (
                <button
                  type="button"
                  data-testid="repair-order-send-email"
                  className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSendEmail}
                  disabled={saving || sendingEmail}
                >
                  <Mail className="h-4 w-4" />
                  {sendingEmail ? t.common.pleaseWait : t.repairOrders.detail.sendEmailBtn}
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

      {showActions && repairOrder ? (
        <RepairOrderHistory
          history={repairOrder.history ?? []}
          onAddComment={async (commentText) => {
            await addRepairOrderComment(repairOrder.id, commentText)
            const refreshed = await fetchRepairOrder(repairOrder.id)
            setRepairOrder(refreshed)
          }}
        />
      ) : null}

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      {!isExistingOrder ? (
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">
              {t.repairOrders.detail.ocrSectionTitle}
            </div>
          </div>
          <div className="card-body">
            <p className="mb-3 text-sm text-slate-600">{t.repairOrders.detail.ocrSectionHint}</p>
            <RepairOrderOcrScan
              disabled={saving}
              onApply={handleOcrApply}
              onError={(message) => showToast('error', message)}
            />
          </div>
        </div>
      ) : null}

      <form id="repair-order-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.repairOrders.detail.customerInfo}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <CustomerSearchInput
              label={t.repairOrders.detail.customerName}
              value={form.customerName}
              error={fieldErrors.customerName}
              onChange={(name, phone, email, address, customerId) => {
                setForm((current) => {
                  if (customerId) {
                    return {
                      ...current,
                      customerName: name,
                      customerPhone: phone,
                      customerEmail: email,
                      customerAddress: address,
                      customerId,
                    }
                  } else {
                    return {
                      ...current,
                      customerName: name,
                      customerId: undefined,
                    }
                  }
                })
                setFieldErrors((current) => {
                  const next = { ...current }
                  delete next.customerName
                  if (customerId) {
                    delete next.customerPhone
                    delete next.customerEmail
                  }
                  return next
                })
              }}
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
            <div>
              <label className="label">{t.repairOrders.detail.issueCategory}</label>
              <select
                className="input"
                value={form.issueCategory ?? ''}
                onChange={(e) => setField('issueCategory', e.target.value)}
              >
                <option value="">{t.repairOrders.detail.selectIssueCategory}</option>
                {(Object.keys(t.repairOrders.issueCategories) as Array<keyof typeof t.repairOrders.issueCategories>).map((key) => (
                  <option key={key} value={key}>{t.repairOrders.issueCategories[key]}</option>
                ))}
              </select>
            </div>
            <TextArea
              testId="ro-diagnosis"
              label={t.repairOrders.detail.diagnosis}
              value={form.diagnosis ?? ''}
              onChange={(value) => setField('diagnosis', value)}
            />
            <Field
              testId="ro-spare-parts"
              label={t.repairOrders.detail.requiredSpareParts}
              value={form.requiredSpareParts ?? ''}
              onChange={(value) => setField('requiredSpareParts', value)}
            />
            <div>
              <label className="label">{t.repairOrders.detail.sparePartStatus}</label>
              <select
                className="input"
                value={form.sparePartStatus ?? ''}
                onChange={(e) => setField('sparePartStatus', e.target.value)}
              >
                <option value="">{t.repairOrders.detail.selectSparePartStatus}</option>
                {(Object.keys(t.repairOrders.sparePartStatuses) as Array<keyof typeof t.repairOrders.sparePartStatuses>).map((key) => (
                  <option key={key} value={key}>{t.repairOrders.sparePartStatuses[key]}</option>
                ))}
              </select>
            </div>
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
                testId="ro-discount-percent"
                label={t.repairOrders.detail.discountPercent}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={String(form.discountPercent ?? '')}
                error={fieldErrors.discountPercent}
                onChange={(value) => setField('discountPercent', value)}
              />
              <label>
                <span className="label">{t.repairOrders.detail.totalPrice}</span>
                <div className="input bg-slate-50 text-slate-700 font-semibold cursor-default select-none">
                  {(() => {
                    const price = Number(form.estimatedPrice ?? 0)
                    const disc = Number(form.discountPercent ?? 0)
                    if (!price) return '—'
                    const total = price * (1 - disc / 100)
                    return `€ ${total.toFixed(2)}`
                  })()}
                </div>
              </label>
              <Field
                label={t.repairOrders.detail.depositAmount}
                type="number"
                min="0"
                step="0.01"
                value={String(form.depositAmount ?? '')}
                error={fieldErrors.depositAmount}
                onChange={(value) => setField('depositAmount', value)}
              />
              <label>
                <span className="label">{t.repairOrders.detail.remainingAmount}</span>
                <div className="input bg-slate-50 text-slate-700 font-semibold cursor-default select-none">
                  {(() => {
                    const price = Number(form.estimatedPrice ?? 0)
                    const disc = Number(form.discountPercent ?? 0)
                    const dep = Number(form.depositAmount ?? 0)
                    if (!price) return '—'
                    const total = price * (1 - disc / 100)
                    const remaining = total - dep
                    return `€ ${remaining.toFixed(2)}`
                  })()}
                </div>
              </label>
              <label>
                <span className="label">{t.repairOrders.detail.paymentMethod}</span>
                <select
                  className="input"
                  value={form.paymentMethod ?? ''}
                  onChange={(e) => setField('paymentMethod', e.target.value)}
                >
                  <option value="">{t.repairOrders.detail.selectPaymentMethod}</option>
                  {(Object.keys(t.repairOrders.paymentMethods) as Array<keyof typeof t.repairOrders.paymentMethods>).map((key) => (
                    <option key={key} value={key}>{t.repairOrders.paymentMethods[key]}</option>
                  ))}
                </select>
              </label>
              <Field
                label={t.repairOrders.detail.expectedCompletionDate}
                type="date"
                value={form.expectedCompletionDate ?? ''}
                error={fieldErrors.expectedCompletionDate}
                onChange={(value) => setField('expectedCompletionDate', value)}
              />
              <label>
                <span className="label">{t.repairOrders.detail.status}</span>
                <RepairOrderStatusSelect
                  className="w-full"
                  size="md"
                  value={(form.status ?? 'Open') as RepairOrderStatus}
                  onChange={(value) => {
                    if (isExistingOrder && repairOrder) {
                      void handleStatusChange(value)
                    } else {
                      setField('status', value)
                    }
                  }}
                />
              </label>
              <label>
                <span className="label">{t.repairOrders.detail.assignedEmployee}</span>
                <select
                  className="input"
                  data-testid="ro-assigned-employee"
                  value={form.assignedEmployeeId ?? ''}
                  onChange={(event) => setField('assignedEmployeeId', event.target.value)}
                >
                  <option value="">{t.repairOrders.detail.selectAssignedEmployee}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {form.status === 'SentToRepairCompany' ? (
              <div className="mt-4">
                <RepairCompanyFields
                  repairCompanyId={form.repairCompanyId}
                  repairCompanyNotes={form.repairCompanyNotes}
                  companies={repairCompanies}
                  loading={repairCompaniesLoading}
                  onRepairCompanyIdChange={(value) => setField('repairCompanyId', value)}
                  onNotesChange={(value) => setField('repairCompanyNotes', value)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <FormActionFooter testId="repair-order-form-footer">
          <button type="submit" data-testid="repair-order-save" className="btn btn-primary h-11 px-5" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t.repairOrders.detail.saving : t.repairOrders.detail.saveRepairOrder}
          </button>
        </FormActionFooter>
      </form>
    </div>
  )
}

function Field(props: {
  testId?: string
  label: string
  value: string
  type?: string
  min?: string
  max?: string
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
        max={props.max}
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

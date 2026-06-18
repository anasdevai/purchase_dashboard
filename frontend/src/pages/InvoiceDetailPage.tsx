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
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadInvoicePdf, fetchInvoice, generateInvoicePdf, saveInvoice, emailInvoicePdf } from '../api/invoices'
import { useAuth } from '../auth/AuthContext'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
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
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
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

function createEmptyForm(shopSettings: ShopSettings): InvoiceForm {
  return {
    invoiceDate: today(),
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    deviceSummary: '',
    repairSummary: '',
    paymentStatus: 'Open',
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
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress ?? '',
    customerPhone: invoice.customerPhone ?? '',
    customerEmail: invoice.customerEmail ?? '',
    deviceSummary: invoice.deviceSummary ?? '',
    repairSummary: invoice.repairSummary ?? '',
    paymentMethod: invoice.paymentMethod ?? undefined,
    paymentStatus: invoice.paymentStatus ?? undefined,
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
  const {
    invoiceNumber: _invoiceNumber,
    items,
    ...rest
  } = form

  return {
    ...rest,
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
  const { confirm, showToast } = useAppConfirm()
  const params = useParams()
  const navigate = useNavigate()
  const invoiceId = props.mode === 'new' ? undefined : params.invoiceId
  const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultShopSettings())
  const [form, setForm] = useState<InvoiceForm>(() => createEmptyForm(defaultShopSettings()))
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(Boolean(invoiceId))
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ customerName?: string }>({})
  const [pdfNeedsRegeneration, setPdfNeedsRegeneration] = useState(false)
  const totals = useMemo(() => calculate(form.items), [form.items])

  const paymentMethods = useMemo(
    () =>
      (['Cash', 'BankTransfer', 'Card', 'Other'] as const).map((value) => ({
        value,
        label: t.invoices.paymentMethods[value],
      })),
    [t],
  )

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    loadShopSettings(user.id).then((settings) => {
      if (!alive) return
      setShopSettings(settings)
      if (!invoiceId) {
        setForm(createEmptyForm(settings))
      }
    })
    return () => {
      alive = false
    }
  }, [user?.id, invoiceId])

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

  const setField = (name: keyof InvoiceForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const setItem = (index: number, name: keyof InvoiceForm['items'][number], value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    }))
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
    if (!form.customerName.trim()) {
      setFieldErrors({ customerName: t.invoices.validation.customerNameRequired })
      return
    }

    setFieldErrors({})
    setSaving(true)
    setError(null)
    try {
      const saved = await saveInvoice(cleanForm(form), invoiceId)
      setInvoice(saved)
      setForm(fromInvoice(saved))
      setPdfNeedsRegeneration(false)
      showToast('success', t.common.toasts.invoiceSaved)
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

  const handleSendEmail = () => {
    if (!invoice || !invoice.customerEmail) return

    confirm({
      title: t.invoices.detail.sendEmailConfirmTitle,
      message: interpolate(t.invoices.detail.sendEmailConfirmMessage, {
        email: invoice.customerEmail,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          await emailInvoicePdf(invoice.id)
          showToast('success', t.invoices.detail.emailSentSuccess)
        } catch (err) {
          logApiError('invoice email send', err)
          showToast('error', t.invoices.detail.emailSendFailed)
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
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
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
              value={form.customerEmail ?? ''}
              onChange={(value) => setField('customerEmail', value)}
            />
            <Field
              testId="invoice-customer-phone"
              label={t.invoices.detail.customerPhone}
              placeholder={t.invoices.detail.customerPhonePlaceholder}
              value={form.customerPhone ?? ''}
              onChange={(value) => setField('customerPhone', value)}
            />
            <Field
              label={t.invoices.detail.customerAddress}
              placeholder={t.invoices.detail.customerAddressPlaceholder}
              value={form.customerAddress ?? ''}
              onChange={(value) => setField('customerAddress', value)}
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
                readOnly
                onChange={() => undefined}
              />
              <Field
                label={t.invoices.detail.invoiceDate}
                type="date"
                value={form.invoiceDate ?? today()}
                onChange={(value) => setField('invoiceDate', value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            min={0}
                            step={1}
                            inputMode="numeric"
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

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{t.invoices.detail.pdfFooterNote}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
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
            {invoice?.pdfPath ? (
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
            ) : null}
            {invoice && invoice.customerEmail ? (
              <button
                type="button"
                data-testid="invoice-send-email"
                className="btn btn-secondary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSendEmail}
                disabled={saving || sendingEmail}
              >
                <Mail className="h-4 w-4" />
                {t.invoices.detail.sendEmailBtn}
              </button>
            ) : null}
          </div>
        </div>
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

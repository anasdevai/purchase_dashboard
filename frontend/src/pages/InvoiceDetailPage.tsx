import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Download, FileText, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadInvoicePdf, fetchInvoice, generateInvoicePdf, saveInvoice } from '../api/invoices'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import type { Invoice, InvoiceItem, InvoicePayload } from '../types/invoice'

const VAT_PRESETS = ['0', '10', '13', '20'] as const

type InvoiceForm = Omit<InvoicePayload, 'items'> & {
  items: Array<{
    description: string
    quantity: string
    unitPrice: string
    vatPercent: string
  }>
}

const emptyItem = { description: '', quantity: '1', unitPrice: '0', vatPercent: '0' }

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm: InvoiceForm = {
  invoiceDate: today(),
  customerName: '',
  customerAddress: '',
  customerPhone: '',
  customerEmail: '',
  deviceSummary: '',
  repairSummary: '',
  paymentStatus: 'Open',
  notes: '',
  items: [{ ...emptyItem }],
}

function numberOrZero(value: string | number | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculate(items: InvoiceForm['items']) {
  return items.reduce(
    (totals, item) => {
      const net = numberOrZero(item.quantity) * numberOrZero(item.unitPrice)
      const vat = net * (numberOrZero(item.vatPercent) / 100)
      return {
        net: totals.net + net,
        vat: totals.vat + vat,
        gross: totals.gross + net + vat,
      }
    },
    { net: 0, vat: 0, gross: 0 },
  )
}

function parseOverride(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function effectiveTotals(form: InvoiceForm, calculated: ReturnType<typeof calculate>) {
  return {
    net: parseOverride(form.netAmountOverride) ?? calculated.net,
    vat: parseOverride(form.vatAmountOverride) ?? calculated.vat,
    gross: parseOverride(form.grossTotalOverride) ?? calculated.gross,
  }
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
    netAmountOverride: invoice.netAmountOverride === null || invoice.netAmountOverride === undefined ? undefined : Number(invoice.netAmountOverride),
    vatAmountOverride: invoice.vatAmountOverride === null || invoice.vatAmountOverride === undefined ? undefined : Number(invoice.vatAmountOverride),
    grossTotalOverride: invoice.grossTotalOverride === null || invoice.grossTotalOverride === undefined ? undefined : Number(invoice.grossTotalOverride),
    notes: invoice.notes ?? '',
    items: invoice.items.map((item: InvoiceItem) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      vatPercent: String(item.vatPercent),
    })),
  }
}

function cleanForm(form: InvoiceForm): InvoicePayload {
  return {
    ...form,
    items: form.items.map((item) => ({
      description: item.description,
      quantity: numberOrZero(item.quantity),
      unitPrice: numberOrZero(item.unitPrice),
      vatPercent: numberOrZero(item.vatPercent),
    })),
    netAmountOverride: form.netAmountOverride === undefined || Number.isNaN(Number(form.netAmountOverride)) ? undefined : Number(form.netAmountOverride),
    vatAmountOverride: form.vatAmountOverride === undefined || Number.isNaN(Number(form.vatAmountOverride)) ? undefined : Number(form.vatAmountOverride),
    grossTotalOverride: form.grossTotalOverride === undefined || Number.isNaN(Number(form.grossTotalOverride)) ? undefined : Number(form.grossTotalOverride),
  }
}

export function NewInvoicePage() {
  return <InvoiceDetailPage mode="new" />
}

export function InvoiceDetailPage(props: { mode?: 'new' }) {
  const { t, interpolate, formatMoney } = useLanguage()
  const { showToast } = useAppConfirm()
  const params = useParams()
  const navigate = useNavigate()
  const invoiceId = props.mode === 'new' ? undefined : params.invoiceId
  const [form, setForm] = useState<InvoiceForm>(emptyForm)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(Boolean(invoiceId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ customerName?: string }>({})
  const [pdfNeedsRegeneration, setPdfNeedsRegeneration] = useState(false)
  const calculatedTotals = useMemo(() => calculate(form.items), [form.items])
  const totals = useMemo(() => effectiveTotals(form, calculatedTotals), [form, calculatedTotals])

  const paymentMethods = useMemo(
    () =>
      (['Cash', 'BankTransfer', 'Card', 'Other'] as const).map((value) => ({
        value,
        label: t.invoices.paymentMethods[value],
      })),
    [t],
  )

  const paymentStatuses = useMemo(
    () =>
      (['Paid', 'Open', 'Cancelled'] as const).map((value) => ({
        value,
        label: t.invoices.paymentStatuses[value],
      })),
    [t],
  )

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
        if (alive) setError(err instanceof Error ? err.message : t.invoices.errors.loadDetailFailed)
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
      if (invoiceId && !saved.pdfPath) {
        setPdfNeedsRegeneration(true)
      }
      if (!invoiceId) navigate(`/invoices/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.invoices.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!invoice) return
    setSaving(true)
    setError(null)
    try {
      const updated = await generateInvoicePdf(invoice.id)
      setInvoice(updated)
      setPdfNeedsRegeneration(false)
      showToast('success', t.invoices.detail.pdfGenerated)
    } catch (err) {
      const message = err instanceof Error ? err.message : t.invoices.errors.pdfFailed
      setError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm font-semibold text-slate-600">{t.invoices.detail.loading}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            {invoice
              ? interpolate(t.invoices.detail.titleExisting, { invoiceNumber: invoice.invoiceNumber })
              : t.invoices.detail.titleNew}
          </div>
          <div className="mt-1 text-sm text-slate-600">{t.invoices.detail.description}</div>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/invoices" className="btn btn-secondary">{t.invoices.detail.backToList}</Link>
          {invoice ? (
            <button type="button" data-testid="invoice-generate-pdf" className="btn btn-secondary" onClick={handleGeneratePdf} disabled={saving}>
              <FileText className="h-4 w-4" />
              {t.invoices.detail.generatePdf}
            </button>
          ) : null}
          {invoice?.pdfPath ? (
            <button
              type="button"
              data-testid="invoice-download-pdf"
              className="btn btn-primary"
              onClick={() => downloadInvoicePdf(invoice.id, `${invoice.invoiceNumber}.pdf`)}
            >
              <Download className="h-4 w-4" />
              {t.invoices.detail.downloadPdf}
            </button>
          ) : null}
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.invoices.detail.customerInfo}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <Field
              testId="invoice-customer-name"
              label={t.invoices.detail.customerName}
              value={form.customerName}
              error={fieldErrors.customerName}
              onChange={(value) => {
                setField('customerName', value)
                if (fieldErrors.customerName) setFieldErrors({})
              }}
            />
            <Field testId="invoice-customer-phone" label={t.invoices.detail.customerPhone} value={form.customerPhone ?? ''} onChange={(value) => setField('customerPhone', value)} />
            <Field label={t.invoices.detail.customerEmail} type="email" value={form.customerEmail ?? ''} onChange={(value) => setField('customerEmail', value)} />
            <Field label={t.invoices.detail.customerAddress} value={form.customerAddress ?? ''} onChange={(value) => setField('customerAddress', value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.invoices.detail.invoiceInfo}</div>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <Field label={t.invoices.detail.invoiceNumber} value={form.invoiceNumber ?? ''} onChange={(value) => setField('invoiceNumber', value)} />
            <Field label={t.invoices.detail.invoiceDate} type="date" value={form.invoiceDate ?? today()} onChange={(value) => setField('invoiceDate', value)} />
            <label>
              <span className="label">{t.invoices.detail.paymentMethod}</span>
              <select className="input" value={form.paymentMethod ?? ''} onChange={(event) => setField('paymentMethod', event.target.value)}>
                <option value="">{t.invoices.detail.selectPaymentMethod}</option>
                {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </label>
            <label>
              <span className="label">{t.invoices.detail.paymentStatus}</span>
              <select className="input" value={form.paymentStatus ?? ''} onChange={(event) => setField('paymentStatus', event.target.value)}>
                <option value="">{t.invoices.detail.selectStatus}</option>
                {paymentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <Field label={t.invoices.detail.deviceSummary} value={form.deviceSummary ?? ''} onChange={(value) => setField('deviceSummary', value)} />
            <Field label={t.invoices.detail.repairSummary} value={form.repairSummary ?? ''} onChange={(value) => setField('repairSummary', value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">{t.invoices.detail.lineItems}</div>
            <button
              type="button"
              data-testid="invoice-add-line"
              className="btn btn-secondary"
              onClick={() => setForm((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))}
            >
              <Plus className="h-4 w-4" />
              {t.invoices.detail.addLine}
            </button>
          </div>
          <div className="card-body space-y-3">
            <div className="table-scroll">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500">
                    <th className="py-2 pr-3">{t.invoices.detail.descriptionCol}</th>
                    <th className="w-24 py-2 pr-3">{t.invoices.detail.quantity}</th>
                    <th className="w-32 py-2 pr-3">{t.invoices.detail.unitPrice}</th>
                    <th className="w-28 py-2 pr-3">{t.invoices.detail.vatPercent}</th>
                    <th className="w-32 py-2 pr-3 text-right">{t.invoices.detail.total}</th>
                    <th className="w-12 py-2 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => {
                    const rowNet = numberOrZero(item.quantity) * numberOrZero(item.unitPrice)
                    const rowTotal = rowNet + rowNet * (numberOrZero(item.vatPercent) / 100)
                    return (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="py-3 pr-3">
                          <input className="input" data-testid={`invoice-line-${index}-description`} value={item.description} onChange={(event) => setItem(index, 'description', event.target.value)} />
                        </td>
                        <td className="py-3 pr-3">
                          <input className="input" type="number" step="0.01" data-testid={`invoice-line-${index}-quantity`} value={item.quantity} onChange={(event) => setItem(index, 'quantity', event.target.value)} />
                        </td>
                        <td className="py-3 pr-3">
                          <input className="input" type="number" step="0.01" data-testid={`invoice-line-${index}-unit-price`} value={item.unitPrice} onChange={(event) => setItem(index, 'unitPrice', event.target.value)} />
                        </td>
                        <td className="py-3 pr-3">
                          <VatPercentField
                            testId={`invoice-line-${index}-vat`}
                            value={item.vatPercent}
                            otherLabel={t.invoices.detail.vatOtherOption}
                            customPlaceholder={t.invoices.detail.vatCustomPlaceholder}
                            onChange={(value) => setItem(index, 'vatPercent', value)}
                          />
                        </td>
                        <td className="py-3 pr-3 text-right text-sm font-semibold text-slate-900">{formatMoney(rowTotal)}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="btn h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) || [{ ...emptyItem }] }))}
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
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900">{t.invoices.detail.notes}</div>
            </div>
            <div className="card-body">
              <textarea
                data-testid="invoice-notes"
                className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                value={form.notes ?? ''}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900">{t.invoices.detail.totals}</div>
            </div>
            <div className="card-body space-y-3">
              <TotalRow testId="invoice-total-net" label={t.invoices.detail.netAmount} value={formatMoney(totals.net)} />
              <TotalRow testId="invoice-total-vat" label={t.invoices.detail.vatAmount} value={formatMoney(totals.vat)} />
              <TotalRow testId="invoice-total-gross" label={t.invoices.detail.grossTotal} value={formatMoney(totals.gross)} strong />
              <div className="border-t border-slate-200 pt-3">
                <Field label={t.invoices.detail.overrideNet} type="number" value={String(form.netAmountOverride ?? '')} onChange={(value) => setField('netAmountOverride', value)} />
                <div className="mt-3" />
                <Field label={t.invoices.detail.overrideVat} type="number" value={String(form.vatAmountOverride ?? '')} onChange={(value) => setField('vatAmountOverride', value)} />
                <div className="mt-3" />
                <Field label={t.invoices.detail.overrideGross} type="number" value={String(form.grossTotalOverride ?? '')} onChange={(value) => setField('grossTotalOverride', value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" data-testid="invoice-save" className="btn btn-primary w-full sm:w-auto" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? t.invoices.detail.saving : t.invoices.detail.saveInvoice}
          </button>
        </div>
      </form>
    </div>
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
        className="input"
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
          step="0.01"
          min="0"
          data-testid={props.testId ? `${props.testId}-custom` : undefined}
          placeholder={props.customPlaceholder}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
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
        step={props.type === 'number' ? '0.01' : undefined}
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

import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteInvoice, downloadInvoicePdf, fetchInvoices, updateInvoicePaymentStatus } from '../api/invoices'
import { formatWholeMoney } from '../utils/formatMoney'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { Invoice, InvoicePaymentStatus } from '../types/invoice'

export function InvoicesPage() {
  const { t, interpolate, formatDate, language } = useLanguage()
  const { showToast } = useAppConfirm()
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const paymentStatuses = useMemo(
    () =>
      (['Paid', 'Open', 'Cancelled'] as const).map((value) => ({
        value,
        label: t.invoices.paymentStatuses[value],
      })),
    [t],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchInvoices(query, date)
        .then((data) => {
          setInvoices(data)
          setError(null)
        })
        .catch((err) => {
          logApiError('invoices list load', err)
          setError(getFriendlyErrorMessage(err, 'load', t))
        })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query, date, t.invoices.errors.loadFailed])

  const handleDelete = async (invoice: Invoice) => {
    if (!window.confirm(interpolate(t.invoices.confirmDelete, { invoiceNumber: invoice.invoiceNumber }))) {
      return
    }
    setDeletingId(invoice.id)
    try {
      await deleteInvoice(invoice.id)
      setInvoices((current) => current.filter((item) => item.id !== invoice.id))
    } catch (err) {
      logApiError('invoice delete', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePaymentStatusChange = async (invoice: Invoice, paymentStatus: InvoicePaymentStatus) => {
    setUpdatingStatusId(invoice.id)
    try {
      const updated = await updateInvoicePaymentStatus(invoice.id, paymentStatus)
      setInvoices((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, paymentStatus: updated.paymentStatus } : item,
        ),
      )
    } catch (err) {
      logApiError('invoice payment status', err)
      showToast('error', getFriendlyErrorMessage(err, 'save', t))
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold text-slate-900">
          {t.invoices.title}
        </div>
        <Link to="/invoices/new" className="btn btn-primary w-full sm:w-auto">
          {t.invoices.newInvoice}
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="card min-w-0 overflow-hidden">
        <div className="card-body">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                data-testid="invoices-search"
                className="input pl-9"
                placeholder={t.invoices.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <input data-testid="invoices-date-filter" className="input w-full sm:w-48" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <div className="text-xs font-semibold text-slate-500">
              {interpolate(t.table.resultCount, { count: invoices.length })}
            </div>
          </div>

          <div className="table-scroll mt-4">
            <table data-testid="invoices-table" className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500">
                  <th className="py-2 pr-4">{t.invoices.table.invoiceNumber}</th>
                  <th className="py-2 pr-4">{t.invoices.table.customer}</th>
                  <th className="py-2 pr-4">{t.invoices.table.phone}</th>
                  <th className="py-2 pr-4">{t.invoices.table.date}</th>
                  <th className="py-2 pr-4">{t.invoices.table.payment}</th>
                  <th className="py-2 pr-4">{t.invoices.table.grossTotal}</th>
                  <th className="py-2 pr-4 text-right">{t.invoices.table.action}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} data-testid={`invoice-row-${invoice.id}`} className="border-t border-slate-200">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="py-3 pr-4">{invoice.customerName}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{invoice.customerPhone || t.common.dash}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{formatDate(invoice.invoiceDate.slice(0, 10))}</td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <select
                        data-testid={`invoice-payment-status-${invoice.id}`}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                        value={invoice.paymentStatus ?? 'Open'}
                        disabled={updatingStatusId === invoice.id}
                        onChange={(event) =>
                          handlePaymentStatusChange(invoice, event.target.value as InvoicePaymentStatus)
                        }
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {formatWholeMoney(Number(invoice.calculatedGrossTotal ?? 0))}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link className="btn btn-secondary h-8 w-8 p-0" data-testid={`invoice-view-${invoice.id}`} to={`/invoices/${invoice.id}`} title={t.table.open}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        {invoice.pdfPath ? (
                          <button
                            type="button"
                            className="btn btn-secondary h-8 w-8 p-0"
                            title={t.table.download}
                            onClick={async () => {
                              try {
                                await downloadInvoicePdf(invoice.id, `${invoice.invoiceNumber}.pdf`, language)
                                showToast('success', t.common.toasts.pdfDownloaded)
                              } catch (err) {
                                logApiError('invoice pdf download', err)
                                showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          data-testid={`invoice-delete-${invoice.id}`}
                          disabled={deletingId === invoice.id}
                          className="btn h-8 w-8 p-0 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          title={t.table.delete}
                          onClick={() => handleDelete(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      {t.invoices.noResults}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

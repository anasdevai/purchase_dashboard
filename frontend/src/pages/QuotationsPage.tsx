import { useEffect, useState } from 'react'
import { Download, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteQuotation, downloadQuotationPdf, fetchQuotations } from '../api/quotations'
import { formatWholeMoney } from '../utils/formatMoney'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { Quotation, QuotationStatus } from '../types/quotation'

export function QuotationsPage() {
  const { t, interpolate, formatDate } = useLanguage()
  const { showToast } = useAppConfirm()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchQuotations(query, status)
        .then((data) => {
          setQuotations(data)
          setError(null)
        })
        .catch((err) => {
          logApiError('quotations list load', err)
          setError(getFriendlyErrorMessage(err, 'load', t))
        })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query, status, t])

  const handleDelete = async (quotation: Quotation) => {
    if (!window.confirm(interpolate(t.quotations.confirmDelete, { quotationNumber: quotation.quotationNumber }))) {
      return
    }
    setDeletingId(quotation.id)
    try {
      await deleteQuotation(quotation.id)
      setQuotations((current) => current.filter((item) => item.id !== quotation.id))
      showToast('success', t.common.toasts.pdfDownloaded) // Reuse or toast success
    } catch (err) {
      logApiError('quotation delete', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-800 ring-slate-600/20'
      case 'Sent':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20'
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 ring-rose-600/20'
      case 'Expired':
        return 'bg-amber-100 text-amber-800 ring-amber-600/20'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold text-slate-900">
          {t.quotations.title}
        </div>
        <Link to="/quotations/new" className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          {t.quotations.newQuotation}
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
                data-testid="quotations-search"
                className="input pl-9"
                placeholder={t.quotations.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            
            <select
              data-testid="quotations-status-filter"
              className="input w-full sm:w-48"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">{t.quotations.allStatuses}</option>
              <option value="Draft">{t.quotations.statuses.Draft}</option>
              <option value="Sent">{t.quotations.statuses.Sent}</option>
              <option value="Accepted">{t.quotations.statuses.Accepted}</option>
              <option value="Rejected">{t.quotations.statuses.Rejected}</option>
              <option value="Expired">{t.quotations.statuses.Expired}</option>
            </select>

            <div className="text-xs font-semibold text-slate-500">
              {interpolate(t.table.resultCount, { count: quotations.length })}
            </div>
          </div>

          <div className="table-scroll mt-4">
            <table data-testid="quotations-table" className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500">
                  <th className="py-2 pr-4">{t.quotations.table.quotationNumber}</th>
                  <th className="py-2 pr-4">{t.quotations.table.customer}</th>
                  <th className="py-2 pr-4">{t.quotations.table.phone}</th>
                  <th className="py-2 pr-4">{t.quotations.table.device}</th>
                  <th className="py-2 pr-4">{t.quotations.table.date}</th>
                  <th className="py-2 pr-4">{t.quotations.table.validUntil}</th>
                  <th className="py-2 pr-4">{t.quotations.table.status}</th>
                  <th className="py-2 pr-4">{t.quotations.table.total}</th>
                  <th className="py-2 pr-4 text-right">{t.quotations.table.action}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {quotations.map((quotation) => {
                  const grossTotal = quotation.items?.reduce(
                    (sum, item) => sum + Number(item.lineTotal ?? 0),
                    0
                  ) ?? 0;

                  const deviceText = [quotation.brand, quotation.model].filter(Boolean).join(' ') || quotation.deviceType;

                  return (
                    <tr key={quotation.id} data-testid={`quotation-row-${quotation.id}`} className="border-t border-slate-200">
                      <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">{quotation.quotationNumber}</td>
                      <td className="py-3 pr-4">{quotation.customerName}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{quotation.customerPhone || t.common.dash}</td>
                      <td className="py-3 pr-4 truncate max-w-[200px]" title={deviceText}>{deviceText}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatDate(quotation.createdAt.slice(0, 10))}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatDate(quotation.validUntilDate.slice(0, 10))}</td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(quotation.status)}`}>
                          {t.quotations.statuses[quotation.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 font-semibold">
                        {formatWholeMoney(grossTotal)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          <Link className="btn btn-secondary h-8 w-8 p-0" data-testid={`quotation-view-${quotation.id}`} to={`/quotations/${quotation.id}`} title={t.table.open}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          {quotation.pdfPath ? (
                            <button
                              type="button"
                              className="btn btn-secondary h-8 w-8 p-0"
                              title={t.table.download}
                              onClick={async () => {
                                try {
                                  await downloadQuotationPdf(quotation.id, `${quotation.quotationNumber}.pdf`)
                                  showToast('success', t.common.toasts.pdfDownloaded)
                                } catch (err) {
                                  logApiError('quotation pdf download', err)
                                  showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            data-testid={`quotation-delete-${quotation.id}`}
                            disabled={deletingId === quotation.id}
                            className="btn h-8 w-8 p-0 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            title={t.table.delete}
                            onClick={() => handleDelete(quotation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                      {t.quotations.noResults}
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

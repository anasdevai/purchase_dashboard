import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Receipt, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { fetchUserInvoices, fetchUser, type AdminUser } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'
import { getApiBaseUrl, getToken } from '../../api/client'

export function AdminUserInvoicesPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { formatMoney, formatDate, language } = useLanguage()
  const isDe = language === 'de'

  const [user, setUser] = useState<AdminUser | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    Promise.all([fetchUser(userId), fetchUserInvoices(userId, page, 15)])
      .then(([userRes, invoicesRes]) => {
        setUser(userRes.user)
        setInvoices(invoicesRes.invoices)
        setTotalPages(invoicesRes.pagination.totalPages)
        setTotal(invoicesRes.pagination.total)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || (isDe ? 'Fehler beim Laden der Daten' : 'Failed to load data'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId, page, isDe])

  const handleDownload = (invoiceId: string) => {
    const token = getToken()
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    const url = `${getApiBaseUrl()}/api/admin/invoices/${invoiceId}/pdf${query}`
    window.open(url, '_blank')
  }

  const t = {
    backToProfile: isDe ? 'Zurück zum Benutzerprofil' : 'Back to User Profile',
    title: user
      ? (isDe ? `Rechnungen von ${user.name}` : `${user.name}'s Invoices`)
      : (isDe ? 'Rechnungen' : 'Invoices'),
    subtitle: isDe
      ? `Alle von ${user?.name || 'diesem Benutzer'} erstellten Rechnungen werden angezeigt.`
      : `Viewing all sales invoices created by ${user?.name || 'this user'}.`,
    loading: isDe ? 'Rechnungen werden geladen...' : 'Loading invoices...',
    noInvoices: isDe ? 'Keine Rechnungen für diesen Benutzer gefunden.' : 'No invoices found for this user.',
    thNumber: isDe ? 'Nummer' : 'Number',
    thCustomer: isDe ? 'Kunde' : 'Customer',
    thPaymentMethod: isDe ? 'Zahlungsart' : 'Payment Method',
    thTotalAmount: isDe ? 'Gesamtbetrag' : 'Total Amount',
    thDate: isDe ? 'Datum' : 'Date',
    thStatus: isDe ? 'Status' : 'Status',
    thActions: isDe ? 'Aktionen' : 'Actions',
    noEmail: isDe ? 'Keine E-Mail' : 'No email',
    pagination: (page: number, totalPages: number, total: number) =>
      isDe
        ? `Seite ${page} von ${totalPages} · Gesamt ${total} Rechnungen`
        : `Page ${page} of ${totalPages} · Total ${total} invoices`,
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Back link */}
      <button
        onClick={() => navigate(`/admin/users/${userId}`)}
        className="group mb-6 flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>{t.backToProfile}</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {t.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            <p className="text-xs font-medium text-white/40">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <Receipt className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm font-medium text-white/40">{t.noInvoices}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thNumber}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thCustomer}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thPaymentMethod}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thTotalAmount}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thDate}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thStatus}</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-white/30">{t.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition hover:bg-white/[0.01]">
                    <td className="px-6 py-4 text-sm font-semibold text-white/80">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white/80">{inv.customerName}</p>
                      <p className="text-[11px] text-white/30">{inv.customerEmail || t.noEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{inv.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white/80">{formatMoney(inv.totalAmount)}</td>
                    <td className="px-6 py-4 text-xs text-white/40">{formatDate(inv.date || inv.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : inv.status === 'Open'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.pdfPath && (
                          <button
                            onClick={() => handleDownload(inv.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                            title={isDe ? 'PDF herunterladen' : 'Download PDF'}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                          title={isDe ? 'Details anzeigen' : 'View Details'}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
              <p className="text-xs text-white/35">
                {t.pagination(page, totalPages, total)}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-white transition hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-white transition hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

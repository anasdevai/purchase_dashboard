import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { fetchUserContracts, fetchUser, type AdminUser } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'
import { getApiBaseUrl, getToken } from '../../api/client'

export function AdminUserContractsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { formatMoney, formatDate } = useLanguage()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    Promise.all([fetchUser(userId), fetchUserContracts(userId, page, 15)])
      .then(([userRes, contractsRes]) => {
        setUser(userRes.user)
        setContracts(contractsRes.contracts)
        setTotalPages(contractsRes.pagination.totalPages)
        setTotal(contractsRes.pagination.total)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId, page])

  const handleDownload = (contractId: string) => {
    const token = getToken()
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    const url = `${getApiBaseUrl()}/api/admin/contracts/${contractId}/pdf${query}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen px-8 py-8">
      {/* Back link */}
      <button
        onClick={() => navigate(`/admin/users/${userId}`)}
        className="group mb-6 flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to User Profile</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {user ? `${user.name}'s Contracts` : 'Contracts'}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Viewing all device purchase contracts created by {user?.name || 'this user'}.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            <p className="text-xs font-medium text-white/40">Loading contracts...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm font-medium text-white/40">No contracts found for this user.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Device Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Price</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {contracts.map((c) => (
                  <tr key={c.id} className="transition hover:bg-white/[0.01]">
                    <td className="px-6 py-4 text-sm font-semibold text-white/80">{c.contractNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white/80">{c.customerName}</p>
                      <p className="text-[11px] text-white/30">{c.customerEmail || 'No email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white/80">{c.device}</p>
                      <p className="text-[11px] text-white/30">IMEI: {c.imeiOrSerial || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white/80">{formatMoney(c.price)}</td>
                    <td className="px-6 py-4 text-xs text-white/40">{formatDate(c.date || c.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : c.status === 'Draft'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {c.pdfPath && (
                          <button
                            onClick={() => handleDownload(c.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                          title="View Details"
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
                Page <span className="font-semibold text-white/60">{page}</span> of{' '}
                <span className="font-semibold text-white/60">{totalPages}</span> · Total{' '}
                <span className="font-semibold text-white/60">{total}</span> contracts
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

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { fetchUserContracts, fetchUser, type AdminUser } from '../services/admin'
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
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <button
        onClick={() => navigate(`/admin/users/${userId}`)}
        className="group mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to User Profile</span>
      </button>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          {user ? `${user.name}'s Contracts` : 'Contracts'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Viewing all device purchase contracts created by {user?.name || 'this user'}.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-xs font-medium text-slate-500">Loading contracts...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card px-8 py-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="card py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No contracts found for this user.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Device Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Price</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{c.contractNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{c.customerName}</p>
                      <p className="text-[11px] text-slate-500">{c.customerEmail || 'No email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {[c.deviceType, c.brand, c.model].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        IMEI/Serial: {c.imei || c.serialNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {formatMoney(c.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : c.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
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
                            className="btn btn-secondary h-8 w-8 p-0"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className="btn btn-secondary h-8 w-8 p-0"
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
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> · Total{' '}
                <span className="font-semibold text-slate-800">{total}</span> contracts
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary h-9 w-9 p-0 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary h-9 w-9 p-0 disabled:opacity-30"
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

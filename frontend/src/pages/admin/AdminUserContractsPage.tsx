import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { fetchUserContracts, fetchUser, type AdminUser } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'
import { getApiBaseUrl, getToken } from '../../api/client'
import {
  adminBackLinkClass,
  adminEmptyStateClass,
  adminErrorStateClass,
  adminIconButtonClass,
  adminLoadingSpinnerClass,
  adminLoadingTextClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPaginationFooterClass,
  adminPaginationTextClass,
  adminTableCellMutedClass,
  adminTableCellPrimaryClass,
  adminTableCellSecondaryClass,
  adminTableHeadClass,
  adminTableRowClass,
} from './adminUi'

function contractStatusClass(status: string) {
  if (status === 'Completed') return 'border border-emerald-100 bg-emerald-50 text-emerald-700'
  if (status === 'Draft') return 'border border-amber-100 bg-amber-50 text-amber-700'
  return 'border border-red-100 bg-red-50 text-red-700'
}

export function AdminUserContractsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t, formatMoney, formatDate, interpolate } = useLanguage()

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
        setError(err.message || t.admin.loadDataFailed)
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
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(`/admin/users/${userId}`)} className={adminBackLinkClass}>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>{t.admin.backToUserProfile}</span>
      </button>

      <div>
        <h1 className={adminPageTitleClass}>
          {user ? interpolate(t.admin.userContractsTitle, { name: user.name }) : t.admin.contracts}
        </h1>
        <p className={adminPageSubtitleClass}>{t.admin.userContractsSubtitle}</p>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className={adminLoadingSpinnerClass} />
            <p className={adminLoadingTextClass}>Loading contracts...</p>
          </div>
        </div>
      ) : error ? (
        <div className={adminErrorStateClass}>{error}</div>
      ) : contracts.length === 0 ? (
        <div className={adminEmptyStateClass}>
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No contracts found for this user.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className={adminTableHeadClass}>Number</th>
                  <th className={adminTableHeadClass}>Customer</th>
                  <th className={adminTableHeadClass}>Device Info</th>
                  <th className={adminTableHeadClass}>Price</th>
                  <th className={adminTableHeadClass}>Date</th>
                  <th className={adminTableHeadClass}>Status</th>
                  <th className={`${adminTableHeadClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className={adminTableRowClass}>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellPrimaryClass}`}>{c.contractNumber}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <p className={adminTableCellPrimaryClass}>{c.customerName}</p>
                      <p className={adminTableCellSecondaryClass}>{c.customerEmail || t.admin.noEmail}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <p className={adminTableCellPrimaryClass}>{c.device}</p>
                      <p className={adminTableCellSecondaryClass}>IMEI: {c.imeiOrSerial || 'N/A'}</p>
                    </td>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellPrimaryClass}`}>{formatMoney(c.price)}</td>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellMutedClass}`}>
                      {formatDate(c.date || c.createdAt)}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${contractStatusClass(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <div className="flex justify-end gap-2">
                        {c.pdfPath ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(c.id)}
                            className={adminIconButtonClass}
                            title={t.admin.downloadPdf}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className={adminIconButtonClass}
                          title={t.admin.viewDetails}
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

          {totalPages > 1 ? (
            <div className={adminPaginationFooterClass}>
              <p className={adminPaginationTextClass}>
                Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> · Total{' '}
                <span className="font-semibold text-slate-800">{total}</span> contracts
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary h-9 w-9 p-0 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary h-9 w-9 p-0 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

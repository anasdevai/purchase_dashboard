import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wrench, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { fetchUserRepairOrders, fetchUser, type AdminUser } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'
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

function repairStatusClass(status: string) {
  if (status === 'Completed') return 'border border-emerald-100 bg-emerald-50 text-emerald-700'
  if (status === 'InRepair') return 'border border-sky-100 bg-sky-50 text-sky-700'
  if (status === 'Cancelled') return 'border border-red-100 bg-red-50 text-red-700'
  return 'border border-amber-100 bg-amber-50 text-amber-700'
}

export function AdminUserRepairOrdersPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t, formatMoney, formatDate, interpolate } = useLanguage()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [repairOrders, setRepairOrders] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    Promise.all([fetchUser(userId), fetchUserRepairOrders(userId, page, 15)])
      .then(([userRes, repairsRes]) => {
        setUser(userRes.user)
        setRepairOrders(repairsRes.repairOrders)
        setTotalPages(repairsRes.pagination.totalPages)
        setTotal(repairsRes.pagination.total)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || t.admin.loadDataFailed)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId, page])

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(`/admin/users/${userId}`)} className={adminBackLinkClass}>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>{t.admin.backToUserProfile}</span>
      </button>

      <div>
        <h1 className={adminPageTitleClass}>
          {user ? interpolate(t.admin.userRepairOrdersTitle, { name: user.name }) : t.admin.repairOrders}
        </h1>
        <p className={adminPageSubtitleClass}>{t.admin.userRepairOrdersSubtitle}</p>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className={adminLoadingSpinnerClass} />
            <p className={adminLoadingTextClass}>Loading repair orders...</p>
          </div>
        </div>
      ) : error ? (
        <div className={adminErrorStateClass}>{error}</div>
      ) : repairOrders.length === 0 ? (
        <div className={adminEmptyStateClass}>
          <Wrench className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">No repair orders found for this user.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className={adminTableHeadClass}>Order No</th>
                  <th className={adminTableHeadClass}>Customer</th>
                  <th className={adminTableHeadClass}>Device Model</th>
                  <th className={adminTableHeadClass}>Issue</th>
                  <th className={adminTableHeadClass}>Est. Cost</th>
                  <th className={adminTableHeadClass}>Date Created</th>
                  <th className={adminTableHeadClass}>Status</th>
                  <th className={`${adminTableHeadClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairOrders.map((ro) => (
                  <tr key={ro.id} className={adminTableRowClass}>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellPrimaryClass}`}>{ro.orderNumber}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <p className={adminTableCellPrimaryClass}>{ro.customerName}</p>
                      <p className={adminTableCellSecondaryClass}>{ro.customerPhone || t.admin.noPhone}</p>
                    </td>
                    <td className={`px-4 py-4 sm:px-6 text-sm font-medium text-slate-800`}>{ro.deviceModel}</td>
                    <td
                      className="max-w-[150px] truncate px-4 py-4 text-xs text-slate-600 sm:px-6"
                      title={ro.problemDescription}
                    >
                      {ro.problemDescription}
                    </td>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellPrimaryClass}`}>
                      {formatMoney(ro.estimatedCost)}
                    </td>
                    <td className={`px-4 py-4 sm:px-6 ${adminTableCellMutedClass}`}>
                      {formatDate(ro.createdAt)}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${repairStatusClass(ro.status)}`}
                      >
                        {ro.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/repair-orders/${ro.id}`)}
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
                <span className="font-semibold text-slate-800">{total}</span> repair orders
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

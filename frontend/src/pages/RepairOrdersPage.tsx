import { useEffect, useState } from 'react'
import { Download, Eye, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  deleteRepairOrder,
  downloadRepairOrderPdf,
  fetchRepairOrders,
  updateRepairOrderStatus,
} from '../api/repairOrders'
import { RepairOrderStatusSelect } from '../components/repairOrders/RepairOrderStatusSelect'
import {
  REPAIR_ORDER_LIST_FILTERS,
  type RepairOrderListFilter,
} from '../constants/repairOrderStatuses'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { RepairOrder, RepairOrderStatus } from '../types/repairOrder'

function filterLabel(filter: RepairOrderListFilter, t: ReturnType<typeof useLanguage>['t']) {
  if (filter === 'active') return t.repairOrders.filterActive
  return t.repairOrders.statuses[filter]
}

export function RepairOrdersPage() {
  const { t, interpolate, formatDate, formatMoney } = useLanguage()
  const { showToast } = useAppConfirm()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RepairOrderListFilter>('active')
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchRepairOrders(query, filter)
        .then((data) => {
          setRepairOrders(data)
          setError(null)
        })
        .catch((err) => {
          logApiError('repair orders list load', err)
          setError(getFriendlyErrorMessage(err, 'load', t))
        })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query, filter, t.repairOrders.errors.loadFailed])

  const handleDelete = async (repairOrder: RepairOrder) => {
    if (
      !window.confirm(
        interpolate(t.repairOrders.confirmDelete, {
          repairOrderNumber: repairOrder.repairOrderNumber,
        }),
      )
    ) {
      return
    }
    setDeletingId(repairOrder.id)
    try {
      await deleteRepairOrder(repairOrder.id)
      setRepairOrders((current) => current.filter((item) => item.id !== repairOrder.id))
    } catch (err) {
      logApiError('repair order delete', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (repairOrder: RepairOrder, nextStatus: RepairOrderStatus) => {
    setUpdatingStatusId(repairOrder.id)
    try {
      const updated = await updateRepairOrderStatus(repairOrder.id, nextStatus)
      const shouldStayVisible =
        filter === 'active'
          ? nextStatus !== 'Completed' && nextStatus !== 'Cancelled'
          : filter === nextStatus

      setRepairOrders((current) => {
        if (!shouldStayVisible) {
          return current.filter((item) => item.id !== updated.id)
        }
        return current.map((item) =>
          item.id === updated.id ? { ...item, status: updated.status } : item,
        )
      })
    } catch (err) {
      logApiError('repair order status update', err)
      showToast('error', getFriendlyErrorMessage(err, 'repairOrderSave', t))
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold text-slate-900">{t.repairOrders.title}</div>
        <Link to="/repair-orders/new" className="btn btn-primary w-full sm:w-auto">
          {t.repairOrders.newRepairOrder}
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="card min-w-0 overflow-hidden">
        <div className="card-body">
          <div className="flex flex-col gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                data-testid="repair-orders-search"
                className="input pl-9"
                placeholder={t.repairOrders.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div
              className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
              data-testid="repair-orders-filters"
              role="tablist"
              aria-label={t.repairOrders.title}
            >
              {REPAIR_ORDER_LIST_FILTERS.map((value) => {
                const selected = filter === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={`repair-orders-filter-${value}`}
                    className={clsx(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm',
                      selected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    )}
                    onClick={() => setFilter(value)}
                  >
                    {filterLabel(value, t)}
                  </button>
                )
              })}
            </div>

            <div className="text-xs font-semibold text-slate-500">
              {interpolate(t.table.resultCount, { count: repairOrders.length })}
            </div>
          </div>

          <div className="table-scroll mt-4">
            <table data-testid="repair-orders-table" className="w-full min-w-[1100px]">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500">
                  <th className="py-2 pr-4">{t.repairOrders.table.repairNumber}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.customer}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.phone}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.device}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.estimate}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.date}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.status}</th>
                  <th className="py-2 pr-4">{t.repairOrders.table.repairCompany}</th>
                  <th className="py-2 pr-4 text-right">{t.repairOrders.table.action}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {repairOrders.map((order) => (
                  <tr key={order.id} data-testid={`repair-order-row-${order.id}`} className="border-t border-slate-200">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">
                      {order.repairOrderNumber}
                    </td>
                    <td className="py-3 pr-4">{order.customerName}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{order.customerPhone}</td>
                    <td className="py-3 pr-4">
                      {[order.brand, order.model].filter(Boolean).join(' ') || order.deviceType}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {formatMoney(Number(order.estimatedPrice ?? 0))}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">{formatDate(order.createdAt.slice(0, 10))}</td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <RepairOrderStatusSelect
                        testId={`repair-order-status-${order.id}`}
                        className="min-w-[10rem]"
                        size="sm"
                        value={order.status}
                        disabled={updatingStatusId === order.id}
                        onChange={(nextStatus) => handleStatusChange(order, nextStatus)}
                      />
                    </td>
                    <td className="max-w-[12rem] py-3 pr-4">
                      {order.repairCompany?.name ? (
                        <div className="truncate text-sm font-medium text-slate-800" title={order.repairCompanyNotes ?? undefined}>
                          {order.repairCompany.name}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">{t.common.dash}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="btn btn-secondary h-8 w-8 p-0"
                          data-testid={`repair-order-view-${order.id}`}
                          to={`/repair-orders/${order.id}`}
                          title={t.table.open}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {order.pdfPath ? (
                          <button
                            type="button"
                            className="btn btn-secondary h-8 w-8 p-0"
                            title={t.table.download}
                            onClick={async () => {
                              try {
                                await downloadRepairOrderPdf(order.id, `${order.repairOrderNumber}.pdf`)
                                showToast('success', t.common.toasts.pdfDownloaded)
                              } catch (err) {
                                logApiError('repair order pdf download', err)
                                showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={deletingId === order.id}
                          className="btn h-8 w-8 p-0 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          title={t.table.delete}
                          onClick={() => handleDelete(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {repairOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                      {t.repairOrders.noResults}
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

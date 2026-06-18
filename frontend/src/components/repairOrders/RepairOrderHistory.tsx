import React, { useState } from 'react'
import type { RepairOrderHistoryEntry, RepairOrderStatus } from '../../types/repairOrder'
import { getActiveTranslations } from '../../i18n/active'

interface RepairOrderHistoryProps {
  history: RepairOrderHistoryEntry[]
  onAddComment: (comment: string) => Promise<void>
}

export function RepairOrderHistory({ history, onAddComment }: RepairOrderHistoryProps) {
  const t = getActiveTranslations()
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError(t.repairOrders.detail.historyCommentEmptyError)
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await onAddComment(comment.trim())
      setComment('')
    } catch (err: any) {
      setError(err?.message || 'Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeClass = (status: RepairOrderStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'Received':
        return 'bg-sky-50 text-sky-700 border border-sky-200'
      case 'InDiagnosis':
        return 'bg-purple-50 text-purple-700 border border-purple-200'
      case 'WaitingForParts':
        return 'bg-orange-50 text-orange-700 border border-orange-200'
      case 'SparePartArrived':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      case 'InRepair':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'Finished':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      case 'ReadyForPickup':
        return 'bg-teal-50 text-teal-700 border border-teal-200'
      case 'Completed':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="card mt-6">
      <h3 className="card-title text-lg font-semibold border-b border-gray-100 pb-3 mb-4">
        {t.repairOrders.detail.historyTitle}
      </h3>

      {history.length === 0 ? (
        <p className="text-gray-500 text-sm italic mb-6">{t.repairOrders.detail.historyNoActivity}</p>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6 mb-6">
          {history.map((entry) => {
            const isStatusChange = entry.fromStatus !== entry.toStatus
            const statusLabel = t.repairOrders.statuses[entry.toStatus]
            const fromStatusLabel = entry.fromStatus ? t.repairOrders.statuses[entry.fromStatus] : null

            return (
              <div key={entry.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-gray-100">
                  <span className={`h-2 w-2 rounded-full ${isStatusChange ? 'bg-amber-500' : 'bg-gray-400'}`} />
                </span>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-1 md:space-y-0">
                  <div>
                    {isStatusChange ? (
                      <span className="text-sm font-medium text-gray-900">
                        {fromStatusLabel
                          ? t.repairOrders.detail.historyStatusChanged
                              .replace('{from}', fromStatusLabel)
                              .replace('{to}', statusLabel)
                          : t.repairOrders.detail.historyStatusSet.replace('{to}', statusLabel)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700">
                        {t.repairOrders.detail.historyCommentAdded}
                      </span>
                    )}

                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded ${getStatusBadgeClass(entry.toStatus)}`}>
                      {statusLabel}
                    </span>

                    {entry.comment && (
                      <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-100/50 max-w-2xl whitespace-pre-wrap">
                        {entry.comment}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 flex flex-col md:items-end">
                    <span className="font-medium text-gray-600">{entry.employeeName}</span>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 mt-4">
        <div>
          <label htmlFor="timeline-comment" className="sr-only">
            {t.repairOrders.detail.historyCommentPlaceholder}
          </label>
          <textarea
            id="timeline-comment"
            rows={2}
            className="input w-full p-3 border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm"
            placeholder={t.repairOrders.detail.historyCommentPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="btn btn-primary text-xs py-1.5 px-3 rounded disabled:opacity-50"
          >
            {isSubmitting ? t.repairOrders.detail.historyAddingComment : t.repairOrders.detail.historyAddCommentBtn}
          </button>
        </div>
      </form>
    </div>
  )
}

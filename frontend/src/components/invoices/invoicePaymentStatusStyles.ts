import clsx from 'clsx'
import type { InvoicePaymentStatus } from '../../types/invoice'

export function invoicePaymentStatusColors(status: InvoicePaymentStatus | null | undefined) {
  switch (status) {
    case 'Draft':
      return 'bg-slate-50 text-slate-700 border-slate-200'
    case 'Open':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Sent':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'Paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'PartiallyPaid':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'Overdue':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export function invoicePaymentStatusBadgeClass(status: InvoicePaymentStatus | null | undefined) {
  return clsx(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
    invoicePaymentStatusColors(status ?? 'Open'),
  )
}

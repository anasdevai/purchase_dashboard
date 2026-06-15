import clsx from 'clsx'
import type { InvoicePaymentStatus } from '../../types/invoice'

export function invoicePaymentStatusColors(status: InvoicePaymentStatus | null | undefined) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Open':
    default:
      return 'bg-orange-50 text-orange-700 border-orange-200'
  }
}

export function invoicePaymentStatusBadgeClass(status: InvoicePaymentStatus | null | undefined) {
  return clsx(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
    invoicePaymentStatusColors(status ?? 'Open'),
  )
}

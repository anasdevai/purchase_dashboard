import { apiRequest, getApiBaseUrl, getToken } from './client'
import { ApiError } from '../utils/apiErrors'
import type { Language } from '../i18n/types'
import type { Invoice, InvoicePayload } from '../types/invoice'
import type { InvoicePaymentStatus } from '../types/invoice'

type InvoiceResponse = { invoice: Invoice }
type InvoiceListResponse = { invoices: Invoice[] }

export async function fetchInvoices(query = '', date = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (date.trim()) params.set('date', date.trim())
  const suffix = params.toString() ? `?${params}` : ''
  const response = await apiRequest<InvoiceListResponse>(`/api/invoices/search${suffix}`)
  return response.invoices
}

export async function fetchInvoice(id: string) {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}`)
  return response.invoice
}

export async function saveInvoice(payload: InvoicePayload, id?: string) {
  const response = await apiRequest<InvoiceResponse>(id ? `/api/invoices/${id}` : '/api/invoices', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(payload),
  })
  return response.invoice
}

export async function createInvoiceFromRepairOrder(repairOrderId: string) {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/from-repair-order/${repairOrderId}`, {
    method: 'POST',
  })
  return response.invoice
}

export async function updateInvoicePaymentStatus(
  id: string,
  paymentStatusOrPayload:
    | InvoicePaymentStatus
    | {
        paymentStatus: InvoicePaymentStatus
        cancellationReason?: string
        paymentDate?: string
        paymentReference?: string
      }
) {
  const body =
    typeof paymentStatusOrPayload === 'string'
      ? { paymentStatus: paymentStatusOrPayload }
      : paymentStatusOrPayload

  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return response.invoice
}

export async function deleteInvoice(id: string) {
  return apiRequest(`/api/invoices/${id}`, { method: 'DELETE' })
}

export async function generateInvoicePdf(id: string, language: Language = 'de') {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/pdf?lang=${language}`, {
    method: 'POST',
  })
  return response.invoice
}

export async function fetchInvoicePdfBlob(id: string, language: Language = 'de') {
  const token = getToken()
  const response = await fetch(`${getApiBaseUrl()}/api/invoices/${id}/pdf?lang=${language}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) {
    console.error('[API error]', response.status, response.url)
    throw new ApiError('PDF download failed', response.status)
  }
  return response.blob()
}

export async function downloadInvoicePdf(id: string, filename: string, language: Language = 'de') {
  const blob = await fetchInvoicePdfBlob(id, language)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function emailInvoicePdf(id: string) {
  return apiRequest<{ success: true }>(`/api/invoices/${id}/email`, {
    method: 'POST',
  })
}

export async function copyInvoice(id: string) {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/copy`, {
    method: 'POST',
  })
  return response.invoice
}

export async function cancelInvoice(id: string, cancellationReason?: string) {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason }),
  })
  return response.invoice
}

export async function sendInvoiceReminder(id: string) {
  return apiRequest<{ success: true }>(`/api/invoices/${id}/reminder`, {
    method: 'POST',
  })
}

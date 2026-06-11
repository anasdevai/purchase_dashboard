import { apiRequest, getApiBaseUrl, getToken } from './client'
import { getActiveTranslations } from '../i18n/active'
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

export async function updateInvoicePaymentStatus(id: string, paymentStatus: InvoicePaymentStatus) {
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
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
    throw new Error(getActiveTranslations().common.friendlyErrors.pdfDownload)
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

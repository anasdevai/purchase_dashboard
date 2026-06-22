import { apiRequest, getApiBaseUrl, getToken } from './client'
import { readStoredLanguage } from '../i18n/active'
import { ApiError } from '../utils/apiErrors'
import type { Language } from '../i18n/types'
import type { Invoice, InvoicePayload } from '../types/invoice'
import type { InvoicePaymentStatus } from '../types/invoice'

type InvoiceResponse = { invoice: Invoice }
type InvoiceListResponse = { invoices: Invoice[] }
type NextInvoiceNumberResponse = { invoiceNumber: string }
type InvoicePrefillResponse = {
  suggestedInvoiceNumber: string
  draft: InvoicePayload
}

const resolveLanguage = (language?: Language) => language ?? readStoredLanguage()

const pdfLanguageHeaders = (language: Language): HeadersInit => ({
  'X-App-Language': language,
})

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

export async function fetchNextInvoiceNumber() {
  const response = await apiRequest<NextInvoiceNumberResponse>('/api/invoices/next-number')
  return response.invoiceNumber
}

export async function fetchInvoicePrefillFromRepairOrder(repairOrderId: string) {
  return apiRequest<InvoicePrefillResponse>(
    `/api/invoices/prefill-from-repair-order/${repairOrderId}`,
  )
}

export async function saveInvoice(payload: InvoicePayload, id?: string, language?: Language) {
  const lang = resolveLanguage(language)
  const langQuery = `?lang=${lang}`
  const response = await apiRequest<InvoiceResponse>(
    id ? `/api/invoices/${id}${langQuery}` : `/api/invoices${langQuery}`,
    {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
      headers: pdfLanguageHeaders(lang),
    },
  )
  return response.invoice
}

export async function createInvoiceFromRepairOrder(
  repairOrderId: string,
  payload: Partial<InvoicePayload> = {},
  language?: Language,
) {
  const lang = resolveLanguage(language)
  const response = await apiRequest<InvoiceResponse>(
    `/api/invoices/from-repair-order/${repairOrderId}?lang=${lang}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: pdfLanguageHeaders(lang),
    },
  )
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

export async function generateInvoicePdf(id: string, language?: Language) {
  const lang = resolveLanguage(language)
  const response = await apiRequest<InvoiceResponse>(`/api/invoices/${id}/pdf?lang=${lang}`, {
    method: 'POST',
    headers: pdfLanguageHeaders(lang),
  })
  return response.invoice
}

export async function fetchInvoicePdfBlob(id: string, language?: Language) {
  const lang = resolveLanguage(language)
  const token = getToken()
  const response = await fetch(`${getApiBaseUrl()}/api/invoices/${id}/pdf?lang=${lang}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...pdfLanguageHeaders(lang),
    },
  })

  if (!response.ok) {
    console.error('[API error]', response.status, response.url)
    throw new ApiError('PDF download failed', response.status)
  }
  return response.blob()
}

export async function downloadInvoicePdf(id: string, filename: string, language?: Language) {
  const lang = resolveLanguage(language)
  const blob = await fetchInvoicePdfBlob(id, lang)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function openInvoicePdf(id: string, language?: Language) {
  const lang = resolveLanguage(language)
  const blob = await fetchInvoicePdfBlob(id, lang)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function emailInvoicePdf(id: string, toEmail?: string) {
  return apiRequest<{ success: true }>(`/api/invoices/${id}/email`, {
    method: 'POST',
    body: toEmail ? JSON.stringify({ toEmail }) : undefined,
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

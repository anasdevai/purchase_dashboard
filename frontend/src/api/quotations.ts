import { apiRequest, getApiBaseUrl, getToken } from './client'
import { getActiveTranslations } from '../i18n/active'
import { ApiError } from '../utils/apiErrors'
import type { Quotation, QuotationPayload, QuotationStatus } from '../types/quotation'
import type { RepairOrder } from '../types/repairOrder'

type QuotationResponse = { quotation: Quotation }
type QuotationListResponse = { quotations: Quotation[] }

export async function fetchQuotations(query = '', status = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (status.trim()) params.set('status', status.trim())
  const suffix = params.toString() ? `?${params}` : ''
  const response = await apiRequest<QuotationListResponse>(`/api/quotations/search${suffix}`)
  return response.quotations
}

export async function fetchQuotation(id: string) {
  try {
    const response = await apiRequest<QuotationResponse>(
      `/api/quotations/${encodeURIComponent(id)}`,
    )
    if (!response?.quotation?.id) {
      throw new ApiError(getActiveTranslations().common.friendlyErrors.generic, 500)
    }
    return response.quotation
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        getActiveTranslations().common.friendlyErrors.generic, // fallback translation
        404,
        error.rawMessage,
        true,
      )
    }
    throw error
  }
}

export async function saveQuotation(payload: QuotationPayload, id?: string) {
  const response = await apiRequest<QuotationResponse>(
    id ? `/api/quotations/${id}` : '/api/quotations',
    {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  if (!response?.quotation?.id) {
    throw new ApiError(getActiveTranslations().common.friendlyErrors.generic, 500)
  }
  return response.quotation
}

export async function updateQuotationStatus(id: string, status: QuotationStatus) {
  const response = await apiRequest<QuotationResponse>(`/api/quotations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return response.quotation
}

export async function deleteQuotation(id: string) {
  return apiRequest(`/api/quotations/${id}`, { method: 'DELETE' })
}

export async function generateQuotationPdf(id: string) {
  const response = await apiRequest<QuotationResponse>(`/api/quotations/${id}/pdf`, {
    method: 'POST',
  })
  return response.quotation
}

export async function fetchQuotationPdfBlob(id: string) {
  const token = getToken()
  const response = await fetch(`${getApiBaseUrl()}/api/quotations/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) {
    console.error('[API error]', response.status, response.url)
    throw new ApiError(getActiveTranslations().common.friendlyErrors.generic, response.status)
  }
  return response.blob()
}

export async function downloadQuotationPdf(id: string, filename: string) {
  const blob = await fetchQuotationPdfBlob(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function emailQuotationPdf(id: string, toEmail?: string) {
  return apiRequest<{ success: true }>(`/api/quotations/${id}/email`, {
    method: 'POST',
    body: JSON.stringify(toEmail ? { toEmail } : {}),
  })
}

export async function copyQuotation(id: string) {
  const response = await apiRequest<QuotationResponse>(`/api/quotations/${id}/copy`, {
    method: 'POST',
  })
  return response.quotation
}

export async function convertToRepairOrder(id: string) {
  const response = await apiRequest<{ repairOrder: RepairOrder }>(`/api/quotations/${id}/convert`, {
    method: 'POST',
  })
  return response.repairOrder
}

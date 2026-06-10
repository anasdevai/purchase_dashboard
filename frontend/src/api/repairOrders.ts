import { apiRequest, getApiBaseUrl, getToken } from './client'
import { getActiveTranslations } from '../i18n/active'
import type { RepairOrder, RepairOrderPayload, RepairOrderStatus } from '../types/repairOrder'

type RepairOrderResponse = { repairOrder: RepairOrder }
type RepairOrderListResponse = { repairOrders: RepairOrder[] }

export async function fetchRepairOrders(query = '', status = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (status.trim()) params.set('status', status.trim())
  const suffix = params.toString() ? `?${params}` : ''
  const response = await apiRequest<RepairOrderListResponse>(`/api/repair-orders/search${suffix}`)
  return response.repairOrders
}

export async function fetchRepairOrder(id: string) {
  const response = await apiRequest<RepairOrderResponse>(`/api/repair-orders/${encodeURIComponent(id)}`)
  if (!response?.repairOrder?.id) {
    throw new Error(getActiveTranslations().repairOrders.errors.loadDetailFailed)
  }
  return response.repairOrder
}

export async function saveRepairOrder(payload: RepairOrderPayload, id?: string) {
  const response = await apiRequest<RepairOrderResponse>(
    id ? `/api/repair-orders/${id}` : '/api/repair-orders',
    {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    },
  )
  if (!response?.repairOrder?.id) {
    throw new Error(getActiveTranslations().repairOrders.errors.saveFailed)
  }
  return response.repairOrder
}

export async function updateRepairOrderStatus(id: string, status: RepairOrderStatus) {
  const response = await apiRequest<RepairOrderResponse>(`/api/repair-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return response.repairOrder
}

export async function deleteRepairOrder(id: string) {
  return apiRequest(`/api/repair-orders/${id}`, { method: 'DELETE' })
}

export async function generateRepairOrderPdf(id: string) {
  const response = await apiRequest<RepairOrderResponse>(`/api/repair-orders/${id}/pdf`, {
    method: 'POST',
  })
  return response.repairOrder
}

export async function fetchRepairOrderPdfBlob(id: string) {
  const token = getToken()
  const response = await fetch(`${getApiBaseUrl()}/api/repair-orders/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) throw new Error(getActiveTranslations().common.errors.pdfFailed)
  return response.blob()
}

export async function downloadRepairOrderPdf(id: string, filename: string) {
  const blob = await fetchRepairOrderPdfBlob(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

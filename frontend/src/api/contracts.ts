import { apiRequest, getApiBaseUrl, getToken } from './client'
import { getActiveTranslations } from '../i18n/active'
import { shopSettingsForPdf, type ShopSettings } from '../services/shopSettings'
import type { ApiContract, Contract, ContractStatus } from '../types/contract'

type ContractListResponse = {
  contracts: ApiContract[]
}

type ContractResponse = {
  contract: ApiContract
}

type CancelContractResponse = {
  deleted: true
  contract: {
    id: string
    contractNumber: string
  }
}

export type DashboardSummary = {
  contractsToday: number
  todayPurchaseTotal: string | number
  currentContracts: number
  draftContracts: number
  repairOrdersToday: number
  readyForPickupCount: number
  paidInvoiceRevenueToday: string | number
  openInvoiceAmount: string | number
  repairRevenueToday: string | number
  recentContracts: ApiContract[]
}

export type ContractDraftPayload = {
  customerName?: string
  customerAddress?: string
  customerPhone?: string
  customerEmail?: string
  customerDateOfBirth?: string
  idDocumentNumber?: string
  deviceType?: string
  brand?: string
  model?: string
  imei?: string
  serialNumber?: string
  storage?: string
  color?: string
  condition?: string
  accessories?: string
  batteryHealth?: string
  damageNotes?: string
  internalNotes?: string
  purchasePrice?: number
  paymentMethod?: string
  ownershipConfirmed?: boolean
  notStolenConfirmed?: boolean
  icloudRemoved?: boolean
  googleLockRemoved?: boolean
  otherLockRemoved?: boolean
  factoryResetConfirmed?: boolean
}

export function contractToDraftPayload(contract: ApiContract): ContractDraftPayload {
  return {
    customerName: contract.customerName ?? undefined,
    customerAddress: contract.customerAddress ?? undefined,
    customerPhone: contract.customerPhone ?? undefined,
    customerEmail: contract.customerEmail ?? undefined,
    customerDateOfBirth: contract.customerDateOfBirth
      ? contract.customerDateOfBirth.slice(0, 10)
      : undefined,
    idDocumentNumber: contract.idDocumentNumber ?? undefined,
    deviceType: contract.deviceType ?? undefined,
    brand: contract.brand ?? undefined,
    model: contract.model ?? undefined,
    imei: contract.imei ?? undefined,
    serialNumber: contract.serialNumber ?? undefined,
    storage: contract.storage ?? undefined,
    color: contract.color ?? undefined,
    condition: contract.condition ?? undefined,
    accessories: contract.accessories ?? undefined,
    batteryHealth: contract.batteryHealth ?? undefined,
    damageNotes: contract.damageNotes ?? undefined,
    internalNotes: contract.internalNotes ?? undefined,
    purchasePrice: contract.purchasePrice ? Number(contract.purchasePrice) : undefined,
    paymentMethod: contract.paymentMethod ?? undefined,
    ownershipConfirmed: contract.ownershipConfirmed,
    notStolenConfirmed: contract.notStolenConfirmed,
    icloudRemoved: contract.icloudRemoved,
    googleLockRemoved: contract.googleLockRemoved,
    otherLockRemoved: contract.otherLockRemoved,
    factoryResetConfirmed: contract.factoryResetConfirmed,
  }
}

function mapStatus(status: ApiContract['status']): ContractStatus {
  if (status === 'Completed') return 'completed'
  if (status === 'Cancelled') return 'cancelled'
  return 'draft'
}

export function mapContract(contract: ApiContract): Contract {
  return {
    id: contract.id,
    contractNumber: contract.contractNumber,
    customerName: contract.customerName || '-',
    device: [contract.brand, contract.model].filter(Boolean).join(' ') || '-',
    imeiOrSerial: contract.imei || contract.serialNumber || '-',
    price: Number(contract.purchasePrice ?? 0),
    dateISO: (contract.createdAt || '').slice(0, 10),
    status: mapStatus(contract.status),
    pdfPath: contract.pdfPath,
  }
}

export async function fetchContracts(query = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  const suffix = params.toString() ? `?${params}` : ''
  const response = await apiRequest<ContractListResponse>(`/api/contracts/search${suffix}`)
  return response.contracts
}

export async function fetchContract(id: string) {
  const response = await apiRequest<ContractResponse>(`/api/contracts/${id}`)
  return response.contract
}

export async function fetchDashboard() {
  const response = await apiRequest<DashboardSummary>('/api/dashboard')
  return {
    ...response,
    contractsToday: Number(response.contractsToday ?? 0),
    todayPurchaseTotal: Number(response.todayPurchaseTotal ?? 0),
    currentContracts: Number(response.currentContracts ?? 0),
    draftContracts: Number(response.draftContracts ?? 0),
    repairOrdersToday: Number(response.repairOrdersToday ?? 0),
    readyForPickupCount: Number(response.readyForPickupCount ?? 0),
    paidInvoiceRevenueToday: Number(response.paidInvoiceRevenueToday ?? 0),
    openInvoiceAmount: Number(response.openInvoiceAmount ?? 0),
    repairRevenueToday: Number(response.repairRevenueToday ?? 0),
    recentContracts: response.recentContracts ?? [],
  }
}

export async function validateDeviceIdentifiers(params: {
  imei?: string
  serialNumber?: string
  excludeId?: string | null
}) {
  const searchParams = new URLSearchParams()
  if (params.imei?.trim()) searchParams.set('imei', params.imei.trim())
  if (params.serialNumber?.trim()) searchParams.set('serialNumber', params.serialNumber.trim())
  if (params.excludeId) searchParams.set('excludeId', params.excludeId)

  const suffix = searchParams.toString() ? `?${searchParams}` : ''
  return apiRequest<{ valid: true }>(`/api/contracts/validate-identifiers${suffix}`)
}

export async function createDraft(payload: ContractDraftPayload) {
  const response = await apiRequest<ContractResponse>('/api/contracts/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.contract
}

export async function updateDraft(id: string, payload: ContractDraftPayload) {
  const response = await apiRequest<ContractResponse>(`/api/contracts/${id}/draft`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.contract
}

export async function uploadContractFile(id: string, fileType: string, file: File) {
  const formData = new FormData()
  formData.append('fileType', fileType)
  formData.append('file', file)
  return apiRequest(`/api/contracts/${id}/files`, {
    method: 'POST',
    body: formData,
  })
}

export async function uploadSignature(
  id: string,
  signature: Blob,
  role: 'customer' | 'shopkeeper' = 'customer',
) {
  const formData = new FormData()
  formData.append('role', role)
  formData.append('signature', signature, 'signature.png')
  return apiRequest(`/api/contracts/${id}/signature`, {
    method: 'POST',
    body: formData,
  })
}

export async function completeContract(
  id: string,
  payload: ContractDraftPayload = {},
  shopSettings?: ShopSettings,
) {
  const response = await apiRequest<ContractResponse>(`/api/contracts/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      ...(shopSettings ? { shopSettings: shopSettingsForPdf(shopSettings) } : {}),
    }),
  })
  return response.contract
}

export async function cancelContract(id: string) {
  const response = await apiRequest<CancelContractResponse>(`/api/contracts/${id}/cancel`, {
    method: 'POST',
  })
  return response.contract
}

export function getPdfUrl(id: string, download = false) {
  const token = getToken()
  const suffix = download ? '/download' : ''
  const query = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${getApiBaseUrl()}/api/contracts/${id}/pdf${suffix}${query}`
}

export async function fetchPdfBlob(id: string) {
  const token = getToken()
  const response = await fetch(`${getApiBaseUrl()}/api/contracts/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) {
    console.error('[API error]', response.status, response.url)
    throw new Error(getActiveTranslations().common.friendlyErrors.pdfDownload)
  }

  return response.blob()
}

export async function downloadPdf(id: string, filename: string) {
  const blob = await fetchPdfBlob(id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

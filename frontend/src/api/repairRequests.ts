import { apiRequest } from './client'

export type RepairRequest = {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deviceBrand: string
  deviceType: string
  deviceModel: string
  repairType: string
  issueDescription: string
  photoPath: string | null
  preferredAppointment: string | null
  status: 'New' | 'Seen' | 'Contacted' | 'Completed'
  createdAt: string
  updatedAt: string
  customerCreatedId: string | null
  repairOrderCreatedId: string | null
}

export type WidgetSettings = {
  shopName: string
  logoDataUrl: string | null
  widgetPrimaryColor: string
  widgetAccentColor: string
  widgetFont: string
  widgetShowLogo: boolean
}

export type PublicBrand = {
  id: string
  name: string
  logoUrl: string | null
  isActive: boolean
}

export type PublicDeviceType = {
  id: string
  name: string
  brandId: string
  isActive: boolean
}

export type PublicModel = {
  id: string
  name: string
  deviceTypeId: string
  brandId: string
  isActive: boolean
}

// Public Widget API Methods
export async function getPublicWidgetSettings(shopId: string) {
  const data = await apiRequest<{ settings: WidgetSettings }>(
    `/api/public/widget/settings?shopId=${encodeURIComponent(shopId)}`,
    { auth: false }
  )
  return data.settings
}

export async function getPublicBrands() {
  const data = await apiRequest<{ brands: PublicBrand[] }>(
    '/api/public/widget/brands',
    { auth: false }
  )
  return data.brands
}

export async function getPublicDeviceTypes(brandId: string) {
  const data = await apiRequest<{ deviceTypes: PublicDeviceType[] }>(
    `/api/public/widget/device-types?brandId=${encodeURIComponent(brandId)}`,
    { auth: false }
  )
  return data.deviceTypes
}

export async function getPublicModels(deviceTypeId: string) {
  const data = await apiRequest<{ models: PublicModel[] }>(
    `/api/public/widget/models?deviceTypeId=${encodeURIComponent(deviceTypeId)}`,
    { auth: false }
  )
  return data.models
}

export async function getPublicRepairTypes() {
  const data = await apiRequest<{ repairTypes: any[] }>(
    '/api/public/widget/repair-types',
    { auth: false }
  )
  return data.repairTypes
}

export async function getPublicRepairPrice(modelId: string, repairTypeId: string) {
  const data = await apiRequest<{ priceInfo: { price: number; duration: number } }>(
    `/api/public/widget/price?modelId=${encodeURIComponent(modelId)}&repairTypeId=${encodeURIComponent(repairTypeId)}`,
    { auth: false }
  )
  return data.priceInfo
}

export async function submitPublicRepairRequest(formData: FormData) {
  const data = await apiRequest<{ success: boolean; request: RepairRequest }>(
    '/api/public/widget/request',
    {
      method: 'POST',
      body: formData,
      auth: false
    }
  )
  return data.request
}

// Authenticated Methods
export async function listRepairRequests(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const data = await apiRequest<{ requests: RepairRequest[] }>(
    `/api/repair-requests${query}`
  )
  return data.requests
}

export async function updateRepairRequestStatus(id: string, status: string) {
  const data = await apiRequest<{ success: boolean; request: RepairRequest }>(
    `/api/repair-requests/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }
  )
  return data.request
}

export async function convertRepairRequestToOrder(id: string) {
  const data = await apiRequest<{ success: boolean; repairOrder: any }>(
    `/api/repair-requests/${encodeURIComponent(id)}/convert`,
    {
      method: 'POST'
    }
  )
  return data.repairOrder
}


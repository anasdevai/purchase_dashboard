import { apiRequest } from './client'

export type RepairOrderOcrData = {
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  deviceType: string
  brand: string
  model: string
  imei: string
  serialNumber: string
  devicePassword: string
  accessories: string
  problemDescription: string
  visibleDamage: string
  technicianNotes: string
  estimatedPrice: number | null
  depositAmount: number | null
  expectedCompletionDate: string
}

export type RepairOrderOcrResult = {
  data: RepairOrderOcrData
  confidence: number
  unclearFields: string[]
}

export async function scanRepairOrderForm(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest<RepairOrderOcrResult>('/api/ocr/repair-order', {
    method: 'POST',
    body: formData,
  })
}

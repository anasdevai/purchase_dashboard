import type { RepairOrderOcrResult } from '../api/ocr'
import type { RepairOrderPayload } from '../types/repairOrder'
import { parseOcrDateToIso } from './ocrDate'

type AccessoryKey =
  | 'charger'
  | 'powerSupply'
  | 'controller'
  | 'cable'
  | 'carryingCase'
  | 'other'

export function mergeOcrIntoRepairOrderForm(
  current: RepairOrderPayload,
  ocr: RepairOrderOcrResult,
  accessoriesState: {
    selected: Set<AccessoryKey>
    otherText: string
  },
  parseAccessories: (value: string) => { selected: Set<AccessoryKey>; otherText: string },
) {
  const { data } = ocr
  const nextForm: RepairOrderPayload = { ...current }

  const assignString = (key: keyof RepairOrderPayload, value: string) => {
    if (!value.trim()) return
    ;(nextForm as Record<string, unknown>)[key] = value.trim()
  }

  assignString('customerName', data.customerName)
  assignString('customerPhone', data.customerPhone)
  assignString('customerEmail', data.customerEmail)
  assignString('customerAddress', data.customerAddress)
  assignString('deviceType', data.deviceType)
  assignString('brand', data.brand)
  assignString('model', data.model)
  assignString('problemDescription', data.problemDescription)
  assignString('visibleDamage', data.visibleDamage)
  assignString('technicianNotes', data.technicianNotes)

  const normalizedDate = parseOcrDateToIso(data.expectedCompletionDate)
  if (normalizedDate) {
    nextForm.expectedCompletionDate = normalizedDate
  }

  assignString('passwordPin', data.devicePassword)

  const imeiOrSerial = [data.imei, data.serialNumber].filter(Boolean).join(' / ')
  assignString('imeiOrSerial', imeiOrSerial)

  if (data.estimatedPrice !== null && data.estimatedPrice !== undefined) {
    nextForm.estimatedPrice = data.estimatedPrice
  }

  if (data.depositAmount !== null && data.depositAmount !== undefined) {
    nextForm.depositAmount = data.depositAmount
  }

  let nextAccessories = accessoriesState
  if (data.accessories.trim()) {
    nextAccessories = parseAccessories(data.accessories)
  }

  return {
    form: nextForm,
    accessoriesState: nextAccessories,
  }
}

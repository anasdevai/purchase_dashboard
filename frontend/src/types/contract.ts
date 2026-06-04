export type ContractStatus = 'completed' | 'draft' | 'cancelled'

export type Contract = {
  id: string
  contractNumber: string
  customerName: string
  device: string
  imeiOrSerial: string
  price: number
  dateISO: string
  status: ContractStatus
  pdfPath?: string | null
}

export type ApiContract = {
  id: string
  contractNumber: string
  customerName: string | null
  customerAddress?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  customerDateOfBirth?: string | null
  idDocumentNumber?: string | null
  deviceType?: string | null
  brand?: string | null
  model: string | null
  imei: string | null
  serialNumber: string | null
  storage?: string | null
  color?: string | null
  condition?: string | null
  accessories?: string | null
  batteryHealth?: string | null
  damageNotes?: string | null
  internalNotes?: string | null
  purchasePrice: string | number | null
  paymentMethod?: string | null
  ownershipConfirmed?: boolean
  notStolenConfirmed?: boolean
  icloudRemoved?: boolean
  googleLockRemoved?: boolean
  otherLockRemoved?: boolean
  factoryResetConfirmed?: boolean
  signaturePath?: string | null
  shopkeeperSignaturePath?: string | null
  pdfPath: string | null
  status: 'Draft' | 'Completed' | 'Cancelled'
  createdAt: string
  updatedAt?: string
  files?: Array<{
    id: string
    fileType: string
    filePath: string
    createdAt: string
  }>
}

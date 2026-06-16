export type RepairOrderStatus =
  | 'Open'
  | 'WorkPending'
  | 'SentToRepairCompany'
  | 'AppointmentScheduled'
  | 'Completed'
  | 'Cancelled'

export type RepairOrder = {
  id: string
  repairOrderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerAddress?: string | null
  deviceType: string
  brand?: string | null
  model: string
  imeiOrSerial?: string | null
  passwordPin?: string | null
  accessoriesReceived?: string | null
  problemDescription: string
  visibleDamage?: string | null
  technicianNotes?: string | null
  estimatedPrice?: string | number | null
  depositAmount?: string | number | null
  expectedCompletionDate?: string | null
  status: RepairOrderStatus
  repairCompanyId?: string | null
  repairCompanyNotes?: string | null
  repairCompany?: {
    id: string
    name: string
    contactInfo?: string | null
    notes?: string | null
  } | null
  pdfPath?: string | null
  createdAt: string
  updatedAt: string
  invoices?: Array<{ id: string; invoiceNumber: string; pdfPath?: string | null }>
}

export type RepairOrderPayload = {
  repairOrderNumber?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  deviceType: string
  brand?: string
  model: string
  imeiOrSerial?: string
  passwordPin?: string
  accessoriesReceived?: string
  problemDescription: string
  visibleDamage?: string
  technicianNotes?: string
  estimatedPrice?: number
  depositAmount?: number
  expectedCompletionDate?: string
  status?: RepairOrderStatus
  repairCompanyId?: string
  repairCompanyNotes?: string
}

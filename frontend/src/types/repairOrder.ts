export type RepairOrderStatus =
  | 'Open'
  | 'WorkPending'
  | 'WaitingForCustomerFeedback'
  | 'SentToRepairCompany'
  | 'AppointmentScheduled'
  | 'SparePartArrived'
  | 'Completed'
  | 'Cancelled'

export type IssueCategory =
  | 'Display'
  | 'Battery'
  | 'WaterDamage'
  | 'Software'
  | 'LogicBoard'
  | 'Camera'
  | 'ChargingPort'
  | 'Keyboard'
  | 'Other'

export type SparePartStatus =
  | 'NotOrdered'
  | 'Ordered'
  | 'Arrived'
  | 'Installed'

export type RepairPaymentMethod =
  | 'Cash'
  | 'DebitCard'
  | 'BankTransfer'
  | 'PayPal'

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
  issueCategory?: IssueCategory | null
  diagnosis?: string | null
  requiredSpareParts?: string | null
  sparePartStatus?: SparePartStatus | null
  visibleDamage?: string | null
  technicianNotes?: string | null
  estimatedPrice?: string | number | null
  discountPercent?: string | number | null
  depositAmount?: string | number | null
  paymentMethod?: RepairPaymentMethod | null
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
  history?: RepairOrderHistoryEntry[]
  assignedEmployeeId?: string | null
  assignedEmployee?: { id: string; name: string; email: string } | null
  customerId?: string | null
  customer?: { id: string; name: string; phone: string; email?: string | null; address?: string | null } | null
}

export type RepairOrderHistoryEntry = {
  id: string
  repairOrderId: string
  userId: string
  employeeName: string
  fromStatus: RepairOrderStatus | null
  toStatus: RepairOrderStatus
  comment: string | null
  createdAt: string
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
  issueCategory?: IssueCategory
  diagnosis?: string
  requiredSpareParts?: string
  sparePartStatus?: SparePartStatus
  visibleDamage?: string
  technicianNotes?: string
  estimatedPrice?: number
  discountPercent?: number
  depositAmount?: number
  paymentMethod?: RepairPaymentMethod
  expectedCompletionDate?: string
  status?: RepairOrderStatus
  repairCompanyId?: string
  repairCompanyNotes?: string
  assignedEmployeeId?: string
  customerId?: string
}

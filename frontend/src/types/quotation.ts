export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'

export type QuotationItem = {
  id: string
  quotationId: string
  repairType: string
  description: string
  unitPrice: string | number
  quantity: string | number
  discount?: string | number | null
  lineTotal: string | number
  createdAt: string
}

export type Quotation = {
  id: string
  quotationNumber: string
  validUntilDate: string
  status: QuotationStatus
  employeeId?: string | null
  employee?: { id: string; name: string; email: string } | null
  customerId?: string | null
  customer?: { id: string; name: string; phone: string; email?: string | null; address?: string | null } | null
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerAddress?: string | null
  deviceType: string
  brand?: string | null
  model: string
  imeiOrSerial?: string | null
  pdfPath?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  items: QuotationItem[]
  repairOrders?: Array<{ id: string; repairOrderNumber: string }>
}

export type QuotationItemPayload = {
  id?: string
  repairType: string
  description: string
  unitPrice: number
  quantity: number
  discount?: number
}

export type QuotationPayload = {
  quotationNumber?: string
  validUntilDate: string
  status?: QuotationStatus
  employeeId?: string
  customerId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  deviceType: string
  brand?: string
  model: string
  imeiOrSerial?: string
  notes?: string
  items: QuotationItemPayload[]
}

export type InvoicePaymentMethod = 'Cash' | 'BankTransfer' | 'Card' | 'PayPal' | 'Other'
export type InvoicePaymentStatus = 'Draft' | 'Open' | 'Sent' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Cancelled'

export type InvoiceItem = {
  id?: string
  description: string
  quantity: string | number
  unitPrice: string | number
  vatPercent: string | number
  lineNet?: string | number
  lineVat?: string | number
  lineTotal?: string | number
}

export type Invoice = {
  id: string
  repairOrderId?: string | null
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  customerAddress?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  customer?: { id: string; email?: string | null; lastName?: string | null; salutation?: string | null } | null
  deviceSummary?: string | null
  repairSummary?: string | null
  paymentMethod?: InvoicePaymentMethod | null
  paymentStatus?: InvoicePaymentStatus | null
  calculatedNetAmount: string | number
  calculatedVatAmount: string | number
  calculatedGrossTotal: string | number
  netAmountOverride?: string | number | null
  vatAmountOverride?: string | number | null
  grossTotalOverride?: string | number | null
  notes?: string | null
  pdfPath?: string | null
  serviceDate?: string | null
  dueDate?: string | null
  paymentDate?: string | null
  paymentReference?: string | null
  cancellationReason?: string | null
  employeeId?: string | null
  employee?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  repairOrder?: { id: string; repairOrderNumber: string } | null
}

export type InvoicePayload = {
  repairOrderId?: string
  invoiceDate?: string
  customerName: string
  customerAddress?: string
  customerPhone?: string
  customerEmail?: string
  deviceSummary?: string
  repairSummary?: string
  paymentMethod?: InvoicePaymentMethod
  paymentStatus?: InvoicePaymentStatus
  notes?: string
  serviceDate?: string
  dueDate?: string
  paymentDate?: string | null
  paymentReference?: string | null
  cancellationReason?: string | null
  employeeId?: string | null
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatPercent: number
  }>
}

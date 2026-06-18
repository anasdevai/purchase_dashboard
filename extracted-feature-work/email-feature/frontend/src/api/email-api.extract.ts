// Original path: frontend/src/api/contracts.ts, invoices.ts, repairOrders.ts
// Extracted: client functions to trigger PDF email send

export async function emailContractPdf(id: string) {
  return apiRequest<{ success: true }>(`/api/contracts/${id}/email`, { method: 'POST' })
}

export async function emailInvoicePdf(id: string) {
  return apiRequest<{ success: true }>(`/api/invoices/${id}/email`, { method: 'POST' })
}

export async function emailRepairOrderPdf(id: string) {
  return apiRequest<{ success: true }>(`/api/repair-orders/${id}/email`, { method: 'POST' })
}

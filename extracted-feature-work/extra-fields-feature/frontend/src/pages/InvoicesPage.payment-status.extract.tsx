// Original path: frontend/src/pages/InvoicesPage.tsx
// Extracted: inline payment status updates on list page

import { updateInvoicePaymentStatus } from '../api/invoices'
import { InvoicePaymentStatusSelect } from '../components/invoices/InvoicePaymentStatusSelect'

const handlePaymentStatusChange = async (invoice: Invoice, paymentStatus: InvoicePaymentStatus) => {
  const updated = await updateInvoicePaymentStatus(invoice.id, paymentStatus)
  // updates local list state
}

// Table column renders InvoicePaymentStatusSelect per row

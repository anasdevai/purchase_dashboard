// Original path: frontend/src/pages/InvoiceDetailPage.tsx
// Extracted: payment status select + notes field + form state

// Form state additions:
paymentStatus: 'Open',
notes: '',

// Mapped from invoice:
paymentStatus: invoice.paymentStatus ?? undefined,
notes: invoice.notes ?? '',

// UI — payment status (edit mode):
<InvoicePaymentStatusSelect
  value={form.paymentStatus ?? ''}
  onChange={(value) => setField('paymentStatus', value)}
/>

// UI — notes section:
<InvoiceCard title={t.invoices.detail.notes}>
  <textarea
    data-testid="invoice-notes"
    placeholder={t.invoices.detail.notesPlaceholder}
    value={form.notes ?? ''}
    onChange={(event) => setField('notes', event.target.value)}
  />
</InvoiceCard>

// Depends on: InvoicePaymentStatusSelect, InvoicePaymentStatusBadge components

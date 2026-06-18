// Original path: frontend/src/pages/InvoiceDetailPage.tsx
// Extracted: send invoice PDF email button + handler

const handleSendEmail = () => {
  if (!invoice || !invoice.customerEmail) return

  confirm({
    title: t.invoices.detail.sendEmailConfirmTitle,
    message: interpolate(t.invoices.detail.sendEmailConfirmMessage, {
      email: invoice.customerEmail,
    }),
    onConfirm: async () => {
      setSendingEmail(true)
      try {
        await emailInvoicePdf(invoice.id)
        showToast('success', t.invoices.detail.emailSentSuccess)
      } catch (err) {
        logApiError('invoice email send', err)
        showToast('error', t.invoices.detail.emailSendFailed)
      } finally {
        setSendingEmail(false)
      }
    },
  })
}

// Button: data-testid="invoice-send-email", disabled when saving/sendingEmail

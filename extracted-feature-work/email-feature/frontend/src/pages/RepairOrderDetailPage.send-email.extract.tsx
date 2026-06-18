// Original path: frontend/src/pages/RepairOrderDetailPage.tsx
// Extracted: send repair order PDF email button + handler

const handleSendEmail = () => {
  if (!repairOrder || !repairOrder.customerEmail) return

  confirm({
    title: t.repairOrders.detail.sendEmailConfirmTitle,
    message: interpolate(t.repairOrders.detail.sendEmailConfirmMessage, {
      email: repairOrder.customerEmail,
    }),
    onConfirm: async () => {
      setSendingEmail(true)
      try {
        await emailRepairOrderPdf(repairOrder.id)
        showToast('success', t.repairOrders.detail.emailSentSuccess)
      } catch (err) {
        logApiError('repair order email send', err)
        showToast('error', t.repairOrders.detail.emailSendFailed)
      } finally {
        setSendingEmail(false)
      }
    },
  })
}

// Button: data-testid="repair-order-action-send-email"

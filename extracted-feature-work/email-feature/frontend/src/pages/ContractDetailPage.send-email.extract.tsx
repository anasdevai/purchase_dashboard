// Original path: frontend/src/pages/ContractDetailPage.tsx
// Extracted: send contract PDF email button + handler

const handleSendEmail = () => {
  if (!apiContract || !apiContract.customerEmail) return

  confirm({
    title: t.contractDetail.sendEmailConfirmTitle,
    message: interpolate(t.contractDetail.sendEmailConfirmMessage, {
      email: apiContract.customerEmail,
    }),
    onConfirm: async () => {
      setSendingEmail(true)
      try {
        await emailContractPdf(apiContract.id)
        showToast('success', t.contractDetail.emailSentSuccess)
      } catch (err) {
        logApiError('contract email send', err)
        showToast('error', t.contractDetail.emailSendFailed)
      } finally {
        setSendingEmail(false)
      }
    },
  })
}

// Button shown when apiContract.customerEmail is set (Mail icon + sendEmailBtn label)

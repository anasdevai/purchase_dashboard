import { useCallback } from 'react'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useLanguage } from '../i18n/LanguageProvider'

export function useDeleteContractConfirm() {
  const { t } = useLanguage()
  const { confirm, showToast } = useAppConfirm()

  const askDeleteContract = useCallback(
    (
      contractNumber: string,
      deleteAction: () => Promise<void>,
      onSuccess?: () => void,
    ) => {
      const message = t.confirmDelete.message.replace('{contractNumber}', contractNumber)

      confirm({
        title: t.confirmDelete.title,
        message,
        cancelLabel: t.confirmDelete.cancel,
        confirmLabel: t.confirmDelete.confirm,
        loadingLabel: t.confirmDelete.deleting,
        variant: 'danger',
        onConfirm: async () => {
          await deleteAction()
          showToast('success', t.confirmDelete.success)
          onSuccess?.()
        },
      })
    },
    [confirm, showToast, t.confirmDelete],
  )

  return { askDeleteContract }
}

import { useLanguage } from '../../i18n/LanguageProvider'
import { Modal, useModalTitleId } from './Modal'

export type AlertModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onClose: () => void
}

export function AlertModal({
  open,
  title,
  message,
  confirmLabel,
  onClose,
}: AlertModalProps) {
  const { t } = useLanguage()
  const titleId = useModalTitleId('alert-modal')
  const resolvedConfirmLabel = confirmLabel ?? t.common.ok

  return (
    <Modal open={open} onClose={onClose} titleId={titleId}>
      <div className="card overflow-hidden shadow-xl">
        <div className="card-body space-y-4 p-5 sm:p-6">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900 sm:text-lg">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary h-11 w-full sm:w-auto" onClick={onClose}>
              {resolvedConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

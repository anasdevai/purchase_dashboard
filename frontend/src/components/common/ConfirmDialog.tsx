import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageProvider'
import { Modal, useModalTitleId } from './Modal'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
  loadingLabel?: string
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  closeOnBackdrop?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  isLoading = false,
  loadingLabel,
  error,
  onConfirm,
  onCancel,
  closeOnBackdrop = true,
}: ConfirmDialogProps) {
  const { t } = useLanguage()
  const titleId = useModalTitleId('confirm-dialog')
  const resolvedConfirmLabel = confirmLabel ?? t.common.confirm
  const resolvedCancelLabel = cancelLabel ?? t.common.cancel
  const resolvedLoadingLabel = loadingLabel ?? t.common.pleaseWait

  return (
    <Modal
      open={open}
      onClose={onCancel}
      titleId={titleId}
      closeOnBackdrop={closeOnBackdrop && !isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="card overflow-hidden shadow-xl">
        <div className="card-body space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {variant === 'danger' ? (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-base font-semibold text-slate-900 sm:text-lg">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-secondary h-11 w-full sm:w-auto"
              disabled={isLoading}
              onClick={onCancel}
            >
              {resolvedCancelLabel}
            </button>
            <button
              type="button"
              className={
                variant === 'danger'
                  ? 'btn h-11 w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60'
                  : 'btn btn-primary h-11 w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60'
              }
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? resolvedLoadingLabel : resolvedConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

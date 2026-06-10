import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../i18n/LanguageProvider'

type ModalProps = {
  open: boolean
  onClose: () => void
  titleId: string
  children: ReactNode
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

export function Modal({
  open,
  onClose,
  titleId,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!open || !closeOnEscape) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeOnEscape, onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t.common.closeDialog}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function useModalTitleId(prefix = 'modal') {
  const reactId = useId()
  return `${prefix}-${reactId.replace(/:/g, '')}`
}

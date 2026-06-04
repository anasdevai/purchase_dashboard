import { CheckCircle2, X, XCircle } from 'lucide-react'
import { createPortal } from 'react-dom'

export type ToastState = {
  type: 'success' | 'error'
  message: string
} | null

type AppToastProps = {
  toast: ToastState
  onDismiss: () => void
}

export function AppToast({ toast, onDismiss }: AppToastProps) {
  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[110] flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        className={
          isSuccess
            ? 'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg ring-1 ring-emerald-100'
            : 'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg ring-1 ring-red-100'
        }
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
        )}
        <p
          className={
            isSuccess
              ? 'min-w-0 flex-1 text-sm font-medium text-emerald-800'
              : 'min-w-0 flex-1 text-sm font-medium text-red-700'
          }
        >
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

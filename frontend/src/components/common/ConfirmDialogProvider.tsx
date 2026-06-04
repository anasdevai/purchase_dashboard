import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AppToast, type ToastState } from './AppToast'
import { AlertModal } from './AlertModal'
import { ConfirmDialog } from './ConfirmDialog'

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void | Promise<void>
}

export type AlertOptions = {
  title: string
  message: string
  confirmLabel?: string
}

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => void
  alert: (options: AlertOptions) => void
  showToast: (type: 'success' | 'error', message: string) => void
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

const TOAST_DURATION_MS = 4000

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null)

  const [toast, setToast] = useState<ToastState>(null)
  const toastTimerRef = useRef<number | null>(null)

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      dismissToast()
      setToast({ type, message })
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimerRef.current = null
      }, TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  const closeConfirm = useCallback(() => {
    if (confirmLoading) return
    setConfirmOpen(false)
    setConfirmError(null)
    setConfirmOptions(null)
  }, [confirmLoading])

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options)
    setConfirmError(null)
    setConfirmOpen(true)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!confirmOptions) return
    setConfirmLoading(true)
    setConfirmError(null)
    try {
      await confirmOptions.onConfirm()
      setConfirmOpen(false)
      setConfirmOptions(null)
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setConfirmLoading(false)
    }
  }, [confirmOptions])

  const alert = useCallback((options: AlertOptions) => {
    setAlertOptions(options)
    setAlertOpen(true)
  }, [])

  const closeAlert = useCallback(() => {
    setAlertOpen(false)
    setAlertOptions(null)
  }, [])

  const value = useMemo(
    () => ({
      confirm,
      alert,
      showToast,
    }),
    [confirm, alert, showToast],
  )

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmOptions?.title ?? ''}
        message={confirmOptions?.message ?? ''}
        confirmLabel={confirmOptions?.confirmLabel}
        cancelLabel={confirmOptions?.cancelLabel}
        loadingLabel={confirmOptions?.loadingLabel}
        variant={confirmOptions?.variant}
        isLoading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
      <AlertModal
        open={alertOpen}
        title={alertOptions?.title ?? ''}
        message={alertOptions?.message ?? ''}
        confirmLabel={alertOptions?.confirmLabel}
        onClose={closeAlert}
      />
      <AppToast toast={toast} onDismiss={dismissToast} />
    </ConfirmDialogContext.Provider>
  )
}

export function useAppConfirm() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useAppConfirm must be used within ConfirmDialogProvider')
  }
  return context
}

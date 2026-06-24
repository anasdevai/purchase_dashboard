import type { ReactNode } from 'react'
import clsx from 'clsx'

type FormActionFooterProps = {
  children: ReactNode
  note?: ReactNode
  className?: string
  testId?: string
  /** Extra bottom spacer when many actions stack on mobile (e.g. invoice PDF actions). */
  tall?: boolean
}

/** Fixed bottom action bar — stays visible while scrolling long forms on every breakpoint. */
export function FormActionFooter({ children, note, className, testId, tall = false }: FormActionFooterProps) {
  return (
    <>
      <div
        className={clsx('form-action-footer-spacer', tall && 'form-action-footer-spacer-tall')}
        aria-hidden="true"
      />
      <div
        data-testid={testId}
        className={clsx(
          'form-action-footer fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3',
          'lg:left-sidebar',
          className,
        )}
      >
        <div
          className={clsx(
            'mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:px-6',
            note ? 'sm:justify-between' : 'sm:justify-end',
          )}
        >
          {note ? <div className="min-w-0 flex-1 text-sm text-slate-500">{note}</div> : null}
          <div className="form-action-footer-actions">{children}</div>
        </div>
      </div>
    </>
  )
}

/** Sticky footer inside scrollable modals and panels. */
export function ModalActionFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'modal-action-footer sticky bottom-0 z-10 flex w-full shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-6 py-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Right-aligned button row for modal footers (secondary left, primary right within the group). */
export function ModalActionFooterGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('modal-action-footer-group', className)}>{children}</div>
}

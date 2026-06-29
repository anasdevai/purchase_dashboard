import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { useMediaQuery } from '../../hooks/useMediaQuery'

type FormActionFooterProps = {
  children: ReactNode
  note?: ReactNode
  className?: string
  testId?: string
  /** Extra bottom spacer when many actions stack on mobile (e.g. invoice PDF actions). */
  tall?: boolean
}

/** True for fields that bring up the on-screen keyboard (so the action bar should yield). */
function isTextEntryElement(el: Element | null): boolean {
  if (!el) return false
  if (el.tagName === 'TEXTAREA') return true
  if ((el as HTMLElement).isContentEditable) return true
  if (el.tagName === 'INPUT') {
    const type = (el as HTMLInputElement).type
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'range', 'color', 'image'].includes(type)
  }
  return false
}

/** Fixed bottom action bar — stays visible while scrolling long forms on every breakpoint. */
export function FormActionFooter({ children, note, className, testId, tall = false }: FormActionFooterProps) {
  const footerRef = useRef<HTMLDivElement>(null)
  const [footerHeight, setFooterHeight] = useState<number | null>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  // Keep the spacer exactly as tall as the (variable height) action bar so the
  // last form fields are never hidden behind it, no matter how many buttons
  // stack on small screens.
  useLayoutEffect(() => {
    const el = footerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => setFooterHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // On phones, hide the bar while a text field is focused (keyboard open) so it
  // can't float over inputs or eat vertical space; it returns as soon as the
  // field is blurred.
  useEffect(() => {
    if (!isMobile) {
      setKeyboardOpen(false)
      return
    }
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null
      if (footerRef.current?.contains(target)) return
      if (isTextEntryElement(target)) setKeyboardOpen(true)
    }
    const onFocusOut = () => {
      // Defer so focus moving between two inputs doesn't flicker the bar.
      window.setTimeout(() => setKeyboardOpen(isTextEntryElement(document.activeElement)), 0)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [isMobile])

  const hidden = isMobile && keyboardOpen

  return (
    <>
      <div
        className={clsx('form-action-footer-spacer', tall && 'form-action-footer-spacer-tall')}
        style={footerHeight != null ? { height: footerHeight } : undefined}
        aria-hidden="true"
      />
      <div
        ref={footerRef}
        data-testid={testId}
        aria-hidden={hidden}
        className={clsx(
          'form-action-footer fixed bottom-0 left-rail right-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3',
          'transition-transform duration-200 ease-out',
          hidden && 'pointer-events-none translate-y-full',
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

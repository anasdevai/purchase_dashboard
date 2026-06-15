import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { InvoicePaymentStatus } from '../../types/invoice'
import { invoicePaymentStatusColors } from './invoicePaymentStatusStyles'

const STATUSES: InvoicePaymentStatus[] = ['Paid', 'Open', 'Cancelled']

type InvoicePaymentStatusSelectProps = {
  value: InvoicePaymentStatus | '' | null | undefined
  onChange: (value: InvoicePaymentStatus | '') => void
  disabled?: boolean
  size?: 'sm' | 'md'
  testId?: string
  className?: string
  allowEmpty?: boolean
  emptyLabel?: string
}

function optionClass(selected: boolean) {
  return clsx(
    'flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50',
    selected ? 'bg-slate-50' : 'bg-white',
  )
}

export function InvoicePaymentStatusSelect(props: InvoicePaymentStatusSelectProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const selectedStatus =
    typeof props.value === 'string' && props.value !== ''
      ? (props.value as InvoicePaymentStatus)
      : null

  const displayLabel = selectedStatus
    ? t.invoices.paymentStatuses[selectedStatus]
    : props.emptyLabel ?? t.invoices.detail.selectStatus

  const sizeClass = props.size === 'md' ? 'h-11 px-3 text-sm' : 'h-8 px-3 text-xs'

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
        zIndex: 50,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (status: InvoicePaymentStatus | '') => {
    props.onChange(status)
    setOpen(false)
  }

  return (
    <div className={clsx('relative', props.className)} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        data-testid={props.testId}
        className={clsx(
          'inline-flex w-full items-center justify-between gap-2 rounded-full border font-semibold transition',
          'disabled:cursor-not-allowed disabled:opacity-60',
          sizeClass,
          selectedStatus
            ? invoicePaymentStatusColors(selectedStatus)
            : 'border-slate-200 bg-white text-slate-700',
        )}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (!props.disabled) setOpen((current) => !current)
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={clsx('h-3.5 w-3.5 shrink-0 opacity-70 transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={menuStyle}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {props.allowEmpty ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={!selectedStatus}
                  className={optionClass(!selectedStatus)}
                  onClick={() => handleSelect('')}
                >
                  {props.emptyLabel ?? t.invoices.detail.selectStatus}
                </button>
              ) : null}
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="option"
                  aria-selected={selectedStatus === status}
                  className={optionClass(selectedStatus === status)}
                  onClick={() => handleSelect(status)}
                >
                  {t.invoices.paymentStatuses[status]}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

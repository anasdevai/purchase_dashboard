import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import { REPAIR_ORDER_STATUSES } from '../../constants/repairOrderStatuses'
import { useFloatingMenu } from '../../hooks/useFloatingMenu'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { RepairOrderStatus } from '../../types/repairOrder'
import { floatingMenuListClass } from '../common/floatingMenuStyles'
import { repairOrderStatusColors } from './repairOrderStatusStyles'

type RepairOrderStatusSelectProps = {
  value: RepairOrderStatus
  onChange: (value: RepairOrderStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  testId?: string
  className?: string
}

function optionClass(selected: boolean) {
  return clsx(
    'flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50',
    selected ? 'bg-slate-50' : 'bg-white',
  )
}

export function RepairOrderStatusSelect(props: RepairOrderStatusSelectProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  // Phones get a bottom sheet; tablet/desktop keep the anchored floating menu.
  const isMobile = useMediaQuery('(max-width: 767px)')
  const menuStyle = useFloatingMenu(open && !isMobile, buttonRef, menuRef)

  const sizeClass = props.size === 'md' ? 'h-11 px-3 text-sm' : 'h-8 px-3 text-xs'

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)

    // On phones the backdrop handles dismissal, so only the anchored menu
    // needs the outside-pointer listener.
    if (!isMobile) {
      const onPointerDown = (event: MouseEvent) => {
        const target = event.target as Node
        if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
        setOpen(false)
      }
      document.addEventListener('mousedown', onPointerDown)
      return () => {
        document.removeEventListener('mousedown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, isMobile])

  // Lock background scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open || !isMobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open, isMobile])

  const handleSelect = (status: RepairOrderStatus) => {
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
          repairOrderStatusColors(props.value),
        )}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (!props.disabled) setOpen((current) => !current)
        }}
      >
        <span className="truncate">{t.repairOrders.statuses[props.value]}</span>
        <ChevronDown
          className={clsx('h-3.5 w-3.5 shrink-0 opacity-70 transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && !isMobile
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={menuStyle}
              className={floatingMenuListClass}
            >
              {REPAIR_ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="option"
                  aria-selected={props.value === status}
                  className={optionClass(props.value === status)}
                  onClick={() => handleSelect(status)}
                >
                  {t.repairOrders.statuses[status]}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}

      {open && isMobile
        ? createPortal(
            <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-slate-900/50"
                aria-hidden
                onClick={() => setOpen(false)}
              />
              <div
                id={listboxId}
                role="listbox"
                aria-label={t.repairOrders.table.status}
                className="relative flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {t.repairOrders.table.status}
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                    aria-label={t.common.cancel}
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  {REPAIR_ORDER_STATUSES.map((status) => {
                    const selected = props.value === status
                    return (
                      <button
                        key={status}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={clsx(
                          'flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition',
                          selected ? 'bg-slate-50' : 'hover:bg-slate-50',
                        )}
                        onClick={() => handleSelect(status)}
                      >
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
                            repairOrderStatusColors(status),
                          )}
                        >
                          {t.repairOrders.statuses[status]}
                        </span>
                        {selected ? (
                          <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

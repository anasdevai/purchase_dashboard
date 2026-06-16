import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { REPAIR_ORDER_STATUSES } from '../../constants/repairOrderStatuses'
import { useFloatingMenu } from '../../hooks/useFloatingMenu'
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
  const menuStyle = useFloatingMenu(open, buttonRef, menuRef)

  const sizeClass = props.size === 'md' ? 'h-11 px-3 text-sm' : 'h-8 px-3 text-xs'

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

      {open
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
    </div>
  )
}

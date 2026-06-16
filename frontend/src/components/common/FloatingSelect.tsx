import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useFloatingMenu } from '../../hooks/useFloatingMenu'
import { floatingMenuListClass } from './floatingMenuStyles'

export type FloatingSelectOption = {
  value: string
  label: string
}

type FloatingSelectProps = {
  value: string
  onChange: (value: string) => void
  options: FloatingSelectOption[]
  disabled?: boolean
  testId?: string
  className?: string
  triggerClassName?: string
  placeholder?: string
  'aria-label'?: string
}

function optionClass(selected: boolean) {
  return clsx(
    'flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50',
    selected ? 'bg-slate-50' : 'bg-white',
  )
}

export function FloatingSelect(props: FloatingSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const menuStyle = useFloatingMenu(open, buttonRef, menuRef)

  const selectedOption = props.options.find((option) => option.value === props.value)
  const displayLabel = selectedOption?.label ?? props.placeholder ?? ''

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

  const handleSelect = (value: string) => {
    props.onChange(value)
    setOpen(false)
  }

  return (
    <div className={clsx('relative', props.className)} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        data-testid={props.testId}
        aria-label={props['aria-label']}
        className={clsx(
          'input inline-flex h-11 w-full items-center justify-between gap-2 text-left',
          props.triggerClassName,
        )}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (!props.disabled) setOpen((current) => !current)
        }}
      >
        <span className={clsx('truncate', !selectedOption && 'text-slate-400')}>{displayLabel}</span>
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-slate-400 transition', open && 'rotate-180')}
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
              {props.options.map((option) => (
                <button
                  key={option.value || '__empty__'}
                  type="button"
                  role="option"
                  aria-selected={props.value === option.value}
                  className={optionClass(props.value === option.value)}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

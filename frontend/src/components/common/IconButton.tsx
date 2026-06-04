import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function IconButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode },
) {
  const { icon, className, ...rest } = props
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        className,
      )}
    >
      {icon}
    </button>
  )
}

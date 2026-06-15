import type { ReactNode } from 'react'
import clsx from 'clsx'

export function StatCard(props: {
  icon: ReactNode
  title: string
  value: string
  subtext?: string
  subtextTone?: 'up' | 'neutral' | 'warning'
  testId?: string
  layout?: 'horizontal' | 'stacked'
}) {
  const layout = props.layout ?? 'horizontal'
  const subtextTone =
    props.subtextTone === 'up'
      ? 'text-emerald-600'
      : props.subtextTone === 'warning'
        ? 'text-orange-600'
        : 'text-slate-400'

  if (layout === 'stacked') {
    return (
      <div className="card h-full" data-testid={props.testId}>
        <div className="flex h-full min-h-[9.5rem] flex-col p-4 sm:min-h-[10rem] sm:p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
            {props.icon}
          </div>

          <p className="mt-3 min-h-[2.25rem] text-[11px] font-semibold leading-snug tracking-wide text-slate-500 sm:text-xs">
            {props.title}
          </p>

          <p
            className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-2xl"
            data-testid={props.testId ? `${props.testId}-value` : undefined}
            title={props.value}
          >
            {props.value}
          </p>

          <div className="flex-1" />

          {props.subtext ? (
            <p className={clsx('mt-2 min-h-[1rem] text-[11px] leading-snug', subtextTone)}>
              {props.subtext}
            </p>
          ) : (
            <div className="min-h-[1rem]" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full" data-testid={props.testId}>
      <div className="flex h-full min-h-[6.5rem] items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-100 sm:h-11 sm:w-11">
          {props.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="min-h-[1rem] text-[11px] font-semibold leading-snug text-slate-500 sm:min-h-[2.25rem] sm:text-xs">
            {props.title}
          </p>
          <p
            className="mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-2xl"
            data-testid={props.testId ? `${props.testId}-value` : undefined}
            title={props.value}
          >
            {props.value}
          </p>
          {props.subtext ? (
            <p className={clsx('mt-1 min-h-[1rem] text-[11px] leading-snug sm:text-xs', subtextTone)}>
              {props.subtext}
            </p>
          ) : (
            <div className="min-h-[1rem]" />
          )}
        </div>
      </div>
    </div>
  )
}

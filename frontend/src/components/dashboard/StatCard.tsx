import type { ReactNode } from 'react'

export function StatCard(props: {
  icon: ReactNode
  title: string
  value: string
  subtext?: string
  subtextTone?: 'up' | 'neutral'
}) {
  const tone =
    props.subtextTone === 'up'
      ? 'text-emerald-600'
      : props.subtextTone === 'neutral'
        ? 'text-slate-500'
        : 'text-slate-500'

  return (
    <div className="card">
      <div className="flex items-start gap-4 p-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {props.value}
          </div>
          {props.subtext ? (
            <div className={`mt-1 text-xs font-medium ${tone}`}>
              {props.subtext}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

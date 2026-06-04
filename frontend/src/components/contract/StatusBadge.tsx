import clsx from 'clsx'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { ContractStatus } from '../../types/contract'

export function StatusBadge(props: { status: ContractStatus }) {
  const { t } = useLanguage()

  const label =
    props.status === 'completed'
      ? t.status.completed
      : props.status === 'draft'
        ? t.status.draft
        : t.status.cancelled

  const classes = clsx(
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
    props.status === 'completed' &&
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    props.status === 'draft' &&
      'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    props.status === 'cancelled' &&
      'bg-red-50 text-red-700 ring-1 ring-red-100',
  )

  return <span className={classes}>{label}</span>
}

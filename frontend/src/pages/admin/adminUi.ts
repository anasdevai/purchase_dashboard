/** Shared light-theme styles for admin pages (matches main app). */

export const adminBackLinkClass =
  'group mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800'

export const adminPageTitleClass = 'text-xl font-semibold text-slate-900 sm:text-2xl'

export const adminPageSubtitleClass = 'mt-1 text-sm text-slate-500'

export const adminTableHeadClass =
  'border-b border-slate-200 bg-slate-50/50 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:px-6'

export const adminTableRowClass = 'transition hover:bg-slate-50'

export const adminEmptyStateClass = 'card flex flex-col items-center justify-center py-16 text-center'

export const adminErrorStateClass =
  'rounded-lg border border-red-100 bg-red-50 px-6 py-5 text-center text-sm font-medium text-red-700'

export const adminLoadingSpinnerClass =
  'h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary'

export const adminLoadingTextClass = 'text-xs font-medium text-slate-500'

export const adminStatusBadge = {
  active: 'inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700',
  inactive: 'inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700',
  admin: 'inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700',
  staff: 'inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700',
} as const

export const adminAlertClass = {
  success: 'rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700',
  error: 'rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700',
} as const

export const adminIconButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'

export const adminPaginationFooterClass =
  'flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'

export const adminPaginationTextClass = 'text-xs text-slate-500'

export const adminTableCellPrimaryClass = 'text-sm font-semibold text-slate-800'

export const adminTableCellSecondaryClass = 'text-[11px] text-slate-500'

export const adminTableCellMutedClass = 'text-xs text-slate-500'

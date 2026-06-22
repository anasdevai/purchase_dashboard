import { Menu, Shield } from 'lucide-react'
import { useLayout } from '../../app/layout/LayoutContext'
import { useLanguage } from '../../i18n/LanguageProvider'

export function AdminTopbar() {
  const { toggleSidebar } = useLayout()
  const { t } = useLanguage()

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white lg:hidden">
      <div className="flex h-14 min-w-0 items-center gap-3 px-3 sm:h-16 sm:px-4">
        <button
          type="button"
          data-testid="admin-topbar-menu-toggle"
          onClick={toggleSidebar}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-50"
          aria-label={t.common.openMenu}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Admin Panel</p>
            <p className="truncate text-[10px] font-medium text-slate-500">Management Console</p>
          </div>
        </div>
      </div>
    </header>
  )
}

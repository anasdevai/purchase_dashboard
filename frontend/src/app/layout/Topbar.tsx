import { Bell, LogOut, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { toggleSidebar } = useLayout()

  const title =
    pathname === '/dashboard'
      ? t.pages.dashboard
      : pathname === '/contracts/new'
        ? t.pages.newContract
        : pathname === '/contracts'
          ? t.pages.contracts
          : pathname === '/contracts/search'
            ? t.pages.searchContracts
            : pathname.startsWith('/contracts/')
              ? t.pages.contractDetail
              : pathname === '/settings'
                ? t.pages.settings
                : t.pages.dashboard

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label={t.common.openMenu}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
          {title}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label={t.topbar.notifications}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label={t.nav.logout}
          >
            <LogOut className="h-4 w-4" />
          </button>

          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 md:hidden" />

          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300" />
            <div className="hidden min-w-0 leading-tight lg:block">
              <div className="truncate text-sm font-semibold text-slate-900">
                {user?.name ?? t.common.defaultStaffUser}
              </div>
              <div className="text-xs text-slate-500">{t.topbar.roleAdmin}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

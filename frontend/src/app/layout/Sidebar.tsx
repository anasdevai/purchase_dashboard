import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'

function SidebarNav(props: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useLanguage()
  const { onNavigate } = props

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { to: '/contracts/new', label: t.nav.newContract, icon: PlusSquare },
    { to: '/contracts', label: t.nav.contracts, icon: FileText },
    { to: '/contracts/search', label: t.nav.searchContracts, icon: Search },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ]

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white shadow-sm">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white">
            {t.app.nameLine1}
          </div>
          <div className="truncate text-sm font-semibold text-white">
            {t.app.nameLine2}
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 px-3 pb-4 pt-2">
        <button
          type="button"
          onClick={() => {
            logout()
            onNavigate?.()
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="truncate">{t.nav.logout}</span>
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useLayout()
  const closeDrawer = () => setSidebarOpen(false)

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-screen w-sidebar max-w-[min(260px,85vw)] flex-col bg-sidebar text-white transition-transform duration-300 ease-in-out lg:z-30 lg:max-w-none lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-3 lg:hidden">
          <button
            type="button"
            onClick={closeDrawer}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/90 hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav onNavigate={closeDrawer} />
      </aside>
    </>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ArrowLeft,
  Shield,
  LogOut,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from '../../app/layout/LayoutContext'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'

function AdminSidebarNav(props: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { onNavigate } = props

  const adminNavItems = [
    { to: '/admin/dashboard', label: t.admin.dashboard, icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t.admin.manageUsers, icon: Users, end: true },
    { to: '/admin/users/new', label: t.admin.addUser, icon: UserPlus, end: true },
  ]

  return (
    <>
      <div className="flex shrink-0 flex-col items-center border-b border-white/10 px-5 pb-5 pt-4 text-center w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="text-left leading-tight">
            <h1 className="text-sm font-bold text-white tracking-tight">{t.admin.panelTitle}</h1>
            <p className="text-[10px] text-white/50 font-medium">{t.admin.panelSubtitle}</p>
          </div>
        </div>
      </div>

      <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/45">
          {t.admin.navigation}
        </p>
        <ul className="space-y-0.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/90 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-sky-300"
                          aria-hidden
                        />
                      )}
                      <Icon
                        className={clsx(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-white/70 group-hover:text-white',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 pb-4 pt-3 space-y-1">
        <div className="px-3 py-2">
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white/5 border border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white shadow-inner">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white/95">{user?.name}</p>
            <p className="truncate text-[10px] text-white/55 font-medium">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            navigate('/dashboard')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 shrink-0 text-white/70" />
          <span>{t.admin.backToApp}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            logout()
            onNavigate?.()
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-5 w-5 shrink-0 text-white/70" />
          <span>{t.admin.logout}</span>
        </button>
      </div>
    </>
  )
}

export function AdminSidebar() {
  const { t } = useLanguage()
  const { sidebarOpen, setSidebarOpen } = useLayout()
  const closeDrawer = () => setSidebarOpen(false)

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          data-testid="admin-sidebar-overlay"
          aria-label={t.common.closeMenu}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      <aside
        data-testid="admin-sidebar"
        className={clsx(
          'app-viewport fixed left-0 top-0 z-50 flex h-screen w-sidebar max-w-[min(260px,85vw)] flex-col bg-sidebar pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] text-white shadow-md transition-transform duration-300 ease-in-out md:pb-0 lg:z-30 lg:max-w-none lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-3 lg:hidden">
          <button
            type="button"
            data-testid="admin-sidebar-close"
            onClick={closeDrawer}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/90 hover:bg-white/10"
            aria-label={t.common.closeMenu}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AdminSidebarNav onNavigate={closeDrawer} />
      </aside>
    </>
  )
}

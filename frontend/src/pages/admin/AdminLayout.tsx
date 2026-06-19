import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ArrowLeft,
  Shield,
  LogOut,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../auth/AuthContext'

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: Users, end: true },
  { to: '/admin/users/new', label: 'Add User', icon: UserPlus, end: true },
  { to: '/admin/master-data', label: 'Master Data', icon: Settings, end: false },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-white shadow-md">
        {/* Logo / Title */}
        <div className="flex shrink-0 flex-col items-center border-b border-white/10 px-5 py-5 text-center w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <h1 className="text-sm font-bold text-white tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-white/50 font-medium">Management Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
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
                          <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-sky-300" aria-hidden />
                        )}
                        <Icon
                          className={clsx(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-white/70 group-hover:text-white',
                          )}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 px-3 pb-4 pt-3 space-y-1">
          {/* Current user */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white/5 border border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/95">{user?.name}</p>
              <p className="truncate text-[10px] text-white/55 font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Back to app */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 shrink-0 text-white/70" />
            <span>Back to App</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="h-5 w-5 shrink-0 text-white/70" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen bg-slate-50 text-slate-700">
        <Outlet />
      </main>
    </div>
  )
}

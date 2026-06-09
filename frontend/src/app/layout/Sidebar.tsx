import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  ReceiptText,
  Search,
  Settings,
  Wrench,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'

const LOGO_SRC = '/company_logo.png'

function SidebarNav(props: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useLanguage()
  const { onNavigate } = props

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, testId: 'nav-dashboard' },
    { to: '/contracts/new', label: t.nav.newContract, icon: PlusSquare, testId: 'nav-new-contract' },
    { to: '/contracts', label: t.nav.contracts, icon: FileText, testId: 'nav-contracts' },
    { to: '/contracts/search', label: t.nav.searchContracts, icon: Search, testId: 'nav-search-contracts' },
    { to: '/repair-orders/new', label: t.nav.newRepairOrder, icon: Wrench, testId: 'nav-new-repair-order' },
    { to: '/repair-orders', label: t.nav.repairOrders, icon: Wrench, testId: 'nav-repair-orders' },
    { to: '/invoices/new', label: t.nav.newInvoice, icon: ReceiptText, testId: 'nav-new-invoice' },
    { to: '/invoices', label: t.nav.invoices, icon: ReceiptText, testId: 'nav-invoices' },
    { to: '/settings', label: t.nav.settings, icon: Settings, testId: 'nav-settings' },
  ]

  return (
    <>
      <div className="flex shrink-0 flex-col items-center border-b border-white/10 px-5 pb-5 pt-4 text-center">
        <img
          src={LOGO_SRC}
          alt=""
          className="h-[72px] w-auto max-w-[180px] object-contain mix-blend-screen"
        />
        <p className="mt-3 text-[11px] font-medium leading-snug text-white/90">
          {t.app.nameLine1} {t.app.nameLine2}
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, testId }) => (
            <li key={to}>
              <NavLink
                to={to}
                data-testid={testId}
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
          data-testid="nav-logout"
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
  const { t } = useLanguage()
  const { sidebarOpen, setSidebarOpen } = useLayout()
  const closeDrawer = () => setSidebarOpen(false)

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          data-testid="sidebar-overlay"
          aria-label={t.common.closeMenu}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={closeDrawer}
        />
      ) : null}

      <aside
        data-testid="sidebar"
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-screen w-sidebar max-w-[min(260px,85vw)] flex-col bg-sidebar text-white transition-transform duration-300 ease-in-out lg:z-30 lg:max-w-none lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-3 lg:hidden">
          <button
            type="button"
            data-testid="sidebar-close"
            onClick={closeDrawer}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/90 hover:bg-white/10"
            aria-label={t.common.closeMenu}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav onNavigate={closeDrawer} />
      </aside>
    </>
  )
}

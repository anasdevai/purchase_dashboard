import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  Shield,
  X,
  Mail,
  Users,
  Calendar,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'
import { fetchDashboard } from '../../api/contracts'

const LOGO_SRC = '/assets/sclera-logo.png'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  testId: string
  end?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

function SidebarNavLink(props: {
  item: NavItem
  badgeCount?: number
  onNavigate?: () => void
}) {
  const { item, badgeCount, onNavigate } = props
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        data-testid={item.testId}
        onClick={onNavigate}
        className={({ isActive }) =>
          clsx(
            'relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm font-medium transition',
            isActive
              ? 'bg-white/15 text-white'
              : 'text-white/90 hover:bg-white/10 hover:text-white',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <span
                className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-sky-300"
                aria-hidden
              />
            ) : null}
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
            {badgeCount !== undefined && badgeCount > 0 ? (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900 animate-pulse">
                {badgeCount}
              </span>
            ) : null}
          </>
        )}
      </NavLink>
    </li>
  )
}

function SidebarNav(props: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { onNavigate } = props

  const [readyForPickupCount, setReadyForPickupCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let alive = true

    const fetchCount = () => {
      void fetchDashboard()
        .then((summary) => {
          if (alive) setReadyForPickupCount(summary.readyForPickupCount)
        })
        .catch((err) => console.error('Failed to fetch ready-for-pickup count', err))
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [user])

  const sections: NavSection[] = [
    {
      title: t.nav.sections.overview,
      items: [
        { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, testId: 'nav-dashboard' },
        {
          to: '/customers',
          label: t.pages.settings === 'Einstellungen' ? 'Kunden' : 'Customers',
          icon: Users,
          testId: 'nav-customers',
        },
        {
          to: '/calendar',
          label: t.pages.settings === 'Einstellungen' ? 'Kalender' : 'Calendar',
          icon: Calendar,
          testId: 'nav-calendar',
        },
        {
          to: '/contracts/search',
          label: t.nav.searchContracts,
          icon: Search,
          testId: 'nav-search-contracts',
        },
      ],
    },
    {
      title: t.nav.sections.contract,
      items: [
        {
          to: '/contracts/new',
          label: t.nav.newContract,
          icon: PlusSquare,
          testId: 'nav-new-contract',
        },
        {
          to: '/contracts',
          label: t.nav.contracts,
          icon: FileText,
          testId: 'nav-contracts',
          end: true,
        },
      ],
    },
    {
      title: t.nav.sections.repairOrders,
      items: [
        {
          to: '/repair-orders/new',
          label: t.nav.newRepairOrder,
          icon: PlusSquare,
          testId: 'nav-new-repair-order',
        },
        {
          to: '/repair-orders',
          label: t.nav.repairOrders,
          icon: FileText,
          testId: 'nav-repair-orders',
          end: true,
        },
      ],
    },
    {
      title: t.nav.sections.quotations,
      items: [
        {
          to: '/quotations/new',
          label: t.nav.newQuotation,
          icon: PlusSquare,
          testId: 'nav-new-quotation',
        },
        {
          to: '/quotations',
          label: t.nav.quotations,
          icon: FileText,
          testId: 'nav-quotations',
          end: true,
        },
      ],
    },
    {
      title: t.nav.sections.invoices,
      items: [
        {
          to: '/invoices/new',
          label: t.nav.newInvoice,
          icon: PlusSquare,
          testId: 'nav-new-invoice',
        },
        {
          to: '/invoices',
          label: t.nav.invoices,
          icon: FileText,
          testId: 'nav-invoices',
          end: true,
        },
      ],
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: 'Admin Panel',
            items: [
              {
                to: '/admin/dashboard',
                label: 'Admin Dashboard',
                icon: Shield,
                testId: 'nav-admin-dashboard',
              },
            ],
          },
        ]
      : []),
    {
      title: t.nav.sections.settings,
      items: [
        {
          to: '/settings',
          label: t.nav.settings,
          icon: Settings,
          testId: 'nav-settings',
          end: true,
        },
        {
          to: '/email-logs',
          label: t.pages.settings === 'Einstellungen' ? 'E-Mail-Protokolle' : 'Email Logs',
          icon: Mail,
          testId: 'nav-email-logs',
          end: true,
        },
      ],
    },
  ]

  return (
    <>
      <div className="flex shrink-0 flex-col items-center border-b border-white/10 px-5 pb-5 pt-4 text-center">
        <div className="flex h-[64px] w-full max-w-[200px] items-center justify-center overflow-hidden">
          <img
            src={LOGO_SRC}
            alt="Sclera"
            className="w-full cursor-pointer object-contain invert transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03]"
          />
        </div>
        <p className="mt-3 text-[11px] font-medium leading-snug text-white/90">
          {t.app.nameLine1} {t.app.nameLine2}
        </p>
      </div>

      <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, sectionIndex) => (
          <div key={section.title}>
            {sectionIndex > 0 ? <div className="my-3 border-t border-white/15" aria-hidden /> : null}
            <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavLink
                  key={item.to}
                  item={item}
                  badgeCount={item.to === '/repair-orders' ? readyForPickupCount : undefined}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 pb-4 pt-3">
        <button
          type="button"
          data-testid="nav-logout"
          onClick={() => {
            logout()
            onNavigate?.()
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
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
          'app-viewport fixed left-0 top-0 z-50 flex h-screen w-sidebar max-w-[min(260px,85vw)] flex-col bg-sidebar pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] text-white transition-transform duration-300 ease-in-out md:pb-0 lg:z-30 lg:max-w-none lg:translate-x-0',
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

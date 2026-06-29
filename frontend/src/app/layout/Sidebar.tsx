import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'
import { fetchRepairOrders } from '../../api/repairOrders'

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

const LOGO_SRC = '/assets/sclera-logo-new.png'
const ICON_DASHBOARD = '/assets/icon-dashboard.svg'
const ICON_REQUESTS = '/assets/icon-requests.svg'
const ICON_CUSTOMERS = '/assets/icon-customers.svg'
const ICON_CALENDAR = '/assets/icon-calendar.svg'
const ICON_SEARCH = '/assets/icon-search.svg'
const ICON_PLUS = '/assets/icon-plus.svg'
const ICON_CONTRACT = '/assets/icon-contract.svg'
const ICON_REPAIR = '/assets/icon-repair.svg'
const ICON_QUOTES = '/assets/icon-quotes.svg'
const ICON_INVOICE = '/assets/icon-invoice.svg'
const ICON_INVENTORY = '/assets/icon-inventory.svg'
const ICON_ADMIN = '/assets/icon-admin.svg'
const ICON_SETTINGS = '/assets/icon-settings.svg'
const ICON_MAIL = '/assets/icon-mail.svg'
const ICON_LOGOUT = '/assets/icon-logout.svg'

type NavItem = {
  to: string
  label: string
  icon: string
  testId: string
  end?: boolean
  badge?: number
  /** Hidden in the collapsed (icons-only) rail to keep it a clean preview; still shown when expanded and on mobile. */
  collapsedHidden?: boolean
}

type NavSection = {
  id: string
  label: string
  items: NavItem[]
}

/* ------------------------------------------------------------------ */
/* Single navigation row                                               */
/* ------------------------------------------------------------------ */

function NavRow({
  item,
  expanded,
  onNavigate,
}: {
  item: NavItem
  expanded: boolean
  onNavigate: () => void
}) {
  const hasBadge = typeof item.badge === 'number' && item.badge > 0

  return (
    <li className={clsx('relative w-full', item.collapsedHidden && !expanded && 'lg:hidden')}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        data-testid={item.testId}
        title={item.label}
        aria-label={item.label}
        className={({ isActive }) =>
          clsx(
            'group relative flex h-[52px] items-center gap-3 rounded-xl px-3 transition',
            !expanded && 'lg:justify-center lg:gap-0 lg:px-0',
            !isActive && 'hover:bg-white/10',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active visuals */}
            {isActive && (
              <>
                {/* Compact (collapsed desktop) "bridge" tile that merges into the content area */}
                <span
                  className={clsx(
                    'pointer-events-none absolute inset-y-[6px] left-2 right-0 z-0 rounded-l-[20px] bg-app-bg',
                    expanded ? 'hidden' : 'hidden lg:block',
                  )}
                />
                {/* Expanded / mobile highlight tile */}
                <span
                  className={clsx(
                    'pointer-events-none absolute inset-0 z-0 rounded-xl bg-white/12',
                    expanded ? 'block' : 'lg:hidden',
                  )}
                />
                {/* Accent bar on the far-left edge (both states) */}
                <span className="pointer-events-none absolute left-0 top-1/2 z-0 h-7 w-[5px] -translate-y-1/2 rounded-r-full bg-[#8FC7F2]" />
              </>
            )}

            <img
              src={item.icon}
              alt=""
              className={clsx(
                'relative z-10 h-6 w-6 shrink-0 transition',
                isActive
                  ? clsx('brightness-0 invert', !expanded && 'lg:invert-0')
                  : 'brightness-0 invert opacity-60 group-hover:opacity-100',
              )}
            />

            <span
              className={clsx(
                'relative z-10 min-w-0 flex-1 truncate text-sm transition',
                isActive ? 'font-semibold text-white' : 'font-medium text-white/80',
                !expanded && 'lg:hidden',
              )}
            >
              {item.label}
            </span>

            {/* Badge — inline at row end when labels are visible */}
            {hasBadge && (
              <span
                className={clsx(
                  'relative z-10 ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-900',
                  !expanded && 'lg:hidden',
                )}
              >
                {item.badge}
              </span>
            )}
            {/* Badge — small overlay dot on the icon when collapsed (desktop only) */}
            {hasBadge && (
              <span
                className={clsx(
                  'absolute right-4 top-1.5 z-20 h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900',
                  expanded ? 'hidden' : 'hidden lg:inline-flex',
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { t, language } = useLanguage()
  const de = language === 'de'
  const { sidebarOpen, setSidebarOpen, sidebarExpanded, toggleSidebarExpanded } = useLayout()

  const [sparePartArrivedCount, setSparePartArrivedCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let alive = true
    const fetchCount = () => {
      void fetchRepairOrders('', 'SparePartArrived')
        .then((orders) => {
          if (alive) setSparePartArrivedCount(orders.length)
        })
        .catch((err) => console.error('Failed to fetch SparePartArrived count', err))
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [user])

  const closeDrawer = () => setSidebarOpen(false)

  const sections: NavSection[] = [
    {
      id: 'overview',
      label: t.nav.sections.overview,
      items: [
        { to: '/dashboard', label: t.nav.dashboard, icon: ICON_DASHBOARD, testId: 'nav-dashboard' },
        {
          to: '/repair-requests',
          label: de ? 'Website-Anfragen' : 'Website Requests',
          icon: ICON_REQUESTS,
          testId: 'nav-repair-requests',
          end: true,
        },
        { to: '/customers', label: t.nav.customers, icon: ICON_CUSTOMERS, testId: 'nav-customers', end: true },
        { to: '/calendar', label: t.nav.calendar, icon: ICON_CALENDAR, testId: 'nav-calendar', end: true },
      ],
    },
    {
      id: 'contracts',
      label: t.nav.sections.contract,
      items: [
        { to: '/contracts/search', label: t.nav.searchContracts, icon: ICON_SEARCH, testId: 'nav-search-contracts', end: true },
        { to: '/contracts/new', label: t.nav.newContract, icon: ICON_PLUS, testId: 'nav-new-contract', end: true, collapsedHidden: true },
        { to: '/contracts', label: t.nav.contracts, icon: ICON_CONTRACT, testId: 'nav-contracts', end: true },
      ],
    },
    {
      id: 'repair-orders',
      label: t.nav.sections.repairOrders,
      items: [
        { to: '/repair-orders/new', label: t.nav.newRepairOrder, icon: ICON_PLUS, testId: 'nav-new-repair-order', end: true, collapsedHidden: true },
        {
          to: '/repair-orders',
          label: t.nav.repairOrders,
          icon: ICON_REPAIR,
          testId: 'nav-repair-orders',
          end: true,
          badge: sparePartArrivedCount,
        },
      ],
    },
    {
      id: 'quotations',
      label: t.nav.sections.quotations,
      items: [
        { to: '/quotations/new', label: t.nav.newQuotation, icon: ICON_PLUS, testId: 'nav-new-quotation', end: true, collapsedHidden: true },
        { to: '/quotations', label: t.nav.quotations, icon: ICON_QUOTES, testId: 'nav-quotations', end: true },
      ],
    },
    {
      id: 'invoices',
      label: t.nav.sections.invoices,
      items: [
        { to: '/invoices/new', label: t.nav.newInvoice, icon: ICON_PLUS, testId: 'nav-new-invoice', end: true, collapsedHidden: true },
        { to: '/invoices', label: t.nav.invoices, icon: ICON_INVOICE, testId: 'nav-invoices', end: true },
      ],
    },
    {
      id: 'inventory',
      label: t.nav.inventorySection,
      items: [
        { to: '/inventory', label: t.nav.inventory, icon: ICON_INVENTORY, testId: 'nav-inventory' },
      ],
    },
    {
      id: 'system',
      label: de ? 'System' : 'System',
      items: [
        ...(user?.role === 'admin'
          ? [
              {
                to: '/admin/dashboard',
                label: t.nav.adminDashboard,
                icon: ICON_ADMIN,
                testId: 'nav-admin-dashboard',
              } as NavItem,
            ]
          : []),
        { to: '/settings', label: t.nav.settings, icon: ICON_SETTINGS, testId: 'nav-settings', end: true },
        { to: '/email-logs', label: t.nav.emailLogs, icon: ICON_MAIL, testId: 'nav-email-logs', end: true },
      ],
    },
  ]

  const collapseLabel = t.common.closeMenu

  return (
    <>
      {/* Mobile drawer backdrop */}
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
          'fixed left-0 top-0 z-50 flex h-screen flex-col overflow-x-hidden rounded-tr-[28px] rounded-br-[28px] bg-[#322960] py-6 text-white',
          'w-[264px] max-w-[85vw] transition-[width,transform] duration-300 ease-in-out',
          sidebarExpanded ? 'lg:w-[264px]' : 'lg:w-[103px]',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header / logo */}
        <div
          className={clsx(
            'mb-4 flex shrink-0 items-center gap-3 px-4',
            !sidebarExpanded && 'lg:justify-center lg:px-0',
          )}
        >
          <NavLink
            to="/dashboard"
            onClick={closeDrawer}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[15px] bg-white shadow-sm"
            aria-label={`${t.app.nameLine1} ${t.app.nameLine2}`}
          >
            <img src={LOGO_SRC} alt="" className="h-7 w-7 object-contain" />
          </NavLink>
          <div className={clsx('min-w-0 leading-tight', !sidebarExpanded && 'lg:hidden')}>
            <div className="truncate text-sm font-bold text-white">{t.app.nameLine1}</div>
            <div className="truncate text-[11px] text-white/55">{t.app.nameLine2}</div>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t.common.closeMenu}
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-hide min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden px-3">
          {sections.map((section) => (
            <div key={section.id} className="mb-2">
              <p
                className={clsx(
                  'px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-white/45',
                  !sidebarExpanded && 'lg:hidden',
                )}
              >
                {section.label}
              </p>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavRow key={item.to} item={item} expanded={sidebarExpanded} onNavigate={closeDrawer} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: collapse toggle (desktop) + logout */}
        <div className="mt-2 shrink-0 space-y-1 px-3 pt-2">
          <button
            type="button"
            data-testid="sidebar-toggle"
            onClick={toggleSidebarExpanded}
            title={collapseLabel}
            aria-label={collapseLabel}
            aria-expanded={sidebarExpanded}
            className={clsx(
              'hidden h-[52px] w-full items-center gap-3 rounded-xl px-3 text-white/70 transition hover:bg-white/10 hover:text-white lg:flex',
              !sidebarExpanded && 'lg:justify-center lg:gap-0 lg:px-0',
            )}
          >
            {sidebarExpanded ? (
              <ChevronsLeft className="h-5 w-5 shrink-0" />
            ) : (
              <ChevronsRight className="h-5 w-5 shrink-0" />
            )}
            <span className={clsx('truncate text-sm font-medium', !sidebarExpanded && 'lg:hidden')}>
              {collapseLabel}
            </span>
          </button>

          <button
            type="button"
            data-testid="nav-logout"
            title={t.nav.logout}
            aria-label={t.nav.logout}
            onClick={() => {
              closeDrawer()
              logout()
              navigate('/login')
            }}
            className={clsx(
              'group flex h-[52px] w-full items-center gap-3 rounded-xl px-3 text-white/80 transition hover:bg-red-500/20 hover:text-white',
              !sidebarExpanded && 'lg:justify-center lg:gap-0 lg:px-0',
            )}
          >
            <img
              src={ICON_LOGOUT}
              alt=""
              className="h-6 w-6 shrink-0 brightness-0 invert opacity-70 transition group-hover:opacity-100"
            />
            <span className={clsx('truncate text-sm font-medium', !sidebarExpanded && 'lg:hidden')}>
              {t.nav.logout}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

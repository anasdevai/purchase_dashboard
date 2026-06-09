import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'

const SCELRA_LOGO = '/assets/sclera-logo.png'

function getUserInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { toggleSidebar } = useLayout()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name ?? t.common.defaultStaffUser
  const initials = getUserInitials(displayName) || 'U'

  useEffect(() => {
    if (!userMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [userMenuOpen])

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-14 min-w-0 items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center lg:hidden">
          <button
            type="button"
            data-testid="topbar-menu-toggle"
            onClick={toggleSidebar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-50"
            aria-label={t.common.openMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto sm:gap-2">
          <span className="hidden shrink-0 text-xs font-medium leading-none text-slate-500 sm:inline">
            {t.login.poweredBy}
          </span>
          <img
            src={SCELRA_LOGO}
            alt="Scelra"
            className="-mr-6 h-[64px] w-auto max-w-[18rem] shrink-0 object-contain sm:-mr-8"
          />

          <LanguageSwitcher />

          <button
            type="button"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={t.topbar.notifications}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                data-testid="topbar-user-menu"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg border border-transparent py-1 pl-1 pr-1.5 transition hover:bg-slate-50 sm:gap-2 sm:pr-2"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm">
                  {initials}
                </div>
                <div className="hidden min-w-0 text-left leading-tight md:block">
                  <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
                  <div className="text-xs text-slate-500">{t.topbar.roleAdmin}</div>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 shrink-0 text-slate-500 transition sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false)
                      logout()
                      navigate('/login', { replace: true })
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t.nav.logout}
                  </button>
                </div>
              ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

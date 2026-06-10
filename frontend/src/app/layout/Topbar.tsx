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
      <div className="flex h-14 min-w-0 items-center justify-between gap-1.5 px-2 sm:h-16 sm:gap-4 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center lg:hidden">
          <button
            type="button"
            data-testid="topbar-menu-toggle"
            onClick={toggleSidebar}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-50 sm:h-9 sm:w-9"
            aria-label={t.common.openMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-1 sm:ml-auto sm:gap-4 sm:shrink-0">
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span className="hidden shrink-0 text-[10px] font-medium leading-none text-slate-500 min-[360px]:inline sm:text-xs">
              {t.login.poweredBy}
            </span>
            {/* Asset is a square canvas with large transparent padding around the
                wordmark, so we scale the rendered image up and reserve the extra
                visible width with margins instead of cropping the file. */}
            <span className="inline-flex shrink-0 cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03]">
              <img
                src={SCELRA_LOGO}
                alt="Scelra"
                className="mx-3.5 h-7 w-auto shrink-0 scale-[1.8] object-contain min-[400px]:mx-5 min-[400px]:h-8 min-[400px]:scale-[2] sm:mx-9 sm:h-12 sm:scale-[2.4]"
              />
            </span>
          </div>

          <LanguageSwitcher />

          <button
            type="button"
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:h-9 sm:w-9"
            aria-label={t.topbar.notifications}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white sm:right-2 sm:top-2" />
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

import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ClipboardList,
  LogOut,
  Menu,
  Plus,
  Receipt,
  ReceiptText,
  Search,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useLayout } from './LayoutContext'
import type { Language } from '../../i18n/types'

const AVATAR_SRC = '/assets/user-avatar.jpg'

export function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { toggleSidebar } = useLayout()
  const de = language === 'de'

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const userMenuRef = useRef<HTMLDivElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name ?? t.common.defaultStaffUser

  useEffect(() => {
    if (!userMenuOpen && !createMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false)
      if (!createMenuRef.current?.contains(event.target as Node)) setCreateMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [userMenuOpen, createMenuOpen])

  const createItems = [
    { to: '/repair-orders/new', label: t.nav.newRepairOrder, icon: Wrench },
    { to: '/quotations/new', label: t.nav.newQuotation, icon: ReceiptText },
    { to: '/invoices/new', label: t.nav.newInvoice, icon: Receipt },
    { to: '/contracts/new', label: t.nav.newContract, icon: ClipboardList },
  ]

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    navigate('/repair-orders')
  }

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-[72px] min-w-0 items-center gap-5 px-4 sm:px-6">
        {/* Mobile menu toggle */}
        <button
          type="button"
          data-testid="topbar-menu"
          onClick={toggleSidebar}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
          aria-label={de ? 'Menü öffnen' : 'Open menu'}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              de
                ? 'Kunde, Gerät, Auftrags-Nr., IMEI, Seriennr. suchen...'
                : 'Search customer, device, order #, IMEI, serial...'
            }
            aria-label={de ? 'Suchen' : 'Search'}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </form>

        {/* Right-aligned actions */}
        <div className="flex shrink-0 items-center gap-4">

        {/* Create */}
        <div className="relative shrink-0" ref={createMenuRef}>
          <button
            type="button"
            data-testid="topbar-create"
            onClick={() => {
              setCreateMenuOpen((open) => !open)
              setUserMenuOpen(false)
            }}
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary-dark text-white transition hover:bg-[#272260]"
            aria-label={de ? 'Neu erstellen' : 'Create new'}
            aria-haspopup="menu"
            aria-expanded={createMenuOpen}
          >
            <Plus className="h-5 w-5" />
          </button>
          {createMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-30 mt-2 min-w-[13rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              {createItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.to}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateMenuOpen(false)
                      navigate(item.to)
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label={t.topbar.notifications}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <div className="relative shrink-0" ref={userMenuRef}>
          <button
            type="button"
            data-testid="topbar-user-menu"
            onClick={() => {
              setUserMenuOpen((open) => !open)
              setCreateMenuOpen(false)
            }}
            className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-slate-50 sm:pr-2.5"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <img
              src={AVATAR_SRC}
              alt={displayName}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
            />
            <div className="hidden min-w-0 text-left leading-tight sm:block">
              <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
              <div className="text-xs text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Staff'}</div>
            </div>
          </button>

          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-30 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              <div className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t.language.label}
              </div>
              <div className="flex gap-1 px-2 pb-1.5">
                {(['de', 'en'] as Language[]).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setLanguage(lng)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      language === lng
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lng === 'de' ? t.language.de : t.language.en}
                  </button>
                ))}
              </div>
              <div className="my-1 h-px bg-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false)
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

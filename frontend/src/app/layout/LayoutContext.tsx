import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type LayoutContextValue = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  /** Desktop expand/collapse state for the navigation rail. */
  sidebarExpanded: boolean
  setSidebarExpanded: (expanded: boolean) => void
  toggleSidebarExpanded: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

const EXPANDED_STORAGE_KEY = 'sidebar:expanded'

function readStoredExpanded(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(EXPANDED_STORAGE_KEY) === 'true'
}

function persistExpanded(expanded: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, String(expanded))
  } catch {
    /* ignore storage errors (e.g. private mode) */
  }
}

export function LayoutProvider(props: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpandedState] = useState<boolean>(readStoredExpanded)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open)
  }, [])

  const setSidebarExpanded = useCallback((expanded: boolean) => {
    setSidebarExpandedState(expanded)
    persistExpanded(expanded)
  }, [])

  const toggleSidebarExpanded = useCallback(() => {
    setSidebarExpandedState((prev) => {
      const next = !prev
      persistExpanded(next)
      return next
    })
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (media.matches) setSidebarOpen(false)
    }
    closeOnDesktop()
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (sidebarOpen && !isDesktop) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    document.body.style.overflow = ''
  }, [sidebarOpen])

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      sidebarExpanded,
      setSidebarExpanded,
      toggleSidebarExpanded,
    }),
    [sidebarOpen, toggleSidebar, sidebarExpanded, setSidebarExpanded, toggleSidebarExpanded],
  )

  return (
    <LayoutContext.Provider value={value}>{props.children}</LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return ctx
}

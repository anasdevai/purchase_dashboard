import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, login, logout as clearAuthToken, signup } from '../api/auth'
import { clearToken, getToken, type AuthUser } from '../api/client'
import { clearUserLocalData } from '../services/shopSettings'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Guards against duplicate effect runs (React StrictMode/dev double-invoke,
  // Vite HMR remounts) and overlapping manual logout calls.
  const didInitRef = useRef(false)
  const isLoggingOutRef = useRef(false)

  // Clears auth state locally only (no backend call). Used when the session is
  // already gone/invalid, so there is nothing to log out on the server.
  const clearLocalAuth = useCallback((previousUserId?: string) => {
    sessionStorage.removeItem('is_logged_in')
    sessionStorage.removeItem('last_active_time')
    clearToken()
    clearUserLocalData(previousUserId)
    setUser(null)
  }, [])

  const handleLogout = useCallback(() => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    const previousUserId = user?.id
    sessionStorage.removeItem('is_logged_in')
    sessionStorage.removeItem('last_active_time')
    clearAuthToken()
      .catch((err) => console.error('Error during token clear:', err))
      .finally(() => {
        isLoggingOutRef.current = false
      })
    clearUserLocalData(previousUserId)
    setUser(null)
  }, [user?.id])

  useEffect(() => {
    // StrictMode/dev invokes effects twice and HMR can remount the provider.
    // Without this guard, loadUser (and previously a backend logout) would fire
    // repeatedly and exhaust the shared /api/auth rate limit (429).
    if (didInitRef.current) return
    didInitRef.current = true

    let alive = true

    async function loadUser() {
      const isLoggedInSession = sessionStorage.getItem('is_logged_in') === 'true'
      if (!isLoggedInSession || !getToken()) {
        // No active session/token: just clear locally. Do NOT POST /auth/logout.
        clearToken()
        if (alive) setIsLoading(false)
        return
      }

      try {
        const currentUser = await fetchCurrentUser()
        if (alive) setUser(currentUser)
      } catch {
        // /auth/me failed (e.g. invalid/expired token -> 401/403). The token is
        // already unusable, so clear local state only instead of calling the
        // backend logout endpoint (which would just 401 and burn rate limit).
        if (alive) clearLocalAuth()
        else clearToken()
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadUser()
    return () => {
      alive = false
    }
  }, [clearLocalAuth])

  const handleLogin = useCallback(async (email: string, password: string) => {
    const loggedInUser = await login(email, password)
    sessionStorage.setItem('is_logged_in', 'true')
    setUser(loggedInUser)
  }, [])

  const handleSignup = useCallback(
    async (name: string, email: string, password: string) => {
      const signedUpUser = await signup(name, email, password)
      sessionStorage.setItem('is_logged_in', 'true')
      setUser(signedUpUser)
    },
    [],
  )

  // Inactivity timeout: 30 minutes
  useEffect(() => {
    if (!user) return

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
    const lastActiveKey = 'last_active_time'

    const updateActivity = () => {
      sessionStorage.setItem(lastActiveKey, Date.now().toString())
    }

    updateActivity()

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']
    let lastUpdate = 0

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastUpdate > 1000) {
        updateActivity()
        lastUpdate = now
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    const interval = setInterval(() => {
      const lastActiveStr = sessionStorage.getItem(lastActiveKey)
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10)
        if (Date.now() - lastActive > INACTIVITY_TIMEOUT) {
          console.warn('Inactivity timeout reached. Logging out.')
          handleLogout()
        }
      }
    }, 10000) // check every 10 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
    }
  }, [user, handleLogout])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
    }),
    [user, isLoading, handleLogin, handleSignup, handleLogout],
  )

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

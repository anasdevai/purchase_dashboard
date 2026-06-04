import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, login, logout as clearAuthToken, signup } from '../api/auth'
import { getToken, type AuthUser } from '../api/client'
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

  useEffect(() => {
    let alive = true

    async function loadUser() {
      if (!getToken()) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await fetchCurrentUser()
        if (alive) setUser(currentUser)
      } catch {
        clearAuthToken()
        clearUserLocalData()
        if (alive) setUser(null)
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadUser()
    return () => {
      alive = false
    }
  }, [])

  const handleLogin = useCallback(async (email: string, password: string) => {
    setUser(await login(email, password))
  }, [])

  const handleSignup = useCallback(
    async (name: string, email: string, password: string) => {
      setUser(await signup(name, email, password))
    },
    [],
  )

  const handleLogout = useCallback(() => {
    const previousUserId = user?.id
    clearAuthToken()
    clearUserLocalData(previousUserId)
    setUser(null)
  }, [user?.id])

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

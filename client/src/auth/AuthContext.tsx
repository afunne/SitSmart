import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../api/client.ts'
import type { LoginRequest, LoginResponse, Role } from '../api/types.ts'
import { clearSession, getSession, saveSession, SESSION_CHANGE_EVENT, type Session } from './session.ts'

export interface AuthUser {
  email: string
  role: Role
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  /** Logs in and saves the session. Throws ApiError (401 for wrong email or password). */
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// setTimeout breaks for delays above 2^31 - 1 ms (about 24.8 days).
const MAX_TIMEOUT_MS = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getSession())

  // Follow changes from the API client (401), logout, and other browser tabs.
  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener(SESSION_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Log out automatically when the token expires.
  useEffect(() => {
    if (!session) return
    const msLeft = Date.parse(session.expiresAt) - Date.now()
    const timer = window.setTimeout(() => setSession(getSession()), Math.min(Math.max(msLeft, 0), MAX_TIMEOUT_MS))
    return () => window.clearTimeout(timer)
  }, [session])

  const login = useCallback(async (email: string, password: string) => {
    const body: LoginRequest = { email, password }
    const response = await apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body, anonymous: true })
    saveSession(response)
    return { email: response.email, role: response.role }
  }, [])

  const logout = useCallback(() => clearSession(), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session ? { email: session.email, role: session.role } : null,
      token: session?.token ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

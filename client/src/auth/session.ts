// The saved login session in localStorage. Shared by the API client and AuthContext.
import type { LoginResponse } from '../api/types.ts'

export type Session = LoginResponse

const STORAGE_KEY = 'sitsmart.session'

/** Fired on window whenever the session is saved or cleared, so AuthContext can update. */
export const SESSION_CHANGE_EVENT = 'sitsmart:session-change'

export function isExpired(session: Session): boolean {
  const expiresAt = Date.parse(session.expiresAt)
  return Number.isNaN(expiresAt) || Date.now() >= expiresAt
}

/** Returns the saved session, or null if there is none or it has expired. */
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as Session
    if (!session.token || isExpired(session)) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT))
}

export function clearSession(): void {
  if (localStorage.getItem(STORAGE_KEY) === null) return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT))
}

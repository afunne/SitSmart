import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Role } from '../api/types.ts'
import { useAuth } from './AuthContext.tsx'

interface RequireRoleProps {
  roles: Role[]
  children: ReactNode
}

/** Renders children only for a logged-in user with one of the given roles; otherwise goes to /login. */
export default function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user || !roles.includes(user.role)) {
    // `from` lets the login page send the user back after logging in.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

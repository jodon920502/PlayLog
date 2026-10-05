import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMyProfile, type PlayProfile } from '../api/profileApi'
import { getMe, logout as logoutApi, setAccessToken, type AuthUser } from '../lib/authApi'

interface AuthSession {
  user: AuthUser
  profile: PlayProfile | null
  accessToken: string
}

interface AuthContextValue {
  user: AuthUser | null
  profile: PlayProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<PlayProfile | null>(null)
  const [accessToken, setAuthToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setProfile(null)
    setAuthToken(null)
    setAccessToken(null)
  }, [])

  const setSession = useCallback((session: AuthSession) => {
    setUser(session.user)
    setProfile(session.profile)
    setAuthToken(session.accessToken)
    setAccessToken(session.accessToken)
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const session = await getMe()
      const nextProfile = await getMyProfile(session.accessToken)
      setSession({ user: session.user, profile: nextProfile, accessToken: session.accessToken })
    } catch {
      clearSession()
    }
  }, [clearSession, setSession])

  useEffect(() => {
    let alive = true

    const restoreSession = async () => {
      try {
        const session = await getMe()
        const nextProfile = await getMyProfile(session.accessToken)
        if (!alive) return
        setSession({ user: session.user, profile: nextProfile, accessToken: session.accessToken })
      } catch {
        if (!alive) return
        clearSession()
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      alive = false
    }
  }, [clearSession, setSession])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    setSession,
    clearSession,
    logout,
    refreshSession,
  }), [accessToken, clearSession, isLoading, logout, profile, refreshSession, setSession, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

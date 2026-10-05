export interface AuthUser {
  id: string
  username: string
}

interface AuthResponse {
  success: boolean
  accessToken?: string
  user?: AuthUser
  message?: string
}

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

async function requestAuth(path: string, body: Record<string, string>): Promise<{ user: AuthUser; accessToken: string }> {
  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const data = await response.json() as AuthResponse
  if (!response.ok || !data.success || !data.user || !data.accessToken) {
    throw new Error(data.message ?? '操作失敗，請稍後再試')
  }

  setAccessToken(data.accessToken)
  return { user: data.user, accessToken: data.accessToken }
}

export function login(email: string, password: string) {
  return requestAuth('login', { email, password })
}

export function register(username: string, email: string, password: string) {
  return fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  }).then(async (response) => {
    const data = await response.json() as AuthResponse
    if (!response.ok || !data.success || !data.user) {
      throw new Error(data.message ?? '操作失敗，請稍後再試')
    }
    return data.user
  })
}

export async function refresh(): Promise<{ user: AuthUser; accessToken: string }> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
  const data = await response.json() as AuthResponse
  if (!response.ok || !data.success || !data.user || !data.accessToken) {
    throw new Error(data.message ?? '登入狀態已失效')
  }

  setAccessToken(data.accessToken)
  return { user: data.user, accessToken: data.accessToken }
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
  setAccessToken(null)
}

export async function getMe(): Promise<{ user: AuthUser; accessToken: string }> {
  const token = getAccessToken()
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include',
  })

  if (response.status === 401) {
    return refresh()
  }

  const data = await response.json() as AuthResponse
  if (!response.ok || !data.success || !data.user || !data.accessToken) {
    throw new Error(data.message ?? '登入狀態已失效')
  }

  setAccessToken(data.accessToken)
  return { user: data.user, accessToken: data.accessToken }
}

import { API_URL, getAccessToken } from '../lib/authApi'
import type { Game } from '../types/game'

interface FavoriteResponse {
  success: boolean
  isFavorited?: boolean
  games?: Game[]
  pagination?: { total: number; limit: number; offset: number; hasMore: boolean }
  message?: string
}

async function request(path: string, init: RequestInit = {}): Promise<FavoriteResponse> {
  const token = getAccessToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    credentials: 'include',
  })
  const payload = await response.json() as FavoriteResponse
  if (!response.ok || !payload.success) throw new Error(payload.message ?? '收藏服務暫時無法使用')
  return payload
}

export async function getFavoriteStatus(gameId: string): Promise<boolean> {
  const payload = await request(`/api/favorites/games/${encodeURIComponent(gameId)}`)
  return payload.isFavorited ?? false
}

export async function setFavorite(gameId: string, isFavorited: boolean): Promise<boolean> {
  const payload = await request(`/api/favorites/games/${encodeURIComponent(gameId)}`, { method: isFavorited ? 'PUT' : 'DELETE' })
  return payload.isFavorited ?? isFavorited
}

export async function getFavorites(limit = 20, offset = 0): Promise<{ games: Game[]; pagination: NonNullable<FavoriteResponse['pagination']> }> {
  const payload = await request(`/api/favorites?limit=${limit}&offset=${offset}`)
  return {
    games: payload.games ?? [],
    pagination: payload.pagination ?? { total: 0, limit, offset, hasMore: false },
  }
}

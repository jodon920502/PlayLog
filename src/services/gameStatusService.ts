import { API_URL, fetchWithAuth } from '../lib/authApi'
import type { Game } from '../types/game'

export const GAME_STATUSES = ['wishlist', 'playing', 'completed', 'paused', 'dropped'] as const
export type GameStatus = typeof GAME_STATUSES[number]

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  wishlist: '想玩',
  playing: '遊玩中',
  completed: '已通關',
  paused: '已暫停',
  dropped: '已棄坑',
}

interface StatusResponse {
  success: boolean
  status?: GameStatus | null
  games?: Array<Game & { gameStatus: GameStatus }>
  pagination?: { total: number; limit: number; offset: number; hasMore: boolean }
  statusCounts?: Record<GameStatus, number>
  message?: string
}

async function request(path: string, init?: RequestInit): Promise<StatusResponse> {
  const response = await fetchWithAuth(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  const payload = await response.json() as StatusResponse
  if (!response.ok || !payload.success) throw new Error(payload.message ?? '遊戲狀態服務暫時無法使用')
  return payload
}

export async function getGameStatus(gameId: string): Promise<GameStatus | null> {
  const payload = await request(`/api/status/games/${encodeURIComponent(gameId)}`)
  return payload.status ?? null
}

export async function setGameStatus(gameId: string, status: GameStatus | null): Promise<GameStatus | null> {
  const path = `/api/status/games/${encodeURIComponent(gameId)}`
  const payload = status
    ? await request(path, { method: 'PUT', body: JSON.stringify({ status }) })
    : await request(path, { method: 'DELETE' })
  return payload.status ?? null
}

export async function getGameLibrary(status?: GameStatus, limit = 12, offset = 0): Promise<{
  games: Array<Game & { gameStatus: GameStatus }>
  pagination: NonNullable<StatusResponse['pagination']>
  statusCounts: Record<GameStatus, number>
}> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (status) params.set('status', status)
  const payload = await request(`/api/status?${params.toString()}`)
  return {
    games: payload.games ?? [],
    pagination: payload.pagination ?? { total: 0, limit, offset, hasMore: false },
    statusCounts: payload.statusCounts ?? Object.fromEntries(GAME_STATUSES.map((item) => [item, 0])) as Record<GameStatus, number>,
  }
}

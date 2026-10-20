const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface PlayerSearchResult {
  userId: string
  displayName: string
  avatar: string | null
  bio: string | null
}

export interface PlayerSearchPage {
  players: PlayerSearchResult[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface PlayerSearchResponse {
  success: boolean
  players?: PlayerSearchResult[]
  pagination?: PlayerSearchPage['pagination']
  error?: { message?: string }
}

export async function searchPlayers(query: string, limit = 20, offset = 0, signal?: AbortSignal): Promise<PlayerSearchPage> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    return { players: [], pagination: { total: 0, limit, offset, hasMore: false } }
  }
  const params = new URLSearchParams({ q: normalizedQuery, limit: String(limit), offset: String(offset) })
  const response = await fetch(`${API_BASE_URL}/api/players/search?${params.toString()}`, { signal })
  const payload = await response.json() as PlayerSearchResponse
  if (!response.ok || !payload.success || !payload.players || !payload.pagination) {
    throw new Error(payload.error?.message ?? '玩家搜尋服務暫時無法使用')
  }
  return { players: payload.players, pagination: payload.pagination }
}

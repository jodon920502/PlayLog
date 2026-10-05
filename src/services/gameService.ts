import { games as mockGames } from '../data/mockGames'
import type { Game } from '../types/game'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

interface GameApiResponse {
  success: boolean
  games?: Game[]
  game?: Game
  error?: { code?: string; message?: string }
}

interface RawExternalGame {
  id: number
  name: string
  slug: string
  summary?: string
  first_release_date?: number
  cover?: { image_id?: string }
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string; abbreviation?: string }>
  involved_companies?: Array<{
    developer?: boolean
    publisher?: boolean
    company?: { id: number; name: string }
  }>
}

export interface ExternalGame {
  id: number
  name: string
  slug: string
  summary: string | null
  coverImageId: string | null
  firstReleaseDate: string | null
  developerName: string | null
  publisherName: string | null
  genres: Array<{ id: number; name: string }>
  platforms: Array<{ id: number; name: string; abbreviation: string | null }>
}

interface ExternalSearchResponse {
  success: boolean
  games?: RawExternalGame[]
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: { message?: string }
}

interface ImportResponse {
  success: boolean
  imported?: boolean
  game?: Game
  error?: { message?: string }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  let payload: T
  try {
    payload = await response.json() as T
  } catch {
    throw new Error('遊戲服務回傳了無效資料')
  }
  const typedPayload = payload as T & { success?: boolean; error?: { message?: string } }
  if (!response.ok || typedPayload.success !== true) {
    throw new Error(typedPayload.error?.message ?? '遊戲服務暫時無法使用')
  }
  return payload
}

export async function searchGames(query: string): Promise<Game[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []
  const payload = await request<GameApiResponse>(`/api/games/search?q=${encodeURIComponent(normalizedQuery)}`)
  return payload.games ?? []
}

export async function getGameById(id: string | undefined): Promise<Game | null> {
  if (!id) return null
  const payload = await request<GameApiResponse>(`/api/games/${encodeURIComponent(id)}`)
  return payload.game ?? null
}

function toExternalGame(game: RawExternalGame): ExternalGame {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    summary: game.summary ?? null,
    coverImageId: game.cover?.image_id ?? null,
    firstReleaseDate: typeof game.first_release_date === 'number' ? new Date(game.first_release_date * 1000).toISOString() : null,
    developerName: game.involved_companies?.find((company) => company.developer)?.company?.name ?? null,
    publisherName: game.involved_companies?.find((company) => company.publisher)?.company?.name ?? null,
    genres: game.genres ?? [],
    platforms: (game.platforms ?? []).map((platform) => ({ ...platform, abbreviation: platform.abbreviation ?? null })),
  }
}

export interface ExternalSearchResult {
  games: ExternalGame[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export async function searchExternalGames(query: string, limit = 20, offset = 0): Promise<ExternalSearchResult> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return { games: [], pagination: { limit, offset, hasMore: false } }
  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: String(limit),
    offset: String(offset),
  })
  const payload = await request<ExternalSearchResponse>(`/api/games/external/search?${params.toString()}`)
  return {
    games: (payload.games ?? []).map(toExternalGame),
    pagination: payload.pagination ?? { limit, offset, hasMore: (payload.games ?? []).length === limit },
  }
}

export async function importGame(igdbId: number): Promise<{ imported: boolean; game: Game }> {
  const payload = await request<ImportResponse>('/api/games/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ igdbId }),
  })
  if (typeof payload.imported !== 'boolean' || !payload.game) {
    throw new Error('遊戲匯入服務回傳了無效資料')
  }
  return { imported: payload.imported, game: payload.game }
}

export function searchMockGames(query: string): Game[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []
  return mockGames.filter((game) => [
    game.name,
    game.developer,
    game.genre,
    ...game.platforms.map((platform) => typeof platform === 'string' ? platform : platform.name),
  ].filter((field): field is string => typeof field === 'string').some((field) => field.toLocaleLowerCase().includes(normalizedQuery)))
}

export function getIgdbCoverUrl(coverImageId: string | null | undefined, size = 't_cover_big'): string | null {
  return coverImageId ? `https://images.igdb.com/igdb/image/upload/${size}/${coverImageId}.jpg` : null
}

import { games as mockGames } from '../data/mockGames'
import type { Game } from '../types/game'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

interface GameApiResponse {
  success: boolean
  games?: Game[]
  game?: Game
  error?: { code?: string; message?: string }
}

async function request(path: string): Promise<GameApiResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  let payload: GameApiResponse
  try {
    payload = await response.json() as GameApiResponse
  } catch {
    throw new Error('遊戲服務回傳了無效資料')
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? '遊戲服務暫時無法使用')
  }
  return payload
}

export async function searchGames(query: string): Promise<Game[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []
  const payload = await request(`/api/games/search?q=${encodeURIComponent(normalizedQuery)}`)
  return payload.games ?? []
}

export async function getGameById(id: string | undefined): Promise<Game | null> {
  if (!id) return null
  const payload = await request(`/api/games/${encodeURIComponent(id)}`)
  return payload.game ?? null
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

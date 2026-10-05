import { games } from '../data/mockGames'
import type { Game } from '../types/game'

export function searchGames(query: string): Game[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []

  return games.filter((game) => [
    game.name,
    game.genre,
    game.developer,
    ...game.platforms,
  ].some((field) => field.toLocaleLowerCase().includes(normalizedQuery)))
}

export function getGameById(id: string | undefined): Game | undefined {
  return games.find((game) => game.id === id)
}

import { playlogPool } from '../../config/db.js'
import { getGamesByIds, type PlaylogGame } from '../games/game.service.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class FavoriteError extends Error {
  constructor(public readonly code: 'GAME_NOT_FOUND' | 'FAVORITE_NOT_FOUND' | 'PROFILE_NOT_FOUND', message: string) {
    super(message)
    this.name = 'FavoriteError'
  }
}

function ensureUuid(gameId: string): void {
  if (!UUID_PATTERN.test(gameId)) {
    throw new FavoriteError('GAME_NOT_FOUND', '找不到指定遊戲')
  }
}

export async function getFavoriteStatus(userId: string, gameId: string): Promise<boolean> {
  ensureUuid(gameId)
  const result = await playlogPool.query('SELECT 1 FROM game_favorites gf INNER JOIN games g ON g.id = gf.game_id WHERE gf.user_id = $1 AND gf.game_id = $2 AND g.status = $3 LIMIT 1', [userId, gameId, 'ACTIVE'])
  return Boolean(result.rowCount)
}

export async function addFavorite(userId: string, gameId: string): Promise<void> {
  ensureUuid(gameId)
  const game = await playlogPool.query('SELECT 1 FROM games WHERE id = $1 AND status = $2 LIMIT 1', [gameId, 'ACTIVE'])
  if (!game.rowCount) throw new FavoriteError('GAME_NOT_FOUND', '找不到指定遊戲')
  await playlogPool.query(
    'INSERT INTO game_favorites (user_id, game_id) VALUES ($1, $2) ON CONFLICT (user_id, game_id) DO NOTHING',
    [userId, gameId],
  )
}

export async function removeFavorite(userId: string, gameId: string): Promise<void> {
  ensureUuid(gameId)
  const result = await playlogPool.query('DELETE FROM game_favorites WHERE user_id = $1 AND game_id = $2', [userId, gameId])
  if (!result.rowCount) throw new FavoriteError('FAVORITE_NOT_FOUND', '這款遊戲尚未收藏')
}

export async function listFavorites(userId: string, limit: number, offset: number): Promise<{ games: PlaylogGame[]; total: number }> {
  const result = await playlogPool.query<{ id: string; total: string }>(
    `SELECT gf.game_id AS id, COUNT(*) OVER()::int AS total
     FROM game_favorites gf
     INNER JOIN games g ON g.id = gf.game_id
     WHERE gf.user_id = $1 AND g.status = 'ACTIVE'
     ORDER BY gf.created_at DESC, gf.game_id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  )
  const games = await getGamesByIds(result.rows.map((row) => row.id))
  const gamesById = new Map(games.map((game) => [game.id, game]))
  return {
    games: result.rows.flatMap((row) => {
      const game = gamesById.get(row.id)
      return game ? [game] : []
    }),
    total: Number(result.rows[0]?.total ?? 0),
  }
}

export async function listPublicFavorites(profileId: string, limit: number, offset: number): Promise<{ games: PlaylogGame[]; total: number }> {
  ensureUuid(profileId)
  const profile = await playlogPool.query<{ account_user_id: string }>(
    'SELECT account_user_id FROM profiles WHERE id = $1 LIMIT 1',
    [profileId],
  )
  const userId = profile.rows[0]?.account_user_id
  if (!userId) throw new FavoriteError('PROFILE_NOT_FOUND', 'Profile 不存在')
  return listFavorites(userId, limit, offset)
}

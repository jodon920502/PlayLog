import { playlogPool } from '../../config/db.js'
import { getGamesByIds, type PlaylogGame } from '../games/game.service.js'

export const GAME_STATUSES = ['wishlist', 'playing', 'completed', 'paused', 'dropped'] as const
export type GameStatus = typeof GAME_STATUSES[number]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class GameStatusError extends Error {
  constructor(
    public readonly code: 'GAME_NOT_FOUND' | 'INVALID_STATUS' | 'PROFILE_NOT_FOUND' | 'PRIVATE_LIBRARY',
    message: string,
  ) {
    super(message)
    this.name = 'GameStatusError'
  }

}

export interface GameLibraryStats {
  statusCounts: Record<GameStatus, number>
  reviewCount: number
}

function ensureGameId(gameId: string): void {
  if (!UUID_PATTERN.test(gameId)) throw new GameStatusError('GAME_NOT_FOUND', '找不到指定遊戲')
}

function ensureStatus(status: unknown): asserts status is GameStatus {
  if (typeof status !== 'string' || !GAME_STATUSES.includes(status as GameStatus)) {
    throw new GameStatusError('INVALID_STATUS', '遊戲狀態無效')
  }
}

async function ensureActiveGame(gameId: string): Promise<void> {
  ensureGameId(gameId)
  const result = await playlogPool.query('SELECT 1 FROM games WHERE id = $1 AND status = $2 LIMIT 1', [gameId, 'ACTIVE'])
  if (!result.rowCount) throw new GameStatusError('GAME_NOT_FOUND', '找不到指定遊戲')
}

export async function getGameStatus(userId: string, gameId: string): Promise<GameStatus | null> {
  await ensureActiveGame(gameId)
  const result = await playlogPool.query<{ status: GameStatus }>(
    'SELECT ugs.status FROM user_game_statuses ugs WHERE ugs.user_id = $1 AND ugs.game_id = $2',
    [userId, gameId],
  )
  return result.rows[0]?.status ?? null
}

export async function setGameStatus(userId: string, gameId: string, status: unknown): Promise<GameStatus> {
  ensureStatus(status)
  await ensureActiveGame(gameId)
  const result = await playlogPool.query<{ status: GameStatus }>(
    `INSERT INTO user_game_statuses (user_id, game_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, game_id)
     DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
     RETURNING status`,
    [userId, gameId, status],
  )
  const row = result.rows[0]
  if (!row) throw new Error('遊戲狀態寫入失敗')
  return row.status
}

export async function clearGameStatus(userId: string, gameId: string): Promise<void> {
  ensureGameId(gameId)
  await playlogPool.query('DELETE FROM user_game_statuses WHERE user_id = $1 AND game_id = $2', [userId, gameId])
}

export async function listGameStatuses(
  userId: string,
  limit: number,
  offset: number,
  status?: GameStatus,
): Promise<{ games: Array<PlaylogGame & { gameStatus: GameStatus }>; total: number; statusCounts: Record<GameStatus, number> }> {
  const [result, countsResult] = await Promise.all([
    playlogPool.query<{ id: string; game_status: GameStatus; total: string }>(
    `SELECT ugs.game_id AS id, ugs.status AS game_status, COUNT(*) OVER()::int AS total
     FROM user_game_statuses ugs
     INNER JOIN games g ON g.id = ugs.game_id
     WHERE ugs.user_id = $1 AND g.status = 'ACTIVE'
       AND ($4::text IS NULL OR ugs.status = $4)
     ORDER BY ugs.updated_at DESC, ugs.game_id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset, status ?? null],
    ),
    playlogPool.query<{ status: GameStatus; count: string }>(
      `SELECT status, COUNT(*)::int AS count
       FROM user_game_statuses
       WHERE user_id = $1
       GROUP BY status`,
      [userId],
    ),
  ])
  const games = await getGamesByIds(result.rows.map((row) => row.id))
  const gamesById = new Map(games.map((game) => [game.id, game]))
  const statusCounts = Object.fromEntries(GAME_STATUSES.map((item) => [item, 0])) as Record<GameStatus, number>
  for (const row of countsResult.rows) statusCounts[row.status] = Number(row.count)
  return {
    games: result.rows.flatMap((row) => {
      const game = gamesById.get(row.id)
      return game ? [{ ...game, gameStatus: row.game_status }] : []
    }),
    total: Number(result.rows[0]?.total ?? 0),
    statusCounts,
  }
}

async function getProfileOwner(profileId: string): Promise<{ userId: string; isPublic: boolean } | null> {
  const result = await playlogPool.query<{ account_user_id: string; game_library_public: boolean }>(
    'SELECT account_user_id, game_library_public FROM profiles WHERE id = $1 LIMIT 1',
    [profileId],
  )
  const profile = result.rows[0]
  return profile ? { userId: profile.account_user_id, isPublic: profile.game_library_public } : null
}

async function ensureProfileLibraryAccess(profileId: string, viewerUserId?: string): Promise<string> {
  const profile = await getProfileOwner(profileId)
  if (!profile) throw new GameStatusError('PROFILE_NOT_FOUND', 'Profile 不存在')
  if (!profile.isPublic && profile.userId !== viewerUserId) {
    throw new GameStatusError('PRIVATE_LIBRARY', '此玩家的遊戲庫目前為私人')
  }
  return profile.userId
}

export async function getProfileGameLibrary(
  profileId: string,
  viewerUserId: string | undefined,
  limit: number,
  offset: number,
  status?: GameStatus,
): Promise<{ games: Array<PlaylogGame & { gameStatus: GameStatus }>; total: number; statusCounts: Record<GameStatus, number>; reviewCount: number }> {
  const userId = await ensureProfileLibraryAccess(profileId, viewerUserId)
  const result = await listGameStatuses(userId, limit, offset, status)
  const stats = await getProfileGameStats(profileId, viewerUserId)
  return { ...result, ...stats }
}

export async function getProfileGameStats(profileId: string, viewerUserId: string | undefined): Promise<GameLibraryStats> {
  const userId = await ensureProfileLibraryAccess(profileId, viewerUserId)
  const [statusResult, reviewResult] = await Promise.all([
    playlogPool.query<{ status: GameStatus; count: string }>(
      `SELECT ugs.status, COUNT(*)::int AS count
       FROM user_game_statuses ugs
       INNER JOIN games g ON g.id = ugs.game_id AND g.status = 'ACTIVE'
       WHERE ugs.user_id = $1
       GROUP BY ugs.status`,
      [userId],
    ),
    playlogPool.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM reviews WHERE user_id = $1',
      [userId],
    ),
  ])
  const statusCounts = Object.fromEntries(GAME_STATUSES.map((item) => [item, 0])) as Record<GameStatus, number>
  for (const row of statusResult.rows) statusCounts[row.status] = Number(row.count)
  return { statusCounts, reviewCount: Number(reviewResult.rows[0]?.count ?? 0) }
}

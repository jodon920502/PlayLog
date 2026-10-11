import { Router, type Response } from 'express'
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware.js'
import { GAME_STATUSES, GameStatusError, getGameStatus, setGameStatus, clearGameStatus, listGameStatuses, getProfileGameLibrary, type GameStatus } from './game-status.service.js'

const router = Router()
const isGameStatus = (value: unknown): value is GameStatus => typeof value === 'string' && GAME_STATUSES.includes(value as GameStatus)

function getGameId(value: unknown): string {
  if (typeof value !== 'string') throw new GameStatusError('GAME_NOT_FOUND', '找不到指定遊戲')
  return value
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof GameStatusError) {
    res.status(error.code === 'GAME_NOT_FOUND' || error.code === 'PROFILE_NOT_FOUND' ? 404 : error.code === 'PRIVATE_LIBRARY' ? 403 : 400).json({ success: false, code: error.code, message: error.message })
    return
  }
  console.error('Game status request failed', error instanceof Error ? error.message : 'Unknown error')
  res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '遊戲狀態服務暫時無法使用' })
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit)
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
    const status = req.query.status === undefined ? undefined : req.query.status
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0 || (status !== undefined && !isGameStatus(status))) {
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: '分頁或狀態篩選條件無效' })
      return
    }
    const result = await listGameStatuses(req.auth!.userId, limit, offset, status as GameStatus | undefined)
    res.json({ success: true, games: result.games, statusCounts: result.statusCounts, pagination: { total: result.total, limit, offset, hasMore: offset + result.games.length < result.total } })
  } catch (error) {
    handleError(error, res)
  }
})

router.get('/games/:gameId', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, status: await getGameStatus(req.auth!.userId, getGameId(req.params.gameId)) })
  } catch (error) {
    handleError(error, res)
  }
})

router.put('/games/:gameId', requireAuth, async (req, res) => {
  try {
    const status = await setGameStatus(req.auth!.userId, getGameId(req.params.gameId), req.body?.status)
    res.json({ success: true, status })
  } catch (error) {
    handleError(error, res)
  }
})

router.delete('/games/:gameId', requireAuth, async (req, res) => {
  try {
    await clearGameStatus(req.auth!.userId, getGameId(req.params.gameId))
    res.json({ success: true, status: null })
  } catch (error) {
    handleError(error, res)
  }
})

router.get('/profiles/:profileId/library', optionalAuth, async (req, res) => {
  try {
    if (typeof req.params.profileId !== 'string') {
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'Profile ID 格式不正確' })
      return
    }
    const limit = req.query.limit === undefined ? 12 : Number(req.query.limit)
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
    const status = req.query.status === undefined ? undefined : req.query.status
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0 || (status !== undefined && !isGameStatus(status))) {
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: '分頁或狀態篩選條件無效' })
      return
    }
    const result = await getProfileGameLibrary(req.params.profileId, req.auth?.userId, limit, offset, status as GameStatus | undefined)
    res.json({ success: true, games: result.games, statusCounts: result.statusCounts, reviewCount: result.reviewCount, pagination: { total: result.total, limit, offset, hasMore: offset + result.games.length < result.total } })
  } catch (error) {
    handleError(error, res)
  }
})

export default router

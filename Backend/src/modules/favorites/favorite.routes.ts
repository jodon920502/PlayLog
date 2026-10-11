import { Router, type Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { addFavorite, FavoriteError, getFavoriteStatus, listFavorites, removeFavorite } from './favorite.service.js'

const router = Router()

function getGameId(value: unknown): string {
  if (typeof value !== 'string') throw new FavoriteError('GAME_NOT_FOUND', '找不到指定遊戲')
  return value
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof FavoriteError) {
    res.status(error.code === 'GAME_NOT_FOUND' || error.code === 'PROFILE_NOT_FOUND' ? 404 : 409).json({ success: false, code: error.code, message: error.message })
    return
  }
  console.error('Favorite request failed', error instanceof Error ? error.message : 'Unknown error')
  res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '收藏服務暫時無法使用' })
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit)
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) {
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'limit 必須是 1 到 50 的整數，offset 必須是非負整數' })
      return
    }
    const result = await listFavorites(req.auth!.userId, limit, offset)
    res.json({ success: true, games: result.games, pagination: { total: result.total, limit, offset, hasMore: offset + result.games.length < result.total } })
  } catch (error) {
    handleError(error, res)
  }
})

router.get('/games/:gameId', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, isFavorited: await getFavoriteStatus(req.auth!.userId, getGameId(req.params.gameId)) })
  } catch (error) {
    handleError(error, res)
  }
})

router.put('/games/:gameId', requireAuth, async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    await addFavorite(req.auth!.userId, gameId)
    res.json({ success: true, isFavorited: true })
  } catch (error) {
    handleError(error, res)
  }
})

router.delete('/games/:gameId', requireAuth, async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    await removeFavorite(req.auth!.userId, gameId)
    res.json({ success: true, isFavorited: false })
  } catch (error) {
    handleError(error, res)
  }
})

export default router

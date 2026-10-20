import { Router } from 'express'
import { ProfileError, searchPlayers } from './profile.service.js'
import { playerSearchRateLimit } from '../../middleware/rate-limit.middleware.js'

const router = Router()

router.get('/search', playerSearchRateLimit, async (req, res) => {
  try {
    const result = await searchPlayers(req.query.q, req.query.limit, req.query.offset)
    res.json({
      success: true,
      players: result.players,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.players.length < result.total,
      },
    })
  } catch (error) {
    if (error instanceof ProfileError) {
      res.status(400).json({ success: false, error: { code: error.code, message: error.message } })
      return
    }
    console.error('Player search failed', error)
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '玩家搜尋服務暫時無法使用' } })
  }
})

export default router

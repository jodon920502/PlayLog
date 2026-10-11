import { Router } from 'express'
import { listRankings, parseRankingPagination, parseRankingSort } from './ranking.service.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { limit, offset } = parseRankingPagination(req.query.limit, req.query.offset)
    const sort = parseRankingSort(req.query.sort)
    const result = await listRankings(limit, offset, sort)
    res.json({ success: true, games: result.games, pagination: { total: result.total, limit, offset, hasMore: result.hasMore } })
  } catch (error) {
    const message = error instanceof Error ? error.message : '排行榜服務暫時無法使用'
    if (message.startsWith('sort ') || message.startsWith('limit ')) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message } })
      return
    }
    console.error('Ranking lookup failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '排行榜服務暫時無法使用' } })
  }
})

export default router

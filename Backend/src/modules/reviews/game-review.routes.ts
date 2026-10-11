import { Router, type Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware.js'
import {
  ReviewError,
  getMyReview,
  getRatingSummary,
  isValidUuid,
  listReviews,
  parsePagination,
  parseSort,
  createReview,
} from './review.service.js'

const router = Router()

function getGameId(value: unknown): string {
  if (typeof value !== 'string' || !isValidUuid(value)) throw new ReviewError('VALIDATION_ERROR', 'gameId 必須是合法 UUID')
  return value
}

function handleReviewError(error: unknown, res: Response) {
  if (error instanceof ReviewError) {
    const status = error.code === 'GAME_NOT_FOUND' ? 404 : error.code === 'DUPLICATE_REVIEW' ? 409 : error.code === 'ACCOUNT_NOT_FOUND' ? 401 : 400
    res.status(status).json({ success: false, code: error.code, message: error.message })
    return
  }
  console.error('Review request failed', error instanceof Error ? error.message : 'Unknown error')
  res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '評論服務暫時無法使用' })
}

router.get('/:gameId/reviews', async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset)
    const sort = parseSort(req.query.sort)
    const result = await listReviews(gameId, limit, offset, sort)
    res.json({ success: true, reviews: result.reviews, pagination: { limit, offset, hasMore: result.hasMore } })
  } catch (error) {
    handleReviewError(error, res)
  }
})

router.get('/:gameId/rating-summary', async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    res.json({ success: true, ...(await getRatingSummary(gameId)) })
  } catch (error) {
    handleReviewError(error, res)
  }
})

router.get('/:gameId/reviews/me', requireAuth, async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    res.json({ success: true, review: await getMyReview(gameId, req.auth!.userId) })
  } catch (error) {
    handleReviewError(error, res)
  }
})

router.post('/:gameId/reviews', requireAuth, async (req, res) => {
  try {
    const gameId = getGameId(req.params.gameId)
    const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
    const review = await createReview(gameId, req.auth!.userId, {
      rating: body.rating as number,
      content: body.content === undefined ? null : body.content as string | null,
    })
    res.status(201).json({ success: true, review })
  } catch (error) {
    handleReviewError(error, res)
  }
})

export default router

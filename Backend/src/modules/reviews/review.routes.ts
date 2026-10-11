import { Router, type Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { deleteReview, ReviewError, updateReview, isValidUuid } from './review.service.js'

const router = Router()

function handleReviewError(error: unknown, res: Response) {
  if (error instanceof ReviewError) {
    const status = error.code === 'REVIEW_NOT_FOUND' ? 404 : 400
    res.status(status).json({ success: false, code: error.code, message: error.message })
    return
  }
  console.error('Review mutation failed', error instanceof Error ? error.message : 'Unknown error')
  res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '評論服務暫時無法使用' })
}

router.patch('/:reviewId', requireAuth, async (req, res) => {
  const reviewId = req.params.reviewId
  if (typeof reviewId !== 'string' || !isValidUuid(reviewId)) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'reviewId 必須是合法 UUID' })
    return
  }
  try {
    res.json({ success: true, review: await updateReview(reviewId, req.auth!.userId, req.body) })
  } catch (error) {
    handleReviewError(error, res)
  }
})

router.delete('/:reviewId', requireAuth, async (req, res) => {
  const reviewId = req.params.reviewId
  if (typeof reviewId !== 'string' || !isValidUuid(reviewId)) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'reviewId 必須是合法 UUID' })
    return
  }
  try {
    await deleteReview(reviewId, req.auth!.userId)
    res.status(204).send()
  } catch (error) {
    handleReviewError(error, res)
  }
})

export default router

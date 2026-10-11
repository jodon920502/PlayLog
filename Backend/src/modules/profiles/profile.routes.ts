import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { checkDisplayNameAvailability, checkMyDisplayNameAvailability, getOrCreateMyProfile, getPublicProfile, listProfileReviews, ProfileError, updateMyProfile } from './profile.service.js'
import { FavoriteError, listPublicFavorites } from '../favorites/favorite.service.js'
import { displayNameValidationMessage, isValidDisplayName } from '../../utils/displayName.js'

const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await getOrCreateMyProfile(req.auth!.userId)
    res.json({ success: true, profile })
  } catch (error) {
    console.error('Get my profile failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const profile = await updateMyProfile(req.auth!.userId, req.body)
    res.json({ success: true, profile })
  } catch (error) {
    if (error instanceof ProfileError) {
      res.status(error.code === 'NOT_FOUND' ? 404 : error.code === 'DISPLAY_NAME_TAKEN' ? 409 : 400).json({ success: false, code: error.code, message: error.message })
      return
    }
    console.error('Update my profile failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.get('/display-name-availability', async (req, res) => {
  const displayName = typeof req.query.displayName === 'string' ? req.query.displayName : ''
  if (!isValidDisplayName(displayName)) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: displayNameValidationMessage(displayName) })
    return
  }
  try {
    const available = await checkDisplayNameAvailability(displayName)
    res.json({ success: true, available })
  } catch (error) {
    console.error('Check display name availability failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '無法檢查玩家名稱' })
  }
})

router.get('/me/display-name-availability', requireAuth, async (req, res) => {
  const displayName = typeof req.query.displayName === 'string' ? req.query.displayName : ''
  if (!isValidDisplayName(displayName)) {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: displayNameValidationMessage(displayName) })
    return
  }
  try {
    const available = await checkMyDisplayNameAvailability(req.auth!.userId, displayName)
    res.json({ success: true, available })
  } catch (error) {
    console.error('Check own display name availability failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '無法檢查玩家名稱' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const profile = await getPublicProfile(req.params.id)
    if (!profile) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Profile 不存在' })
      return
    }
    res.json({ success: true, profile })
  } catch (error) {
    console.error('Get public profile failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.get('/:id/reviews', async (req, res) => {
  try {
    const result = await listProfileReviews(req.params.id, req.query.limit, req.query.offset)
    res.json({
      success: true,
      reviews: result.reviews,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    if (error instanceof ProfileError) {
      res.status(error.code === 'NOT_FOUND' ? 404 : 400).json({ success: false, code: error.code, message: error.message })
      return
    }
    console.error('Get profile reviews failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
  }
})

router.get('/:id/favorites', async (req, res) => {
  try {
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit)
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) {
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'limit 必須是 1 到 50 的整數，offset 必須是非負整數' })
      return
    }
    const result = await listPublicFavorites(req.params.id, limit, offset)
    res.json({
      success: true,
      games: result.games,
      pagination: { total: result.total, limit, offset, hasMore: offset + result.games.length < result.total },
    })
  } catch (error) {
    if (error instanceof ProfileError) {
      res.status(400).json({ success: false, code: error.code, message: error.message })
      return
    }
    if (error instanceof FavoriteError && error.code === 'PROFILE_NOT_FOUND') {
      res.status(404).json({ success: false, code: error.code, message: error.message })
      return
    }
    console.error('Get public profile favorites failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '無法取得收藏遊戲' })
  }
})

export default router

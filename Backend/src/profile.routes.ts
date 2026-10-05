import { Router } from 'express'
import { requireAuth } from './auth.middleware.js'
import { getOrCreateMyProfile, getPublicProfile, ProfileError, updateMyProfile } from './profile.service.js'

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
      res.status(error.code === 'NOT_FOUND' ? 404 : 400).json({ success: false, code: error.code, message: error.message })
      return
    }
    console.error('Update my profile failed', error)
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
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

export default router

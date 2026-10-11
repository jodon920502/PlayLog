import { Router } from 'express'
import { getHomeData } from './home.service.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    res.json({ success: true, ...(await getHomeData()) })
  } catch (error) {
    console.error('Get home data failed', error instanceof Error ? error.message : 'Unknown error')
    res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '首頁資料暫時無法使用' })
  }
})

export default router

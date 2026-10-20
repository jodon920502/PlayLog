import { rateLimit } from 'express-rate-limit'
import type { RequestHandler } from 'express'

function createRateLimit(windowMs: number, limit: number, message: string): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message,
      })
    },
  })
}

export const loginRateLimit = createRateLimit(15 * 60 * 1000, 10, '登入嘗試過於頻繁，請稍後再試')
export const registerRateLimit = createRateLimit(60 * 60 * 1000, 5, '註冊請求過於頻繁，請稍後再試')
export const refreshRateLimit = createRateLimit(60 * 1000, 30, '登入狀態更新過於頻繁，請稍後再試')
export const externalGameSearchRateLimit = createRateLimit(60 * 1000, 30, '外部遊戲搜尋過於頻繁，請稍後再試')
export const gameImportRateLimit = createRateLimit(60 * 1000, 20, '遊戲匯入請求過於頻繁，請稍後再試')
export const playerSearchRateLimit = createRateLimit(60 * 1000, 60, '玩家搜尋過於頻繁，請稍後再試')

import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from './token.service.js'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '登入狀態已失效' })
    return
  }
  try {
    const payload = verifyAccessToken(token)
    req.auth = { userId: payload.sub }
    next()
  } catch {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '登入狀態已失效' })
  }
}

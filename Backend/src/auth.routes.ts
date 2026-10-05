import { Router } from 'express'
import { AuthError, createLoginSession, getActiveUser, loginUser, refreshLoginSession, registerUser, revokeRefreshSession } from './auth.service.js'
import { requireAuth } from './auth.middleware.js'
import { REFRESH_TOKEN_TTL_MS } from './token.service.js'

const router = Router()

function sendAuthError(res: Parameters<Parameters<Router['post']>[1]>[1], error: unknown) {
  if (error instanceof AuthError) {
    const status = error.code === 'USERNAME_EXISTS' || error.code === 'EMAIL_EXISTS' ? 409 : 401
    res.status(status).json({ success: false, code: error.code, message: error.message })
    return
  }
  console.error('Authentication request failed', error)
  res.status(500).json({ success: false, code: 'INTERNAL_SERVER_ERROR', message: '伺服器發生錯誤' })
}

function validateCredentials(body: unknown): { email: string; password: string } | string {
  if (!body || typeof body !== 'object') return 'Request body 格式錯誤'
  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || !email.trim() || email.trim().length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return '請提供有效的 Email'
  if (typeof password !== 'string' || password.length < 8 || password.length > 256) return '密碼長度必須介於 8 到 256 個字元'
  return { email: email.trim().toLowerCase(), password }
}

router.post('/register', async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const credentials = validateCredentials(body)
  if (username.length < 3 || username.length > 50 || typeof credentials === 'string') {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: username.length < 3 || username.length > 50 ? '使用者名稱長度必須介於 3 到 50 個字元' : credentials })
    return
  }
  try {
    const user = await registerUser({ username, ...credentials })
    res.status(201).json({ success: true, user })
  } catch (error) {
    sendAuthError(res, error)
  }
})

router.post('/login', async (req, res) => {
  const credentials = validateCredentials(req.body)
  if (typeof credentials === 'string') {
    res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: credentials })
    return
  }
  try {
    const session = await createLoginSession(await loginUser(credentials.email, credentials.password), req)
    res.cookie('refresh_token', session.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_TTL_MS,
    })
    res.json({ success: true, accessToken: session.accessToken, user: session.user })
  } catch (error) {
    sendAuthError(res, error)
  }
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token
  if (typeof refreshToken !== 'string' || !refreshToken) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '登入狀態已失效' })
    return
  }
  try {
    const session = await refreshLoginSession(refreshToken)
    res.cookie('refresh_token', session.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_TTL_MS,
    })
    res.json({ success: true, accessToken: session.accessToken, user: session.user })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '登入狀態已失效' })
      return
    }
    sendAuthError(res, error)
  }
})

router.post('/logout', async (req, res) => {
  try {
    if (typeof req.cookies?.refresh_token === 'string') await revokeRefreshSession(req.cookies.refresh_token)
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/auth' })
    res.json({ success: true })
  } catch (error) {
    sendAuthError(res, error)
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getActiveUser(req.auth!.userId)
    if (!user) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '登入狀態已失效' })
      return
    }
    res.json({ success: true, user })
  } catch (error) {
    sendAuthError(res, error)
  }
})

export default router

import argon2 from 'argon2'
import type { Request } from 'express'
import { isIP } from 'node:net'
import { pool } from './db.js'
import { createAccessToken, createRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from './token.service.js'

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
}

export interface LoginSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export class AuthError extends Error {
  constructor(
    public readonly code: 'USERNAME_EXISTS' | 'EMAIL_EXISTS' | 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'INVALID_REFRESH_TOKEN',
    message: string,
  ) {
    super(message)
  }
}

function isUniqueViolation(error: unknown): error is { code: string; constraint?: string } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === '23505'
}

function duplicateCode(constraint?: string): 'USERNAME_EXISTS' | 'EMAIL_EXISTS' {
  return constraint?.toLowerCase().includes('username') ? 'USERNAME_EXISTS' : 'EMAIL_EXISTS'
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existingUsername = await client.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [input.username])
    if (existingUsername.rowCount) throw new AuthError('USERNAME_EXISTS', '此使用者名稱已被使用')

    const existingEmail = await client.query('SELECT 1 FROM user_credentials WHERE email = $1 LIMIT 1', [input.email])
    if (existingEmail.rowCount) throw new AuthError('EMAIL_EXISTS', '此 Email 已被使用')

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id })
    const userResult = await client.query<{ id: string; username: string }>(
      'INSERT INTO users (username) VALUES ($1) RETURNING id, username',
      [input.username],
    )
    const user = userResult.rows[0]
    if (!user) throw new Error('User insert returned no row')

    await client.query(
      'INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)',
      [user.id, input.email, passwordHash],
    )
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Registration rollback failed', rollbackError))
    if (isUniqueViolation(error)) {
      const code = duplicateCode(error.constraint)
      throw new AuthError(code, code === 'USERNAME_EXISTS' ? '此使用者名稱已被使用' : '此 Email 已被使用')
    }
    throw error
  } finally {
    client.release()
  }
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const result = await pool.query<{ id: string; username: string; status: string; password_hash: string }>(
    `SELECT u.id, u.username, u.status, c.password_hash
     FROM users u
     INNER JOIN user_credentials c ON c.user_id = u.id
     WHERE c.email = $1
     LIMIT 1`,
    [email],
  )
  const user = result.rows[0]
  if (!user || !(await argon2.verify(user.password_hash, password))) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email 或密碼不正確')
  }
  if (user.status !== 'ACTIVE') {
    throw new AuthError('ACCOUNT_DISABLED', '此帳號目前無法登入')
  }
  return { id: user.id, username: user.username }
}

function requestIp(request: Request): string | null {
  const candidate = request.socket.remoteAddress ?? request.ip
  if (!candidate || !isIP(candidate)) return null
  return candidate.startsWith('::ffff:') ? candidate.slice(7) : candidate
}

export async function createLoginSession(user: AuthUser, request: Request): Promise<LoginSession> {
  const refreshToken = createRefreshToken()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [user.id, hashRefreshToken(refreshToken), request.get('user-agent') ?? null, requestIp(request)],
    )
    await client.query('COMMIT')
    return { user, refreshToken, accessToken: createAccessToken({ sub: user.id, username: user.username }) }
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Login session rollback failed', rollbackError))
    throw error
  } finally {
    client.release()
  }
}

export async function refreshLoginSession(refreshToken: string): Promise<LoginSession> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query<{ session_id: string; user_id: string; username: string }>(
      `SELECT s.id AS session_id, u.id AS user_id, u.username
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.status = 'ACTIVE'
       FOR UPDATE OF s`,
      [hashRefreshToken(refreshToken)],
    )
    const row = result.rows[0]
    if (!row) throw new AuthError('INVALID_REFRESH_TOKEN', '登入狀態已失效')
    const nextRefreshToken = createRefreshToken()
    await client.query(
      `UPDATE user_sessions
       SET refresh_token_hash = $1, last_used_at = NOW(), expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $2`,
      [hashRefreshToken(nextRefreshToken), row.session_id],
    )
    await client.query('COMMIT')
    const user = { id: row.user_id, username: row.username }
    return { user, refreshToken: nextRefreshToken, accessToken: createAccessToken({ sub: user.id, username: user.username }) }
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Refresh session rollback failed', rollbackError))
    throw error
  } finally {
    client.release()
  }
}

export async function revokeRefreshSession(refreshToken: string): Promise<void> {
  await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1 AND revoked_at IS NULL', [hashRefreshToken(refreshToken)])
}

export async function getActiveUser(userId: string): Promise<AuthUser | null> {
  const result = await pool.query<AuthUser>('SELECT id, username FROM users WHERE id = $1 AND status = $2 LIMIT 1', [userId, 'ACTIVE'])
  return result.rows[0] ?? null
}

import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import './db.js'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('Missing required authentication environment variable: JWT_SECRET')
}
const secret: string = jwtSecret

const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AccessTokenPayload {
  sub: string
  username: string
}

export function createAccessToken(user: AccessTokenPayload): string {
  return jwt.sign({ username: user.username }, secret, {
    subject: user.sub,
    expiresIn: ACCESS_TOKEN_TTL,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload
  if (typeof payload !== 'object' || typeof payload.sub !== 'string' || typeof payload.username !== 'string') {
    throw new Error('Invalid access token payload')
  }
  return { sub: payload.sub, username: payload.username }
}

export function createRefreshToken(): string {
  return randomBytes(64).toString('hex')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

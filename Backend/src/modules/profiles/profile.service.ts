import { pool, playlogPool } from '../../config/db.js'
import { displayNameValidationMessage, isValidDisplayName } from '../../utils/displayName.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505'
}

export interface ProfileRecord {
  id: string
  account_user_id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  banner_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileResponse {
  id: string
  accountUserId: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  bannerUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicProfileResponse {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  bannerUrl: string | null
  createdAt: string
}

export interface PlayerSearchResult {
  userId: string
  displayName: string
  avatar: string | null
  bio: string | null
}

export interface ProfileReviewResponse {
  id: string
  gameId: string
  gameName: string
  coverImageId: string | null
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
}

export class ProfileError extends Error {
  constructor(
    public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DISPLAY_NAME_TAKEN',
    message: string,
  ) {
    super(message)
  }
}

interface ProfileReviewRow {
  id: string
  game_id: string
  game_name: string
  cover_image_id: string | null
  rating: string
  content: string | null
  created_at: Date
  updated_at: Date
}

function mapProfileReview(row: ProfileReviewRow): ProfileReviewResponse {
  return {
    id: row.id,
    gameId: row.game_id,
    gameName: row.game_name,
    coverImageId: row.cover_image_id,
    rating: Number(row.rating),
    content: row.content,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function parseReviewPagination(limitValue: unknown, offsetValue: unknown): { limit: number; offset: number } {
  const limit = limitValue === undefined ? 10 : Number(limitValue)
  const offset = offsetValue === undefined ? 0 : Number(offsetValue)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new ProfileError('VALIDATION_ERROR', 'limit 必須是 1 到 100 的整數，offset 必須是非負整數')
  }
  return { limit, offset }
}

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function mapProfile(row: ProfileRecord): ProfileResponse {
  return {
    id: row.id,
    accountUserId: row.account_user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    bannerUrl: row.banner_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPublicProfile(row: ProfileRecord): PublicProfileResponse {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    bannerUrl: row.banner_url,
    createdAt: row.created_at,
  }
}

function parsePlayerSearchPagination(limitValue: unknown, offsetValue: unknown): { limit: number; offset: number } {
  const limit = limitValue === undefined ? 20 : Number(limitValue)
  const offset = offsetValue === undefined ? 0 : Number(offsetValue)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new ProfileError('VALIDATION_ERROR', 'limit 必須是 1 到 50 的整數，offset 必須是非負整數')
  }
  return { limit, offset }
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeProfileUpdate(body: unknown): {
  displayName?: string
  avatarUrl?: string | null
  bio?: string | null
  bannerUrl?: string | null
} {
  const patch = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const result: { displayName?: string; avatarUrl?: string | null; bio?: string | null; bannerUrl?: string | null } = {}

  const displayName = patch.display_name ?? patch.displayName
  if (displayName !== undefined) {
    if (typeof displayName !== 'string') throw new ProfileError('VALIDATION_ERROR', 'display_name 必須是字串')
    if (!isValidDisplayName(displayName)) throw new ProfileError('VALIDATION_ERROR', displayNameValidationMessage(displayName))
    result.displayName = displayName
  }

  const avatarUrl = patch.avatar_url ?? patch.avatarUrl
  if (avatarUrl !== undefined) {
    if (avatarUrl === null) {
      result.avatarUrl = null
    } else if (typeof avatarUrl !== 'string' || !avatarUrl.trim() || !isValidUrl(avatarUrl.trim())) {
      throw new ProfileError('VALIDATION_ERROR', 'avatar_url 必須是有效的 HTTP/HTTPS URL 或 null')
    } else {
      result.avatarUrl = avatarUrl.trim()
    }
  }

  const bio = patch.bio
  if (bio !== undefined) {
    if (bio === null) {
      result.bio = null
    } else if (typeof bio !== 'string' || bio.length > 500) {
      throw new ProfileError('VALIDATION_ERROR', 'bio 必須是長度 500 以內的字串或 null')
    } else {
      result.bio = bio.trim()
    }
  }

  const bannerUrl = patch.banner_url ?? patch.bannerUrl
  if (bannerUrl !== undefined) {
    if (bannerUrl === null) {
      result.bannerUrl = null
    } else if (typeof bannerUrl !== 'string' || !bannerUrl.trim() || !isValidUrl(bannerUrl.trim())) {
      throw new ProfileError('VALIDATION_ERROR', 'banner_url 必須是有效的 HTTP/HTTPS URL 或 null')
    } else {
      result.bannerUrl = bannerUrl.trim()
    }
  }

  if (Object.keys(result).length === 0) {
    throw new ProfileError('VALIDATION_ERROR', '至少需要提供一個可更新欄位')
  }

  return result
}

export async function checkDisplayNameAvailability(displayName: string, excludeProfileId?: string): Promise<boolean> {
  if (!isValidDisplayName(displayName)) return false
  const values: unknown[] = [displayName]
  let exclusion = ''
  if (excludeProfileId) {
    if (!UUID_PATTERN.test(excludeProfileId)) return false
    values.push(excludeProfileId)
    exclusion = ' AND id <> $2'
  }

  const result = await playlogPool.query(
    `SELECT 1 FROM profiles
     WHERE lower(btrim(display_name)) = lower(btrim($1))${exclusion}
     LIMIT 1`,
    values,
  )
  return !result.rowCount
}

export async function checkMyDisplayNameAvailability(userId: string, displayName: string): Promise<boolean> {
  const profile = await playlogPool.query<{ id: string }>(
    'SELECT id FROM profiles WHERE account_user_id = $1 LIMIT 1',
    [userId],
  )
  return checkDisplayNameAvailability(displayName, profile.rows[0]?.id)
}

export async function getOrCreateMyProfile(userId: string): Promise<ProfileResponse> {
  const existing = await playlogPool.query<ProfileRecord>(
    'SELECT * FROM profiles WHERE account_user_id = $1 LIMIT 1',
    [userId],
  )

  if (existing.rowCount && existing.rows[0]) {
    return mapProfile(existing.rows[0])
  }

  const accountUser = await pool.query<{ username: string }>(
    'SELECT username FROM users WHERE id = $1 AND status = $2 LIMIT 1',
    [userId, 'ACTIVE'],
  )

  const displayName = accountUser.rows[0]?.username ?? 'Player'

  await playlogPool.query(
    `INSERT INTO profiles (account_user_id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (account_user_id) DO NOTHING`,
    [userId, displayName],
  )

  const created = await playlogPool.query<ProfileRecord>(
    'SELECT * FROM profiles WHERE account_user_id = $1 LIMIT 1',
    [userId],
  )

  const profile = created.rows[0]
  if (!profile) {
    throw new Error('Failed to create profile')
  }

  return mapProfile(profile)
}

export async function getPublicProfile(profileId: string): Promise<PublicProfileResponse | null> {
  const result = await playlogPool.query<ProfileRecord>(
    'SELECT * FROM profiles WHERE id = $1 LIMIT 1',
    [profileId],
  )

  return result.rows[0] ? mapPublicProfile(result.rows[0]) : null
}

export async function searchPlayers(
  queryValue: unknown,
  limitValue: unknown,
  offsetValue: unknown,
): Promise<{ players: PlayerSearchResult[]; total: number; limit: number; offset: number }> {
  const query = typeof queryValue === 'string' ? queryValue.trim() : ''
  const { limit, offset } = parsePlayerSearchPagination(limitValue, offsetValue)
  if (!query) return { players: [], total: 0, limit, offset }
  if (query.length > 100) {
    throw new ProfileError('VALIDATION_ERROR', '搜尋關鍵字不可超過 100 個字元')
  }

  const [countResult, result] = await Promise.all([
    playlogPool.query<{ total: string }>(
      'SELECT COUNT(*)::text AS total FROM profiles WHERE display_name ILIKE $1',
      [`%${query}%`],
    ),
    playlogPool.query<{
    user_id: string
    display_name: string
    avatar_url: string | null
    bio: string | null
  }>(
    `SELECT id AS user_id, display_name, avatar_url, bio
     FROM profiles
     WHERE display_name ILIKE $1
     ORDER BY display_name ASC, id ASC
     LIMIT $2 OFFSET $3`,
    [`%${query}%`, limit, offset],
    ),
  ])

  return {
    players: result.rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      avatar: row.avatar_url,
      bio: row.bio,
    })),
    total: Number(countResult.rows[0]?.total ?? 0),
    limit,
    offset,
  }
}

export async function listProfileReviews(
  profileId: string,
  limitValue: unknown,
  offsetValue: unknown,
): Promise<{ reviews: ProfileReviewResponse[]; hasMore: boolean; limit: number; offset: number }> {
  if (!isValidUuid(profileId)) {
    throw new ProfileError('VALIDATION_ERROR', 'Profile ID 格式不正確')
  }
  const { limit, offset } = parseReviewPagination(limitValue, offsetValue)
  const result = await playlogPool.query<ProfileReviewRow>(
    `SELECT r.id, r.game_id,
            COALESCE(gl.name, g.name) AS game_name,
            g.cover_image_id,
            r.rating::text, r.content, r.created_at, r.updated_at
     FROM reviews r
     INNER JOIN profiles p ON p.account_user_id = r.user_id
     INNER JOIN games g ON g.id = r.game_id
     LEFT JOIN game_localizations gl
       ON gl.game_id = g.id AND gl.locale = $2
     WHERE p.id = $1
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $3 OFFSET $4`,
    [profileId, 'zh-TW', limit, offset],
  )
  return {
    reviews: result.rows.map(mapProfileReview),
    hasMore: result.rows.length === limit,
    limit,
    offset,
  }
}

export async function updateMyProfile(userId: string, body: unknown): Promise<ProfileResponse> {
  const update = normalizeProfileUpdate(body)

  const existing = await playlogPool.query<ProfileRecord>(
    'SELECT * FROM profiles WHERE account_user_id = $1 LIMIT 1',
    [userId],
  )

  if (!existing.rowCount || !existing.rows[0]) {
    await getOrCreateMyProfile(userId)
  }

  const fields: string[] = []
  const values: unknown[] = []
  let index = 1

  if (update.displayName !== undefined) {
    fields.push(`display_name = $${index}`)
    values.push(update.displayName)
    index += 1
  }
  if (update.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${index}`)
    values.push(update.avatarUrl)
    index += 1
  }
  if (update.bio !== undefined) {
    fields.push(`bio = $${index}`)
    values.push(update.bio)
    index += 1
  }
  if (update.bannerUrl !== undefined) {
    fields.push(`banner_url = $${index}`)
    values.push(update.bannerUrl)
    index += 1
  }

  fields.push(`updated_at = NOW()`)
  values.push(userId)

  let result
  try {
    result = await playlogPool.query<ProfileRecord>(
      `UPDATE profiles
       SET ${fields.join(', ')}
       WHERE account_user_id = $${index}
       RETURNING *`,
      values,
    )
  } catch (error) {
    if (isUniqueViolation(error)) throw new ProfileError('DISPLAY_NAME_TAKEN', '此玩家名稱已被使用')
    throw error
  }

  const updated = result.rows[0]
  if (!updated) {
    throw new ProfileError('NOT_FOUND', 'Profile 不存在')
  }

  return mapProfile(updated)
}

import { pool, playlogPool } from './db.js'

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

export class ProfileError extends Error {
  constructor(
    public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
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
    const trimmed = displayName.trim()
    if (!trimmed || trimmed.length > 50) throw new ProfileError('VALIDATION_ERROR', 'display_name 必須介於 1 到 50 個字元')
    result.displayName = trimmed
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

  const result = await playlogPool.query<ProfileRecord>(
    `UPDATE profiles
     SET ${fields.join(', ')}
     WHERE account_user_id = $${index}
     RETURNING *`,
    values,
  )

  const updated = result.rows[0]
  if (!updated) {
    throw new ProfileError('NOT_FOUND', 'Profile 不存在')
  }

  return mapProfile(updated)
}

import { pool, playlogPool } from '../../config/db.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type ReviewSort = 'latest' | 'oldest' | 'highest' | 'lowest'

export interface ReviewAuthor {
  profileId: string | null
  displayName: string
  avatarUrl: string | null
}

export interface ReviewResponse {
  id: string
  gameId: string
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
  author: ReviewAuthor
}

export interface ReviewInput {
  rating: number
  content: string | null
}

interface ReviewRow {
  id: string
  game_id: string
  rating: string
  content: string | null
  created_at: Date
  updated_at: Date
  profile_id: string | null
  display_name: string | null
  avatar_url: string | null
}

export class ReviewError extends Error {
  constructor(
    public readonly code: 'VALIDATION_ERROR' | 'GAME_NOT_FOUND' | 'REVIEW_NOT_FOUND' | 'DUPLICATE_REVIEW' | 'ACCOUNT_NOT_FOUND',
    message: string,
  ) {
    super(message)
    this.name = 'ReviewError'
  }
}

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function mapReview(row: ReviewRow): ReviewResponse {
  return {
    id: row.id,
    gameId: row.game_id,
    rating: Number(row.rating),
    content: row.content,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    author: {
      profileId: row.profile_id,
      displayName: row.display_name ?? 'PlayLog 玩家',
      avatarUrl: row.avatar_url,
    },
  }
}

function validateRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.5 || value > 5 || !Number.isInteger(value * 2)) {
    throw new ReviewError('VALIDATION_ERROR', 'rating 必須是 0.5 到 5.0 之間的 0.5 倍數')
  }
  return value
}

function normalizeContent(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || value.length > 5000) {
    throw new ReviewError('VALIDATION_ERROR', 'content 必須是 5000 字元以內的字串或 null')
  }
  const normalized = value.trim()
  return normalized || null
}

function reviewQuery(orderBy: string): string {
  return `SELECT r.id, r.game_id, r.rating::text, r.content, r.created_at, r.updated_at,
                 p.id AS profile_id, p.display_name, p.avatar_url
          FROM reviews r
          LEFT JOIN profiles p ON p.account_user_id = r.user_id
          WHERE r.game_id = $1
          ORDER BY ${orderBy}`
}

export function parsePagination(limitValue: unknown, offsetValue: unknown): { limit: number; offset: number } {
  const limit = limitValue === undefined ? 20 : Number(limitValue)
  const offset = offsetValue === undefined ? 0 : Number(offsetValue)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new ReviewError('VALIDATION_ERROR', 'limit 必須是 1 到 100 的整數，offset 必須是非負整數')
  }
  return { limit, offset }
}

export function parseSort(value: unknown): ReviewSort {
  if (value === undefined) return 'latest'
  if (value !== 'latest' && value !== 'oldest' && value !== 'highest' && value !== 'lowest') {
    throw new ReviewError('VALIDATION_ERROR', 'sort 必須是 latest、oldest、highest 或 lowest')
  }
  return value
}

function sortSql(sort: ReviewSort): string {
  if (sort === 'oldest') return 'r.created_at ASC, r.id ASC'
  if (sort === 'highest') return 'r.rating DESC, r.created_at DESC, r.id DESC'
  if (sort === 'lowest') return 'r.rating ASC, r.created_at ASC, r.id ASC'
  return 'r.created_at DESC, r.id DESC'
}

async function ensureGameExists(gameId: string): Promise<void> {
  const result = await playlogPool.query('SELECT 1 FROM games WHERE id = $1 LIMIT 1', [gameId])
  if (!result.rowCount) throw new ReviewError('GAME_NOT_FOUND', '找不到指定遊戲')
}

async function getReviewRow(reviewId: string, userId?: string): Promise<ReviewRow | null> {
  const values: string[] = [reviewId]
  const ownerClause = userId ? ' AND r.user_id = $2' : ''
  if (userId) values.push(userId)
  const result = await playlogPool.query<ReviewRow>(
    `SELECT r.id, r.game_id, r.rating::text, r.content, r.created_at, r.updated_at,
            p.id AS profile_id, p.display_name, p.avatar_url
     FROM reviews r
     LEFT JOIN profiles p ON p.account_user_id = r.user_id
     WHERE r.id = $1${ownerClause}
     LIMIT 1`,
    values,
  )
  return result.rows[0] ?? null
}

export async function listReviews(gameId: string, limit: number, offset: number, sort: ReviewSort): Promise<{ reviews: ReviewResponse[]; hasMore: boolean }> {
  await ensureGameExists(gameId)
  const result = await playlogPool.query<ReviewRow>(`${reviewQuery(sortSql(sort))} LIMIT $2 OFFSET $3`, [gameId, limit, offset])
  return { reviews: result.rows.map(mapReview), hasMore: result.rows.length === limit }
}

export async function getRatingSummary(gameId: string): Promise<{ averageRating: number | null; ratingCount: number }> {
  await ensureGameExists(gameId)
  const result = await playlogPool.query<{ average_rating: string | null; rating_count: string }>(
    'SELECT AVG(rating)::text AS average_rating, COUNT(*)::text AS rating_count FROM reviews WHERE game_id = $1',
    [gameId],
  )
  const row = result.rows[0]
  return {
    averageRating: row?.average_rating === null || row?.average_rating === undefined ? null : Number(row.average_rating),
    ratingCount: Number(row?.rating_count ?? 0),
  }
}

export async function getMyReview(gameId: string, userId: string): Promise<ReviewResponse | null> {
  await ensureGameExists(gameId)
  const result = await playlogPool.query<ReviewRow>(
    `SELECT r.id, r.game_id, r.rating::text, r.content, r.created_at, r.updated_at,
            p.id AS profile_id, p.display_name, p.avatar_url
     FROM reviews r
     LEFT JOIN profiles p ON p.account_user_id = r.user_id
     WHERE r.game_id = $1 AND r.user_id = $2
     LIMIT 1`,
    [gameId, userId],
  )
  return result.rows[0] ? mapReview(result.rows[0]) : null
}

export async function createReview(gameId: string, userId: string, input: ReviewInput): Promise<ReviewResponse> {
  await ensureGameExists(gameId)
  const account = await pool.query('SELECT 1 FROM users WHERE id = $1 AND status = $2 LIMIT 1', [userId, 'ACTIVE'])
  if (!account.rowCount) throw new ReviewError('ACCOUNT_NOT_FOUND', '帳號不存在或已停用')

  const rating = validateRating(input.rating)
  const content = normalizeContent(input.content)
  try {
    const result = await playlogPool.query<ReviewRow>(
      `INSERT INTO reviews (game_id, user_id, rating, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, game_id, rating::text, content, created_at, updated_at,
                 NULL::uuid AS profile_id, NULL::varchar AS display_name, NULL::text AS avatar_url`,
      [gameId, userId, rating, content],
    )
    const created = result.rows[0]
    if (!created) throw new Error('Review insert returned no row')
    const fullReview = await getReviewRow(created.id)
    return fullReview ? mapReview(fullReview) : mapReview(created)
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      throw new ReviewError('DUPLICATE_REVIEW', '你已經評論過這款遊戲')
    }
    throw error
  }
}

export async function updateReview(reviewId: string, userId: string, body: unknown): Promise<ReviewResponse> {
  const existing = await getReviewRow(reviewId, userId)
  if (!existing) throw new ReviewError('REVIEW_NOT_FOUND', '找不到可修改的評論')
  const patch = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const fields: string[] = []
  const values: unknown[] = []
  if ('rating' in patch) {
    fields.push(`rating = $${fields.length + 1}`)
    values.push(validateRating(patch.rating))
  }
  if ('content' in patch) {
    fields.push(`content = $${fields.length + 1}`)
    values.push(normalizeContent(patch.content))
  }
  if (fields.length === 0) throw new ReviewError('VALIDATION_ERROR', '至少需要提供 rating 或 content')
  fields.push('updated_at = NOW()')
  values.push(reviewId, userId)
  const result = await playlogPool.query(
    `UPDATE reviews SET ${fields.join(', ')}
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING id`,
    values,
  )
  if (!result.rowCount) throw new ReviewError('REVIEW_NOT_FOUND', '找不到可修改的評論')
  const updated = await getReviewRow(reviewId, userId)
  if (!updated) throw new ReviewError('REVIEW_NOT_FOUND', '找不到可修改的評論')
  return mapReview(updated)
}

export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  const result = await playlogPool.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [reviewId, userId])
  if (!result.rowCount) throw new ReviewError('REVIEW_NOT_FOUND', '找不到可刪除的評論')
}

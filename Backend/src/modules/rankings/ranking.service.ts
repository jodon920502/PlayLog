import { playlogPool } from '../../config/db.js'

export type RankingSort = 'rating' | 'lowest' | 'reviews' | 'newest'

export interface RankingGame {
  id: string
  name: string
  coverImageId: string | null
  firstReleaseDate: string | null
  averageRating: number | null
  reviewCount: number
  rank: number | null
}

interface RankingRow {
  id: string
  name: string
  cover_image_id: string | null
  first_release_date: Date | null
  average_rating: string | null
  review_count: number
  rank: string | null
}

const rankingOrder: Record<RankingSort, string> = {
  rating: 'review_stats.average_rating DESC NULLS LAST, review_stats.review_count DESC, g.id ASC',
  lowest: 'review_stats.average_rating ASC NULLS LAST, review_stats.review_count DESC, g.id ASC',
  reviews: 'COALESCE(review_stats.review_count, 0) DESC, review_stats.average_rating DESC NULLS LAST, g.id ASC',
  newest: 'g.first_release_date DESC NULLS LAST, review_stats.review_count DESC, g.id ASC',
}

export function parseRankingSort(value: unknown): RankingSort {
  if (value === undefined) return 'rating'
  if (value === 'rating' || value === 'lowest' || value === 'reviews' || value === 'newest') return value
  throw new Error('sort 必須是 rating、lowest、reviews 或 newest')
}

export function parseRankingPagination(limitValue: unknown, offsetValue: unknown): { limit: number; offset: number } {
  const limit = limitValue === undefined ? 20 : Number(limitValue)
  const offset = offsetValue === undefined ? 0 : Number(offsetValue)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new Error('limit 必須是 1 到 50 的整數，offset 必須是非負整數')
  }
  return { limit, offset }
}

export async function listRankings(limit: number, offset: number, sort: RankingSort): Promise<{ games: RankingGame[]; total: number; hasMore: boolean }> {
  const orderBy = rankingOrder[sort]
  const result = await playlogPool.query<RankingRow>(
    `WITH review_stats AS (
       SELECT game_id, AVG(rating)::numeric AS average_rating, COUNT(*)::int AS review_count
       FROM reviews
       GROUP BY game_id
     ),
     ranked_games AS (
       SELECT g.id, COALESCE(gl.name, g.name) AS name, g.cover_image_id, g.first_release_date,
              review_stats.average_rating, COALESCE(review_stats.review_count, 0)::int AS review_count,
              CASE WHEN COALESCE(review_stats.review_count, 0) > 0
                   THEN ROW_NUMBER() OVER (
                     ORDER BY CASE WHEN COALESCE(review_stats.review_count, 0) > 0 THEN 0 ELSE 1 END,
                              ${orderBy}
                   )
                   ELSE NULL
              END AS rank
       FROM games g
       LEFT JOIN game_localizations gl ON gl.game_id = g.id AND gl.locale = 'zh-TW'
       LEFT JOIN review_stats ON review_stats.game_id = g.id
       WHERE g.status = 'ACTIVE'
     )
     SELECT id, name, cover_image_id, first_release_date, average_rating, review_count, rank
     FROM ranked_games
     ORDER BY ${orderBy.replaceAll('g.', '').replaceAll('review_stats.', '')}
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
  const count = await playlogPool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM games WHERE status = 'ACTIVE'`,
  )
  const total = Number(count.rows[0]?.total ?? 0)
  return {
    games: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      coverImageId: row.cover_image_id,
      firstReleaseDate: row.first_release_date?.toISOString() ?? null,
      averageRating: row.average_rating === null ? null : Number(row.average_rating),
      reviewCount: Number(row.review_count),
      rank: row.rank === null ? null : Number(row.rank),
    })),
    total,
    hasMore: offset + result.rows.length < total,
  }
}

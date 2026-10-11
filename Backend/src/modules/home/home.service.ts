import { playlogPool } from '../../config/db.js'

const STEAM_LOCALE = 'zh-TW'

export interface HomeGame {
  id: string
  name: string
  coverImageId: string | null
  firstReleaseDate: string | null
  developerName: string | null
  summary: string | null
  averageRating: number | null
  reviewCount: number
}

export interface HomeReview {
  id: string
  gameId: string
  gameName: string
  coverImageId: string | null
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
  authorProfileId: string | null
  authorDisplayName: string
  authorAvatarUrl: string | null
}

export interface HomeGenre {
  id: string
  name: string
  gameCount: number
}

export interface HomeResponse {
  featuredGame: HomeGame | null
  popularGames: HomeGame[]
  recentReviews: HomeReview[]
  genres: HomeGenre[]
  activitySummary: {
    weeklyReviewCount: number
    totalReviewCount: number
    reviewerCount: number
  }
}

interface HomeGameRow {
  id: string
  name: string
  cover_image_id: string | null
  first_release_date: Date | null
  developer_name: string | null
  summary: string | null
  average_rating: string | null
  review_count: string
}

interface HomeReviewRow {
  id: string
  game_id: string
  game_name: string
  cover_image_id: string | null
  rating: string
  content: string | null
  created_at: Date
  updated_at: Date
  author_profile_id: string | null
  author_display_name: string | null
  author_avatar_url: string | null
}

interface HomeGenreRow {
  id: string
  name: string
  game_count: string
}

function mapGame(row: HomeGameRow): HomeGame {
  return {
    id: row.id,
    name: row.name,
    coverImageId: row.cover_image_id,
    firstReleaseDate: row.first_release_date?.toISOString() ?? null,
    developerName: row.developer_name,
    summary: row.summary,
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
    reviewCount: Number(row.review_count),
  }
}

function mapReview(row: HomeReviewRow): HomeReview {
  return {
    id: row.id,
    gameId: row.game_id,
    gameName: row.game_name,
    coverImageId: row.cover_image_id,
    rating: Number(row.rating),
    content: row.content,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    authorProfileId: row.author_profile_id,
    authorDisplayName: row.author_display_name ?? 'PlayLog 玩家',
    authorAvatarUrl: row.author_avatar_url,
  }
}

const gameProjection = `
  g.id, COALESCE(gl.name, g.name) AS name, g.cover_image_id,
  g.first_release_date, g.developer_name,
  COALESCE(gl.summary, g.summary) AS summary,
  AVG(r.rating)::numeric(10,2)::text AS average_rating,
  COUNT(r.id)::text AS review_count
`

async function getFeaturedGame(): Promise<HomeGame | null> {
  const recent = await playlogPool.query<HomeGameRow>(
    `SELECT ${gameProjection}
     FROM games g
     LEFT JOIN game_localizations gl ON gl.game_id = g.id AND gl.locale = $1
     INNER JOIN reviews r ON r.game_id = g.id AND r.created_at >= NOW() - INTERVAL '7 days'
     WHERE g.status = 'ACTIVE'
     GROUP BY g.id, gl.name, gl.summary
     ORDER BY COUNT(r.id) DESC, AVG(r.rating) DESC, MAX(r.created_at) DESC, g.id
     LIMIT 1`,
    [STEAM_LOCALE],
  )
  if (recent.rows[0]) return mapGame(recent.rows[0])

  const fallback = await playlogPool.query<HomeGameRow>(
    `SELECT ${gameProjection}
     FROM games g
     LEFT JOIN game_localizations gl ON gl.game_id = g.id AND gl.locale = $1
     LEFT JOIN reviews r ON r.game_id = g.id
     WHERE g.status = 'ACTIVE'
     GROUP BY g.id, gl.name, gl.summary
     ORDER BY g.created_at DESC, g.id DESC
     LIMIT 1`,
    [STEAM_LOCALE],
  )
  return fallback.rows[0] ? mapGame(fallback.rows[0]) : null
}

async function getPopularGames(): Promise<HomeGame[]> {
  const result = await playlogPool.query<HomeGameRow>(
    `SELECT ${gameProjection}
     FROM games g
     LEFT JOIN game_localizations gl ON gl.game_id = g.id AND gl.locale = $1
     LEFT JOIN reviews r ON r.game_id = g.id
     WHERE g.status = 'ACTIVE'
     GROUP BY g.id, gl.name, gl.summary
     HAVING COUNT(r.id) > 0
     ORDER BY COUNT(r.id) DESC, AVG(r.rating) DESC, g.id
     LIMIT 4`,
    [STEAM_LOCALE],
  )
  return result.rows.map(mapGame)
}

async function getRecentReviews(): Promise<HomeReview[]> {
  const result = await playlogPool.query<HomeReviewRow>(
    `SELECT r.id, r.game_id, COALESCE(gl.name, g.name) AS game_name,
            g.cover_image_id, r.rating::text, r.content, r.created_at, r.updated_at,
            p.id AS author_profile_id, p.display_name AS author_display_name,
            p.avatar_url AS author_avatar_url
     FROM reviews r
     INNER JOIN games g ON g.id = r.game_id AND g.status = 'ACTIVE'
     LEFT JOIN game_localizations gl ON gl.game_id = g.id AND gl.locale = $1
     LEFT JOIN profiles p ON p.account_user_id = r.user_id
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT 4`,
    [STEAM_LOCALE],
  )
  return result.rows.map(mapReview)
}

async function getGenres(): Promise<HomeGenre[]> {
  const result = await playlogPool.query<HomeGenreRow>(
    `SELECT ge.id, ge.name, COUNT(DISTINCT gg.game_id)::text AS game_count
     FROM genres ge
     INNER JOIN game_genres gg ON gg.genre_id = ge.id
     INNER JOIN games g ON g.id = gg.game_id AND g.status = 'ACTIVE'
     GROUP BY ge.id, ge.name
     ORDER BY COUNT(DISTINCT gg.game_id) DESC, ge.name
     LIMIT 12`,
  )
  return result.rows.map((row) => ({ id: row.id, name: row.name, gameCount: Number(row.game_count) }))
}

async function getActivitySummary(): Promise<HomeResponse['activitySummary']> {
  const result = await playlogPool.query<{ weekly_review_count: string; total_review_count: string; reviewer_count: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS weekly_review_count,
       COUNT(*)::text AS total_review_count,
       COUNT(DISTINCT user_id)::text AS reviewer_count
     FROM reviews`,
  )
  const row = result.rows[0]
  return {
    weeklyReviewCount: Number(row?.weekly_review_count ?? 0),
    totalReviewCount: Number(row?.total_review_count ?? 0),
    reviewerCount: Number(row?.reviewer_count ?? 0),
  }
}

export async function getHomeData(): Promise<HomeResponse> {
  const [featuredGame, popularGames, recentReviews, genres, activitySummary] = await Promise.all([
    getFeaturedGame(),
    getPopularGames(),
    getRecentReviews(),
    getGenres(),
    getActivitySummary(),
  ])
  return { featuredGame, popularGames, recentReviews, genres, activitySummary }
}

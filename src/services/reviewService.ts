import { API_URL, getAccessToken } from '../lib/authApi'

export type ReviewSort = 'latest' | 'oldest' | 'highest' | 'lowest'

export interface CommunityReview {
  id: string
  gameId: string
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
  author: {
    profileId: string | null
    displayName: string
    avatarUrl: string | null
  }
  gameName?: string
  coverImageId?: string | null
}

export interface ReviewPage {
  reviews: CommunityReview[]
  pagination: {
    total?: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface RatingSummary {
  averageRating: number | null
  ratingCount: number
}

interface ApiError {
  success?: boolean
  error?: { message?: string }
  message?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
  if (response.status === 204) return undefined as T
  const payload = await response.json() as T & ApiError
  if (!response.ok || payload.success !== true) {
    throw new Error(payload.error?.message ?? payload.message ?? '評論服務暫時無法使用')
  }
  return payload
}

export async function getReviews(gameId: string, sort: ReviewSort): Promise<ReviewPage> {
  const params = new URLSearchParams({ limit: '100', offset: '0', sort })
  return request<ReviewPage & { success: true }>(`/api/games/${encodeURIComponent(gameId)}/reviews?${params}`)
}

export async function getPublicReviews(sort: ReviewSort, limit = 20, offset = 0): Promise<ReviewPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), sort })
  return request<ReviewPage & { success: true }>(`/api/reviews?${params}`)
}

export async function getRatingSummary(gameId: string): Promise<RatingSummary> {
  return request<RatingSummary & { success: true }>(`/api/games/${encodeURIComponent(gameId)}/rating-summary`)
}

export async function getMyReview(gameId: string): Promise<CommunityReview | null> {
  const result = await request<{ success: true; review: CommunityReview | null }>(`/api/games/${encodeURIComponent(gameId)}/reviews/me`)
  return result.review
}

export async function createReview(gameId: string, rating: number, content: string): Promise<CommunityReview> {
  const result = await request<{ success: true; review: CommunityReview }>(`/api/games/${encodeURIComponent(gameId)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content }),
  })
  return result.review
}

export async function updateReview(reviewId: string, rating: number, content: string): Promise<CommunityReview> {
  const result = await request<{ success: true; review: CommunityReview }>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content }),
  })
  return result.review
}

export async function deleteReview(reviewId: string): Promise<void> {
  await request<{ success: true }>(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' })
}

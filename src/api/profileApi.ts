import { API_URL, fetchWithAuth } from '../lib/authApi'
import type { Game } from '../types/game'

export interface PlayProfile {
  id: string
  accountUserId: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  bannerUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  bannerUrl: string | null
  createdAt: string
}

export interface ProfileReview {
  id: string
  gameId: string
  gameName: string
  coverImageId: string | null
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileReviewPage {
  reviews: ProfileReview[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface PublicFavoriteGamesPage {
  games: Game[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface ProfileApiResponse<T> {
  success: boolean
  profile?: T
  message?: string
}

interface ProfileReviewsApiResponse {
  success: boolean
  reviews?: ProfileReview[]
  pagination?: ProfileReviewPage['pagination']
  message?: string
}

export async function checkDisplayNameAvailability(displayName: string, forCurrentUser = false, signal?: AbortSignal): Promise<boolean> {
  const params = new URLSearchParams({ displayName })
  const path = forCurrentUser ? '/api/profile/me/display-name-availability' : '/api/profile/display-name-availability'
  const response = forCurrentUser
    ? await fetchWithAuth(`${API_URL}${path}?${params}`, { credentials: 'include', signal })
    : await fetch(`${API_URL}${path}?${params}`, { credentials: 'include', signal })
  const data = await response.json() as { success: boolean; available?: boolean; message?: string }
  if (!response.ok || !data.success || data.available === undefined) {
    throw new Error(data.message ?? '無法檢查玩家名稱')
  }
  return data.available
}

export async function getMyProfile(accessToken: string): Promise<PlayProfile> {
  const response = await fetchWithAuth(`${API_URL}/api/profile/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })

  const data = await response.json() as ProfileApiResponse<PlayProfile>
  if (!response.ok || !data.success || !data.profile) {
    throw new Error(data.message ?? '無法取得個人資料')
  }

  return data.profile
}

export async function updateMyProfile(accessToken: string, data: {
  display_name?: string | null
  displayName?: string | null
  avatar_url?: string | null
  avatarUrl?: string | null
  bio?: string | null
  banner_url?: string | null
  bannerUrl?: string | null
}): Promise<PlayProfile> {
  const response = await fetchWithAuth(`${API_URL}/api/profile/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  const result = await response.json() as ProfileApiResponse<PlayProfile>
  if (!response.ok || !result.success || !result.profile) {
    throw new Error(result.message ?? '無法更新個人資料')
  }

  return result.profile
}

export async function getPublicProfile(profileId: string): Promise<PublicProfile> {
  const response = await fetch(`${API_URL}/api/profile/${profileId}`, { credentials: 'include' })
  const data = await response.json() as ProfileApiResponse<PublicProfile>
  if (!response.ok || !data.success || !data.profile) {
    throw new Error(data.message ?? '無法取得公開資料')
  }

  return data.profile
}

export async function getProfileReviews(profileId: string, limit = 10, offset = 0): Promise<ProfileReviewPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const response = await fetch(`${API_URL}/api/profile/${encodeURIComponent(profileId)}/reviews?${params}`, { credentials: 'include' })
  const data = await response.json() as ProfileReviewsApiResponse
  if (!response.ok || !data.success || !data.reviews || !data.pagination) {
    throw new Error(data.message ?? '無法取得玩家評測')
  }

  return { reviews: data.reviews, pagination: data.pagination }
}

export async function getPublicProfileFavorites(profileId: string, limit = 20, offset = 0): Promise<PublicFavoriteGamesPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const response = await fetch(`${API_URL}/api/profile/${encodeURIComponent(profileId)}/favorites?${params}`, { credentials: 'include' })
  const data = await response.json() as { success: boolean; games?: Game[]; pagination?: PublicFavoriteGamesPage['pagination']; message?: string }
  if (!response.ok || !data.success || !data.games || !data.pagination) {
    throw new Error(data.message ?? '無法取得收藏遊戲')
  }
  return { games: data.games, pagination: data.pagination }
}

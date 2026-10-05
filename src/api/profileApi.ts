import { API_URL } from '../lib/authApi'

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

interface ProfileApiResponse<T> {
  success: boolean
  profile?: T
  message?: string
}

export async function getMyProfile(accessToken: string): Promise<PlayProfile> {
  const response = await fetch(`${API_URL}/api/profile/me`, {
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
  const response = await fetch(`${API_URL}/api/profile/me`, {
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

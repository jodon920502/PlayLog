import { API_URL } from '../lib/authApi'

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

export interface HomeData {
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

export async function getHomeData(): Promise<HomeData> {
  const response = await fetch(`${API_URL}/api/home`, { credentials: 'include' })
  const payload = await response.json() as HomeData & { success?: boolean; message?: string }
  if (!response.ok || payload.success !== true) {
    throw new Error(payload.message ?? '首頁資料暫時無法使用')
  }
  return payload
}

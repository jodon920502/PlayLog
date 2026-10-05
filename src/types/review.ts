import type { Game } from './game'
import type { User } from './user'

export interface ReviewScore {
  story: number
  gameplay: number
  visuals: number
  music: number
}

export interface Review {
  id: string
  user: User
  game: Game
  publishedAt: string
  rating: number
  playtime: string
  platform: string
  summary: string
  scores: ReviewScore
  likes: number
  comments: number
}

import { games } from './mockGames'
import type { Review } from '../types/review'

const users = [
  { id: 'u1', name: 'Mina Chen', handle: '@minac', avatar: 'https://i.pravatar.cc/100?img=47' },
  { id: 'u2', name: 'Alex Wang', handle: '@alexplays', avatar: 'https://i.pravatar.cc/100?img=12' },
  { id: 'u3', name: 'Kuro', handle: '@kuro_log', avatar: 'https://i.pravatar.cc/100?img=33' },
]

export const reviews: Review[] = [
  { id: 'r1', user: users[0], game: games[0], publishedAt: '2 小時前', rating: 4.9, playtime: '128 小時', platform: 'PC', summary: '每一次探索都充滿驚喜。交界地的尺度與細節，讓我在通關後仍然想回去看看那些錯過的角落。', scores: { story: 4.8, gameplay: 5, visuals: 4.9, music: 4.8 }, likes: 184, comments: 28 },
  { id: 'r2', user: users[1], game: games[1], publishedAt: '昨天', rating: 5, playtime: '86 小時', platform: 'PlayStation', summary: '這是我玩過最自由、最有沉浸感的 RPG。每一個選擇都像真的會改變世界。', scores: { story: 5, gameplay: 4.9, visuals: 4.8, music: 4.9 }, likes: 129, comments: 16 },
  { id: 'r3', user: users[2], game: games[2], publishedAt: '3 天前', rating: 4.6, playtime: '42 小時', platform: 'PC', summary: '節奏爽快，音樂和美術依然是 Supergiant 的頂尖水準，期待完整版本的內容。', scores: { story: 4.4, gameplay: 4.8, visuals: 4.7, music: 4.8 }, likes: 96, comments: 11 },
]

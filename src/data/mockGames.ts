import type { Game } from '../types/game'

export const featuredGame: Game = {
  id: 'elden-ring',
  name: 'ELDEN RING',
  developer: 'FromSoftware',
  description: '在交界地展開史詩般的冒險，探索遼闊世界、挑戰強大敵人，找出屬於你的道路。',
  cover: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=600&q=85',
  artwork: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=85',
  score: 4.8,
  reviewCount: 2486,
  genre: 'RPG',
  platforms: ['PC', 'PlayStation', 'Xbox'],
}

export const games: Game[] = [
  featuredGame,
  { id: 'baldurs-gate-3', name: "Baldur's Gate 3", developer: 'Larian Studios', description: '', cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=85', artwork: '', score: 4.9, reviewCount: 1832, genre: 'RPG', platforms: ['PC', 'PlayStation', 'Xbox'] },
  { id: 'hades-2', name: 'Hades II', developer: 'Supergiant Games', description: '', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=85', artwork: '', score: 4.7, reviewCount: 967, genre: '動作', platforms: ['PC', 'Nintendo'] },
  { id: 'zelda', name: 'Tears of the Kingdom', developer: 'Nintendo', description: '', cover: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=600&q=85', artwork: '', score: 4.8, reviewCount: 1204, genre: '冒險', platforms: ['Nintendo'] },
  { id: 'alan-wake', name: 'Alan Wake 2', developer: 'Remedy Entertainment', description: '', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=85', artwork: '', score: 4.6, reviewCount: 743, genre: '恐怖', platforms: ['PC', 'PlayStation', 'Xbox'] },
]

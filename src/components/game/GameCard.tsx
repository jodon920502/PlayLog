import { MessageCircle } from 'lucide-react'
import type { Game } from '../../types/game'
import GameScore from './GameScore'

export default function GameCard({ game }: { game: Game }) {
  return <article className="group overflow-hidden rounded-xl border border-white/[.07] bg-[#151821] transition hover:-translate-y-1 hover:border-[#f2c544]/40">
    <div className="relative aspect-[4/5] overflow-hidden"><img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={game.cover} alt={game.name} /><div className="poster-shine absolute inset-0" /></div>
    <div className="p-4"><h3 className="display-font line-clamp-2 min-h-11 text-[15px] font-semibold text-[#f2f1eb]">{game.name}</h3><div className="mt-2 flex items-center justify-between"><GameScore score={game.score} compact /><span className="text-[11px] text-[#777c88]">{game.genre}</span></div><div className="mt-3 flex items-center justify-between text-[11px] text-[#777c88]"><span>{game.platforms[0]} {game.platforms.length > 1 && `+${game.platforms.length - 1}`}</span><span className="flex items-center gap-1"><MessageCircle size={12} />{game.reviewCount.toLocaleString()}</span></div></div>
  </article>
}

import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getIgdbCoverUrl } from '../../services/gameService'
import type { Game } from '../../types/game'
import GameScore from './GameScore'

export default function GameCard({ game }: { game: Game }) {
  const title = game.displayName ?? game.name
  const cover = game.cover ?? getIgdbCoverUrl(game.coverImageId)
  const firstPlatform = game.platforms[0]
  const platformLabel = typeof firstPlatform === 'string'
    ? `${firstPlatform}${game.platforms.length > 1 ? ` +${game.platforms.length - 1}` : ''}`
    : firstPlatform ? `${firstPlatform.name}${game.platforms.length > 1 ? ` +${game.platforms.length - 1}` : ''}` : '平台資料待補'
  const genreLabel = game.genre ?? game.genres?.[0]?.name ?? '類型資料待補'

  return <Link to={`/game/${game.id}`} aria-label={`查看 ${title}`} className="group block overflow-hidden rounded-xl border border-white/[.07] bg-[#151821] transition hover:-translate-y-1 hover:border-[#f2c544]/40">
    <div className="relative aspect-[4/5] overflow-hidden">{cover ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={cover} alt={title} /> : <div className="flex h-full items-center justify-center bg-[#20232d] px-4 text-center text-xs text-[#81848f]">目前尚無封面</div>}<div className="poster-shine absolute inset-0" /></div>
    <div className="p-4"><h3 className="display-font line-clamp-2 min-h-11 text-[15px] font-semibold text-[#f2f1eb]">{title}</h3><div className="mt-2 flex items-center justify-between"><span className="text-[11px] text-[#777c88]">{genreLabel}</span>{game.score !== undefined && <GameScore score={game.score} compact />}</div><div className="mt-3 flex items-center justify-between text-[11px] text-[#777c88]"><span>{platformLabel}</span>{game.reviewCount !== undefined && <span className="flex items-center gap-1"><MessageCircle size={12} />{game.reviewCount.toLocaleString()}</span>}</div></div>
  </Link>
}

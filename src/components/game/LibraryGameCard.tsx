import { Link } from 'react-router-dom'
import SortDropdown from '../ui/SortDropdown'
import { getIgdbCoverUrl } from '../../services/gameService'
import { GAME_STATUS_LABELS, GAME_STATUSES, type GameStatus } from '../../services/gameStatusService'
import type { Game } from '../../types/game'
import { formatGenreName } from '../../utils/gameDisplay'

const statusOptions = [
  { value: '', label: '移出遊戲庫' },
  ...GAME_STATUSES.map((value) => ({ value, label: GAME_STATUS_LABELS[value] })),
]

export type LibraryGame = Game & { gameStatus: GameStatus }

export default function LibraryGameCard({ game, editable = false, updating = false, onStatusChange }: {
  game: LibraryGame
  editable?: boolean
  updating?: boolean
  onStatusChange?: (status: GameStatus | null) => void
}) {
  const title = game.displayName ?? game.name
  const cover = game.cover ?? getIgdbCoverUrl(game.coverImageId, 't_cover_big')
  const releaseYear = game.firstReleaseDate ? new Date(game.firstReleaseDate).getFullYear() : null
  const genres = game.genres?.slice(0, 2).map((genre) => formatGenreName(genre.name)).join(' · ')

  return (
    <article className="flex min-w-0 gap-4 rounded-xl border border-white/[.08] bg-[#151821] p-4 transition hover:border-[#f2c544]/40">
      <Link to={`/game/${game.id}`} aria-label={`查看 ${title}`} className="group h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-[#20232d] sm:h-40 sm:w-32">
        {cover ? <img src={cover} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-[#81848f]">目前尚無封面</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link to={`/game/${game.id}`} className="display-font line-clamp-2 text-lg font-semibold text-[#f5f3ed] transition hover:text-[#f2c544]">{title}</Link>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#81848f]">
          {releaseYear && <span>{releaseYear}</span>}
          {genres && <span>{genres}</span>}
          {game.developerName && <span>{game.developerName}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          {editable && onStatusChange
            ? <SortDropdown value={game.gameStatus} options={statusOptions} onChange={(value) => onStatusChange((value || null) as GameStatus | null)} ariaLabel={`${title} 遊戲狀態`} disabled={updating} />
            : <span className="text-xs font-medium text-[#f2c544]">{GAME_STATUS_LABELS[game.gameStatus]}</span>}
        </div>
      </div>
    </article>
  )
}

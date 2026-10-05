import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getIgdbCoverUrl, importGame } from '../../services/gameService'
import type { ExternalGame } from '../../services/gameService'

type ImportState = 'idle' | 'importing' | 'success' | 'error'

interface ExternalGameCardProps {
  game: ExternalGame
  onImported: (gameId: string, imported: boolean) => void
}

export default function ExternalGameCard({ game, onImported }: ExternalGameCardProps) {
  const [state, setState] = useState<ImportState>('idle')
  const [playlogGameId, setPlaylogGameId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('已加入 ✓')
  const [error, setError] = useState<string | null>(null)
  const cover = getIgdbCoverUrl(game.coverImageId, 't_cover_big')
  const releaseYear = game.firstReleaseDate ? new Date(game.firstReleaseDate).getFullYear() : null

  const handleImport = async () => {
    if (state === 'importing' || state === 'success') return
    setState('importing')
    setError(null)
    try {
      const result = await importGame(game.id)
      setPlaylogGameId(result.game.id)
      setSuccessMessage(result.imported ? '已加入 ✓' : '已在 PlayLog')
      setState('success')
      onImported(result.game.id, result.imported)
    } catch (requestError: unknown) {
      setState('error')
      setError(requestError instanceof Error ? requestError.message : '遊戲匯入失敗')
    }
  }

  return <article className="flex flex-col gap-4 rounded-xl border border-white/[.08] bg-[#151821] p-4 sm:flex-row">
    <div className="h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-[#20232d]">{cover ? <img src={cover} alt={game.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#81848f]">目前尚無封面</div>}</div>
    <div className="flex min-w-0 flex-1 flex-col">
      <h3 className="display-font text-lg font-semibold text-[#f5f3ed]">{game.name}</h3>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#81848f]">{releaseYear && <span>{releaseYear}</span>}{game.developerName && <span>{game.developerName}</span>}{game.genres.slice(0, 2).map((genre) => <span key={genre.id}>{genre.name}</span>)}{game.platforms.length > 0 && <span>{game.platforms.slice(0, 3).map((platform) => platform.name).join(' · ')}</span>}</div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#a5a7af]">{game.summary ?? '目前尚無遊戲介紹。'}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        {state === 'success' && playlogGameId ? <><span className="flex items-center gap-1 text-sm text-[#9fd6a3]"><Check size={15} />{successMessage}</span><Link to={`/game/${playlogGameId}`} className="gold-button rounded-lg px-3 py-2 text-xs">查看遊戲</Link></>
          : <button type="button" onClick={handleImport} disabled={state === 'importing'} className="gold-button flex items-center gap-2 rounded-lg px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"><Plus size={14} />{state === 'importing' ? '加入中...' : '加入 PlayLog'}</button>}
        {state === 'error' && <span className="text-xs text-[#e59b9b]">{error}</span>}
      </div>
    </div>
  </article>
}

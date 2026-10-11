import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import SortDropdown from '../components/ui/SortDropdown'
import { getIgdbCoverUrl, getRankings, type RankingGame, type RankingSort } from '../services/gameService'

const sortOptions: Array<{ value: RankingSort; label: string }> = [
  { value: 'rating', label: '評分最高' },
  { value: 'lowest', label: '評分最低' },
  { value: 'reviews', label: '評測最多' },
  { value: 'newest', label: '最新發行' },
]

function RankingCard({ game }: { game: RankingGame }) {
  const cover = getIgdbCoverUrl(game.coverImageId, 't_cover_big')
  const releaseYear = game.firstReleaseDate ? new Date(game.firstReleaseDate).getFullYear() : null
  return (
    <Link to={`/game/${game.id}`} className="glass group flex min-w-0 items-center gap-4 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-[#f2c544]/40">
      <span className="w-10 shrink-0 text-center text-xl font-bold text-[#f2c544]">{game.rank ?? '—'}</span>
      {cover ? <img src={cover} alt="" className="h-24 w-16 shrink-0 rounded-lg object-cover" /> : <div className="h-24 w-16 shrink-0 rounded-lg bg-[#20232d]" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-[#eeece5] group-hover:text-[#f2c544]">{game.name}</span>
        {releaseYear && <span className="mt-1 block text-xs text-[#777b86]">{releaseYear}</span>}
        {game.averageRating === null ? (
          <span className="mt-3 block text-sm text-[#898d99]">未評分 <span className="text-xs">· {game.reviewCount} 則評測</span></span>
        ) : (
          <span className="mt-3 block text-sm font-semibold text-[#f2c544]">{game.averageRating.toFixed(1)} / 5 <span className="font-normal text-xs text-[#898d99]">· {game.reviewCount} 則評測</span></span>
        )}
      </span>
    </Link>
  )
}

export default function RankingsPage() {
  const [sort, setSort] = useState<RankingSort>('rating')
  const [games, setGames] = useState<RankingGame[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    void getRankings(sort, 20, page * 20, controller.signal)
      .then((result) => {
        setGames(result.games)
        setTotal(result.pagination.total)
        setHasMore(result.pagination.hasMore)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setGames([])
        setError(requestError instanceof Error ? requestError.message : '排行榜服務暫時無法使用')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, sort])

  const changeSort = (value: RankingSort) => {
    setSort(value)
    setPage(0)
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar />
      <main className="page-width py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2">PlayLog Rankings</p>
            <h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">遊戲排行榜</h1>
            <p className="mt-2 text-sm text-[#898d99]">依 PlayLog 玩家評價整理的遊戲排名。</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#a5a7af]">
            <span>排序</span>
            <SortDropdown value={sort} options={sortOptions} onChange={(value) => changeSort(value as RankingSort)} />
          </div>
        </div>
        {loading && <p className="rounded-xl border border-white/[.07] bg-[#151821] p-6 text-sm text-[#a5a7af]">載入排行榜中...</p>}
        {!loading && error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">{error}</p>}
        {!loading && !error && games.length === 0 && <div className="rounded-xl border border-white/[.07] bg-[#151821] p-10 text-center text-sm text-[#c7c6c0]">目前還沒有可顯示的遊戲。</div>}
        {!loading && !error && games.length > 0 && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">{games.map((game) => <RankingCard key={game.id} game={game} />)}</div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <span className="text-xs text-[#777b86]">共 {total} 款遊戲</span>
              <div className="flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-white/[.08] px-3 py-2 text-xs text-[#c7c6c0] disabled:opacity-40">上一頁</button>
                <button type="button" disabled={!hasMore} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-white/[.08] px-3 py-2 text-xs text-[#c7c6c0] disabled:opacity-40">下一頁</button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

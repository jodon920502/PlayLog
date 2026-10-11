import { BookOpen, ChevronLeft, ChevronRight, LogIn } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LibraryGameCard, { type LibraryGame } from '../components/game/LibraryGameCard'
import Navbar from '../components/layout/Navbar'
import SEO from '../components/seo/SEO'
import { useAuth } from '../context/AuthContext'
import { GAME_STATUS_LABELS, GAME_STATUSES, getGameLibrary, setGameStatus, type GameStatus } from '../services/gameStatusService'

const PAGE_SIZE = 12
export default function LibraryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<GameStatus | ''>('')
  const [offset, setOffset] = useState(0)
  const [games, setGames] = useState<LibraryGame[]>([])
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false })
  const [statusCounts, setStatusCounts] = useState<Record<GameStatus, number>>(() => Object.fromEntries(GAME_STATUSES.map((item) => [item, 0])) as Record<GameStatus, number>)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingGameId, setUpdatingGameId] = useState<string | null>(null)

  const loadLibrary = useCallback(async (nextStatus: GameStatus | '', nextOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getGameLibrary(nextStatus || undefined, PAGE_SIZE, nextOffset)
      setGames(result.games)
      setPagination(result.pagination)
      setStatusCounts(result.statusCounts)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : '遊戲庫暫時無法使用')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void loadLibrary(status, offset)
  }, [authLoading, isAuthenticated, loadLibrary, offset, status])

  const changeStatus = (nextStatus: string) => {
    setStatus(nextStatus as GameStatus | '')
    setOffset(0)
  }

  const updateGameStatus = async (gameId: string, nextStatus: GameStatus | null) => {
    if (updatingGameId) return
    setUpdatingGameId(gameId)
    setError(null)
    try {
      await setGameStatus(gameId, nextStatus)
      await loadLibrary(status, offset)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : '遊戲狀態更新失敗，請稍後再試')
    } finally {
      setUpdatingGameId(null)
    }
  }

  const totalCount = GAME_STATUSES.reduce((total, item) => total + statusCounts[item], 0)

  return <div className="app-shell min-h-screen">
    <SEO title="我的遊戲庫｜PlayLog" description="查看並管理你在 PlayLog 的遊戲狀態。" indexable={false} />
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <div className="mb-7"><p className="section-label mb-2">My library</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">我的遊戲庫</h1><p className="mt-2 text-sm text-[#a5a7af]">管理你想玩、遊玩中與已完成的遊戲。</p></div>
      {authLoading ? <p className="py-12 text-center text-sm text-[#81848f]">確認登入狀態中...</p> : !isAuthenticated ? <div className="rounded-2xl border border-[#f2c544]/20 bg-[#151821] p-8 text-center"><LogIn className="mx-auto mb-3 text-[#f2c544]" size={24} /><h2 className="text-lg font-semibold text-[#f5f3ed]">登入後查看你的遊戲庫</h2><Link to="/login" className="gold-button mt-5 inline-flex rounded-lg px-4 py-2 text-sm">前往登入</Link></div> : <>
        <div className="mb-6 flex flex-wrap gap-2" aria-label="遊戲狀態篩選">
          <button type="button" onClick={() => changeStatus('')} className={`rounded-full px-3 py-1.5 text-xs transition ${status === '' ? 'bg-[#f2c544] text-[#10120f]' : 'border border-white/[.1] text-[#a5a7af] hover:border-[#f2c544]/50'}`}>全部 ({totalCount})</button>
          {GAME_STATUSES.map((item) => <button key={item} type="button" onClick={() => changeStatus(item)} className={`rounded-full px-3 py-1.5 text-xs transition ${status === item ? 'bg-[#f2c544] text-[#10120f]' : 'border border-white/[.1] text-[#a5a7af] hover:border-[#f2c544]/50'}`}>{GAME_STATUS_LABELS[item]} ({statusCounts[item]})</button>)}
        </div>
        {loading ? <p className="py-12 text-center text-sm text-[#81848f]">載入遊戲庫中...</p> : error ? <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{error}</p> : games.length === 0 ? <div className="rounded-2xl border border-white/[.08] bg-[#151821] p-10 text-center"><BookOpen className="mx-auto mb-3 text-[#f2c544]" size={26} /><h2 className="text-lg font-semibold text-[#f5f3ed]">目前沒有符合的遊戲</h2><p className="mt-2 text-sm text-[#a5a7af]">在遊戲詳細頁設定狀態，就能建立你的遊戲庫。</p><Link to="/search" className="ghost-button mt-5 inline-flex rounded-lg px-4 py-2 text-sm">探索遊戲</Link></div> : <>
          <div className="grid gap-4 lg:grid-cols-2">{games.map((game) => <LibraryGameCard key={game.id} game={game} editable updating={updatingGameId === game.id} onStatusChange={(nextStatus) => void updateGameStatus(game.id, nextStatus)} />)}</div>
          <div className="mt-8 flex items-center justify-between text-sm text-[#a5a7af]"><span>共 {pagination.total} 款遊戲</span><div className="flex items-center gap-2"><button type="button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} className="ghost-button rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="上一頁"><ChevronLeft size={17} /></button><span>{Math.floor(offset / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(pagination.total / PAGE_SIZE))}</span><button type="button" disabled={!pagination.hasMore || loading} onClick={() => setOffset(offset + PAGE_SIZE)} className="ghost-button rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="下一頁"><ChevronRight size={17} /></button></div></div>
        </>}
      </>}
    </main>
  </div>
}

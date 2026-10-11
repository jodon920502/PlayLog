import { Bookmark, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GameCard from '../components/game/GameCard'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'
import { getFavorites } from '../services/favoriteService'
import type { Game } from '../types/game'

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getFavorites().then((result) => {
      if (!cancelled) setGames(result.games)
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : '收藏清單暫時無法使用')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [authLoading, isAuthenticated])

  return <div className="app-shell min-h-screen">
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <div className="mb-8"><p className="section-label mb-2">Your collection</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">我的收藏</h1><p className="mt-2 text-sm text-[#a5a7af]">收藏喜歡的遊戲，之後再回來探索。</p></div>
      {authLoading ? <p className="py-12 text-center text-sm text-[#81848f]">確認登入狀態中...</p> : !isAuthenticated ? <div className="rounded-2xl border border-[#f2c544]/20 bg-[#151821] p-8 text-center"><LogIn className="mx-auto mb-3 text-[#f2c544]" size={24} /><h2 className="text-lg font-semibold text-[#f5f3ed]">登入後查看你的收藏</h2><p className="mt-2 text-sm text-[#a5a7af]">登入即可收藏遊戲並在這裡管理。</p><Link to="/login" className="gold-button mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm">前往登入</Link></div> : loading ? <p className="py-12 text-center text-sm text-[#81848f]">載入收藏中...</p> : error ? <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{error}</p> : games.length === 0 ? <div className="rounded-2xl border border-white/[.08] bg-[#151821] p-10 text-center"><Bookmark className="mx-auto mb-3 text-[#f2c544]" size={26} /><h2 className="text-lg font-semibold text-[#f5f3ed]">目前還沒有收藏遊戲</h2><p className="mt-2 text-sm text-[#a5a7af]">在遊戲詳細頁收藏喜歡的作品吧。</p><Link to="/search" className="ghost-button mt-5 inline-flex rounded-lg px-4 py-2 text-sm">探索遊戲</Link></div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{games.map((game) => <GameCard key={game.id} game={game} />)}</div>}
    </main>
  </div>
}

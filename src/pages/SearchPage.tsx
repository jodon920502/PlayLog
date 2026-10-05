import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import GameCard from '../components/game/GameCard'
import { searchGames } from '../services/gameService'
import type { Game } from '../types/game'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [results, setResults] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!query) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return () => { cancelled = true }
    }

    setIsLoading(true)
    setError(null)
    searchGames(query)
      .then((games) => {
        if (!cancelled) setResults(games)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setResults([])
          setError(requestError instanceof Error ? requestError.message : '搜尋服務暫時無法使用')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [query])

  return <div className="app-shell min-h-screen">
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <div className="mb-8">
        <p className="section-label mb-2">Game search</p>
        <h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">搜尋遊戲</h1>
        {query ? <p className="mt-2 text-sm text-[#81848f]">「{query}」的搜尋結果{!isLoading && !error ? ` · 找到 ${results.length} 款遊戲` : ''}</p> : <p className="mt-2 text-sm text-[#81848f]">輸入關鍵字，探索 PlayLog 遊戲資料。</p>}
      </div>
      {isLoading ? <div className="glass flex min-h-64 items-center justify-center rounded-2xl text-sm text-[#81848f]">搜尋中...</div>
        : error ? <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">搜尋暫時無法使用</h2><p className="mt-2 text-sm text-[#81848f]">{error}</p></div>
          : query && results.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((game) => <GameCard key={game.id} game={game} />)}</div>
            : <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" />{query ? <><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">找不到「{query}」相關的遊戲</h2><p className="mt-2 text-sm text-[#81848f]">請嘗試其他關鍵字。</p></> : <><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">開始搜尋遊戲</h2><p className="mt-2 text-sm text-[#81848f]">請從上方搜尋框輸入遊戲名稱。</p></>}</div>}
    </main>
  </div>
}

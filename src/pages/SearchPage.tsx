import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ExternalGameCard from '../components/game/ExternalGameCard'
import GameCard from '../components/game/GameCard'
import Navbar from '../components/layout/Navbar'
import { searchExternalGames, searchGames } from '../services/gameService'
import type { ExternalGame } from '../services/gameService'
import type { Game } from '../types/game'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [results, setResults] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [externalResults, setExternalResults] = useState<ExternalGame[]>([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [externalSearched, setExternalSearched] = useState(false)
  const [externalHasMore, setExternalHasMore] = useState(false)
  const externalRequestId = useRef(0)

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
      .then((games) => { if (!cancelled) setResults(games) })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setResults([])
          setError(requestError instanceof Error ? requestError.message : '搜尋服務暫時無法使用')
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [query])

  useEffect(() => {
    externalRequestId.current += 1
    setExternalResults([])
    setExternalError(null)
    setExternalSearched(false)
    setExternalLoading(false)
    setExternalHasMore(false)
  }, [query])

  const loadExternalGames = (offset: number, append: boolean) => {
    if (!query || externalLoading) return
    const requestId = externalRequestId.current + 1
    externalRequestId.current = requestId
    setExternalLoading(true)
    setExternalError(null)
    if (!append) {
      setExternalResults([])
      setExternalHasMore(false)
      setExternalSearched(true)
    }
    searchExternalGames(query, 20, offset)
      .then((result) => {
        if (requestId !== externalRequestId.current) return
        setExternalResults((current) => append ? [...current, ...result.games] : result.games)
        setExternalHasMore(result.pagination.hasMore)
      })
      .catch((requestError: unknown) => {
        if (requestId !== externalRequestId.current) return
        if (!append) setExternalResults([])
        setExternalError(requestError instanceof Error ? requestError.message : '外部搜尋服務暫時無法使用')
      })
      .finally(() => {
        if (requestId === externalRequestId.current) setExternalLoading(false)
      })
  }

  const handleExternalSearch = () => loadExternalGames(0, false)
  const handleLoadMoreExternalGames = () => loadExternalGames(externalResults.length, true)

  const refreshLocalResults = () => {
    void searchGames(query).then(setResults).catch(() => undefined)
  }

  const renderLocalResults = () => {
    if (isLoading) return <div className="glass flex min-h-64 items-center justify-center rounded-2xl text-sm text-[#81848f]">搜尋中...</div>
    if (error) return <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">搜尋暫時無法使用</h2><p className="mt-2 text-sm text-[#81848f]">{error}</p></div>
    if (query && results.length > 0) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((game) => <GameCard key={game.id} game={game} />)}</div>
    return <div className="glass flex min-h-48 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" />{query ? <><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">找不到「{query}」相關的遊戲</h2><p className="mt-2 text-sm text-[#81848f]">請嘗試其他關鍵字。</p></> : <><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">開始搜尋遊戲</h2><p className="mt-2 text-sm text-[#81848f]">請從上方搜尋框輸入遊戲名稱。</p></>}</div>
  }

  return <div className="app-shell min-h-screen">
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <div className="mb-8">
        <p className="section-label mb-2">Game search</p>
        <h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">搜尋遊戲</h1>
        {query ? <p className="mt-2 text-sm text-[#81848f]">「{query}」的搜尋結果{!isLoading && !error ? ` · 找到 ${results.length} 款遊戲` : ''}</p> : <p className="mt-2 text-sm text-[#81848f]">輸入關鍵字，探索 PlayLog 遊戲資料。</p>}
      </div>
      {renderLocalResults()}
      {query && <section className="mt-10 border-t border-white/[.08] pt-8">
        <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">沒有找到想要的遊戲？</h2>
        <p className="mt-2 text-sm text-[#81848f]">搜尋外部遊戲資料庫，找到後可手動加入 PlayLog。</p>
        <button type="button" onClick={handleExternalSearch} disabled={externalLoading} className="gold-button mt-4 rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">{externalLoading ? '正在搜尋外部遊戲資料庫...' : '搜尋外部遊戲資料庫'}</button>
        {externalSearched && <div className="mt-8">
          <h3 className="display-font text-xl font-semibold text-[#f5f3ed]">外部遊戲資料庫</h3>
          <p className="mt-2 text-sm text-[#81848f]">以下結果來自 IGDB，加入後即可在 PlayLog 評測與收藏。</p>
          {externalResults.length === 0 && externalLoading
            ? <p className="mt-5 text-sm text-[#81848f]">正在搜尋外部遊戲資料庫...</p>
            : externalResults.length === 0 && externalError
              ? <div className="mt-5 rounded-xl border border-[#7b3f3f] bg-[#2a1719] p-4 text-sm text-[#e59b9b]">{externalError}</div>
              : externalResults.length > 0
                ? <>{externalError && <div className="mt-5 rounded-xl border border-[#7b3f3f] bg-[#2a1719] p-4 text-sm text-[#e59b9b]">{externalError}</div>}<div className="mt-5 grid gap-4 lg:grid-cols-2">{externalResults.map((game) => <ExternalGameCard key={game.id} game={game} onImported={refreshLocalResults} />)}</div>{externalHasMore && <div className="mt-6 text-center"><button type="button" onClick={handleLoadMoreExternalGames} disabled={externalLoading} className="ghost-button rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">{externalLoading ? '載入中...' : '載入更多'}</button></div>}</>
                : <p className="mt-5 text-sm text-[#81848f]">外部遊戲資料庫也找不到符合的遊戲。</p>}
        </div>}
      </section>}
    </main>
  </div>
}

import { ArrowRight, ChevronDown, Flame, Footprints, Gamepad2, Search, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import HomeReviewCard from '../components/review/HomeReviewCard'
import GameScore from '../components/game/GameScore'
import { getGenreDisplayName } from '../data/genreTranslations'
import { useGameAutocomplete } from '../hooks/useGameAutocomplete'
import { getIgdbCoverUrl } from '../services/gameService'
import { getHomeData, type HomeData, type HomeGame } from '../services/homeService'

function formatYear(date: string | null): string {
  return date ? String(new Date(date).getFullYear()) : '年份待補'
}

function GameResultCard({ game }: { game: HomeGame }) {
  const cover = getIgdbCoverUrl(game.coverImageId)
  return <Link to={`/game/${game.id}`} className="group flex w-full max-w-[520px] min-w-0 items-stretch overflow-hidden rounded-xl border border-white/[.07] bg-[#151821] transition hover:-translate-y-1 hover:border-[#f2c544]/40">
    <div className="relative h-32 w-24 shrink-0 overflow-hidden sm:h-36 sm:w-[108px]">{cover ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={cover} alt={game.name} /> : <div className="flex h-full items-center justify-center bg-[#20232d] px-2 text-center text-[10px] text-[#81848f]">目前尚無封面</div>}</div>
    <div className="flex min-w-0 flex-1 flex-col justify-center p-4"><h3 className="display-font line-clamp-2 text-[15px] font-semibold text-[#f2f1eb]">{game.name}</h3><p className="mt-2 truncate text-[11px] text-[#777c88]">{game.developerName ?? '開發商資料待補'} · {formatYear(game.firstReleaseDate)}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><GameScore score={game.averageRating ?? undefined} compact /><span className="text-[11px] text-[#777c88]">{game.reviewCount.toLocaleString()} 則評測</span></div></div>
  </Link>
}

function HomePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileSearchQuery, setMobileSearchQuery] = useState('')
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false)
  const [mobileSearchHighlight, setMobileSearchHighlight] = useState(-1)
  const { results: mobileSuggestions, isLoading: mobileSearchLoading, error: mobileSearchError } = useGameAutocomplete(mobileSearchQuery)

  useEffect(() => {
    let alive = true
    void getHomeData().then((result) => {
      if (alive) setData(result)
    }).catch((requestError: unknown) => {
      if (alive) setError(requestError instanceof Error ? requestError.message : '首頁資料暫時無法使用')
    }).finally(() => {
      if (alive) setLoading(false)
    })
    return () => { alive = false }
  }, [])

  if (loading) return <div className="app-shell min-h-screen"><Navbar /><main className="page-width flex min-h-[60vh] items-center justify-center text-sm text-[#81848f]">載入首頁資料中...</main></div>
  if (error || !data) return <div className="app-shell min-h-screen"><Navbar /><main className="page-width flex min-h-[60vh] flex-col items-center justify-center text-center"><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">首頁資料暫時無法使用</h1><p className="mt-3 text-sm text-[#81848f]">{error}</p><button type="button" onClick={() => window.location.reload()} className="gold-button mt-6 rounded-lg px-4 py-2 text-sm">重新載入</button></main></div>

  const featured = data.featuredGame
  const featuredCover = featured ? getIgdbCoverUrl(featured.coverImageId) : null
  const handleMobileSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = mobileSearchQuery.trim()
    if (!query) return
    const params = new URLSearchParams()
    params.set('q', query)
    navigate(`/search?${params.toString()}`)
    setMobileSearchFocused(false)
    setMobileSearchHighlight(-1)
  }
  const navigateToMobileGame = (gameId: string) => {
    setMobileSearchFocused(false)
    setMobileSearchHighlight(-1)
    navigate(`/game/${gameId}`)
  }
  const handleMobileSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setMobileSearchFocused(false)
      setMobileSearchHighlight(-1)
    } else if (event.key === 'ArrowDown' && mobileSuggestions.length > 0) {
      event.preventDefault()
      setMobileSearchHighlight((current) => (current + 1) % mobileSuggestions.length)
    } else if (event.key === 'ArrowUp' && mobileSuggestions.length > 0) {
      event.preventDefault()
      setMobileSearchHighlight((current) => current <= 0 ? mobileSuggestions.length - 1 : current - 1)
    } else if (event.key === 'Enter' && mobileSearchHighlight >= 0 && mobileSuggestions[mobileSearchHighlight]) {
      event.preventDefault()
      navigateToMobileGame(mobileSuggestions[mobileSearchHighlight].id)
    }
  }

  return <div className="app-shell min-h-screen"><Navbar /><main className="page-width py-8 sm:py-10">
    <div className="mb-9 flex items-end justify-between"><div><p className="section-label mb-2">玩家的遊戲日誌</p><h2 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">今天想玩什麼？</h2><p className="mt-2 text-sm text-[#81848f]">發現玩家真實評價，記錄每一段遊戲旅程。</p><div className="relative sm:hidden"><form onSubmit={handleMobileSearch} className="mt-5 flex w-full items-center gap-2 rounded-xl border border-white/[.08] bg-[#151821] px-3 py-2 focus-within:border-[#f2c544] focus-within:ring-2 focus-within:ring-[#f2c544]/20"><Search size={17} className="shrink-0 text-[#f2c544]" /><input name="home-mobile-search" aria-label="搜尋遊戲" aria-autocomplete="list" aria-controls="home-search-results" aria-expanded={mobileSearchFocused && mobileSearchQuery.trim().length >= 2} aria-activedescendant={mobileSearchHighlight >= 0 ? `home-search-result-${mobileSuggestions[mobileSearchHighlight]?.id}` : undefined} value={mobileSearchQuery} onChange={(event) => { setMobileSearchQuery(event.target.value); setMobileSearchFocused(true); setMobileSearchHighlight(-1) }} onFocus={() => setMobileSearchFocused(true)} onKeyDown={handleMobileSearchKeyDown} placeholder="搜尋遊戲..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#666a75]" /><button type="submit" className="gold-button rounded-lg px-3 py-2 text-xs">搜尋</button></form>{mobileSearchFocused && mobileSearchQuery.trim().length >= 2 && <div id="home-search-results" role="listbox" className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/[.08] bg-[#10151d] shadow-2xl shadow-black/40">{mobileSearchLoading ? <p className="p-3 text-xs text-[#a5a7af]">搜尋中...</p> : mobileSearchError ? <p className="p-3 text-xs text-[#e59b9b]">{mobileSearchError}</p> : mobileSuggestions.length > 0 ? mobileSuggestions.map((game, index) => <button id={`home-search-result-${game.id}`} key={game.id} type="button" role="option" aria-selected={mobileSearchHighlight === index} onMouseDown={(event) => event.preventDefault()} onClick={() => navigateToMobileGame(game.id)} onMouseEnter={() => setMobileSearchHighlight(index)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${mobileSearchHighlight === index ? 'bg-white/10' : 'hover:bg-white/5'}`}>{game.cover || game.coverImageId ? <img src={game.cover ?? `https://images.igdb.com/igdb/image/upload/t_cover_small/${game.coverImageId}.jpg`} alt="" className="h-11 w-9 shrink-0 rounded object-cover" /> : <span className="h-11 w-9 shrink-0 rounded bg-[#20232d]" />}<span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#eeece5]">{game.displayName ?? game.name}</span></button>) : <p className="p-3 text-xs text-[#a5a7af]">找不到符合的遊戲</p>}</div>}</div></div><span className="hidden items-center gap-1 text-xs text-[#a5a8b2] sm:flex"><ChevronDown size={14} />真實社群資料</span></div>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_278px]"><div className="min-w-0">
      {featured ? <section className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#151821]"><div className="hero-glow" /> <div className="relative z-10 flex items-center gap-7 p-6 sm:p-8">{featuredCover && <img className="hidden h-60 w-44 rounded-xl object-cover shadow-2xl ring-1 ring-white/10 sm:block" src={featuredCover} alt={`${featured.name} 封面`} />}<div className="max-w-xl"><div className="section-label mb-3">本週焦點遊戲</div><h1 className="display-font mb-1 text-5xl font-bold tracking-tight text-white">{featured.name}</h1><p className="mb-4 text-sm text-[#b5b6bb]">{featured.developerName ?? '開發商資料待補'} <span className="mx-2 text-[#f2c544]">•</span> {formatYear(featured.firstReleaseDate)}</p><div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#c3c3c2]"><GameScore score={featured.averageRating ?? undefined} /><span>{featured.reviewCount.toLocaleString()} 則評測</span></div><p className="mb-6 max-w-md text-sm leading-6 text-[#c1c1c4]">{featured.summary ?? '目前尚無遊戲介紹。'}</p><Link to={`/game/${featured.id}`} className="gold-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">查看遊戲 <ArrowRight size={15} /></Link></div></div></section> : <div className="glass flex min-h-[455px] items-center justify-center rounded-2xl p-8 text-center text-sm text-[#81848f]">目前沒有可展示的遊戲。</div>}
      <section className="mt-12"><div className="mb-5"><p className="section-label mb-2">Community picks</p><h2 className="display-font text-2xl font-bold">近期熱門遊戲</h2></div>{data.popularGames.length > 0 ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{data.popularGames.map((game) => <GameResultCard key={game.id} game={game} />)}</div> : <div className="glass rounded-xl p-8 text-center text-sm text-[#81848f]">目前還沒有足夠的玩家評測。</div>}</section>
      <section className="mt-12"><div className="mb-5"><p className="section-label mb-2">Recent reviews</p><h2 className="display-font text-2xl font-bold">近期玩家評測</h2></div>{data.recentReviews.length > 0 ? <div className="grid min-w-0 gap-4 xl:grid-cols-2">{data.recentReviews.map((review) => <HomeReviewCard key={review.id} review={review} />)}</div> : <div className="glass rounded-xl p-8 text-center text-sm text-[#81848f]">目前還沒有玩家評測。</div>}</section>
    </div><aside className="space-y-5">
      <div className="glass rounded-xl p-5"><div className="mb-5 flex items-center justify-between"><h3 className="display-font flex items-center gap-2 font-semibold"><Flame size={17} className="text-[#f2c544]" />熱門遊戲</h3><span className="text-[10px] text-[#777b86]">真實評測</span></div>{data.popularGames.length > 0 ? <div className="space-y-4">{data.popularGames.map((game, index) => <Link to={`/game/${game.id}`} key={game.id} className="flex items-center gap-3"><span className="w-4 text-center text-xs font-bold text-[#777b86]">{String(index + 1).padStart(2, '0')}</span>{getIgdbCoverUrl(game.coverImageId) ? <img className="h-11 w-9 rounded object-cover" src={getIgdbCoverUrl(game.coverImageId) ?? undefined} alt={game.name} /> : <div className="h-11 w-9 rounded bg-[#20232d]" />}<div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#deddd7]">{game.name}</p><p className="mt-1 text-[10px] text-[#777b86]">{game.reviewCount.toLocaleString()} 則評測</p></div><GameScore score={game.averageRating ?? undefined} compact /></Link>)}</div> : <p className="text-xs text-[#81848f]">尚無熱門遊戲。</p>}</div>
      <div className="glass rounded-xl p-5"><h3 className="display-font mb-5 flex items-center gap-2 font-semibold"><Sparkles size={17} className="text-[#f2c544]" />探索分類</h3><div className="grid grid-cols-2 gap-2">{data.genres.length > 0 ? data.genres.map((genre) => <button type="button" title={genre.name} key={genre.id} onClick={() => navigate(`/search?genre=${encodeURIComponent(genre.id)}`)} className="min-h-10 overflow-hidden rounded-lg bg-[#1b1e28] px-3 py-2 text-left text-xs leading-4 text-[#a5a7af] line-clamp-2 break-words hover:text-[#f2c544]">{getGenreDisplayName(genre.name)}</button>) : <p className="col-span-2 text-xs text-[#81848f]">尚無分類資料。</p>}</div></div>
      <div className="glass rounded-xl p-5"><h3 className="display-font mb-4 flex items-center gap-2 font-semibold"><Users size={17} className="text-[#f2c544]" />社群活動</h3><p className="text-xs leading-5 text-[#858892]">本週新增 <strong className="text-[#ddd9c9]">{data.activitySummary.weeklyReviewCount.toLocaleString()}</strong> 則評測，累積 <strong className="text-[#ddd9c9]">{data.activitySummary.reviewerCount.toLocaleString()}</strong> 位評測玩家。</p><button type="button" onClick={() => navigate('/search')} className="mt-4 flex items-center gap-2 text-xs text-[#f2c544]"><Footprints size={14} />探索遊戲</button></div>
      <div className="rounded-xl border border-[#4d4020] bg-[#211c11] p-5"><Gamepad2 size={20} className="mb-3 text-[#f2c544]" /><p className="text-sm font-semibold text-[#eee3bd]">記錄你的遊戲旅程</p><p className="mt-2 text-xs leading-5 text-[#a99d77]">收藏與遊戲足跡功能正在開發中。</p></div>
    </aside></div></main><footer className="page-width border-t border-white/[.06] py-8 text-center text-xs text-[#626671]">© 2025 PlayLog · 玩家創作的遊戲社群</footer></div>
}

export default HomePage

import { Filter, Search, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Chip,
  ChipLabel,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerHeading,
  DrawerRoot,
  DrawerTrigger,
  useOverlayState,
} from '@heroui/react'
import ExternalGameCard from '../components/game/ExternalGameCard'
import GameCard from '../components/game/GameCard'
import Navbar from '../components/layout/Navbar'
import { getGenreDisplayName } from '../data/genreTranslations'
import { useGameAutocomplete } from '../hooks/useGameAutocomplete'
import { getGameFilterOptions, searchExternalGames, searchLocalGames, type ExternalGame, type GameFilterOptions, type LocalGameSearchFilters, type LocalGameSort } from '../services/gameService'
import { searchPlayers, type PlayerSearchResult } from '../services/playerService'
import type { Game } from '../types/game'
import { formatPlatformName } from '../utils/gameDisplay'

const PAGE_SIZE = 20
const sortOptions: Array<{ value: LocalGameSort; label: string }> = [
  { value: 'relevance', label: '相關性' },
  { value: 'newest', label: '最新' },
  { value: 'oldest', label: '最舊' },
  { value: 'rating', label: '玩家評分' },
  { value: 'reviews', label: '評論數' },
  { value: 'name', label: '名稱' },
]

function parseList(value: string | null): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const searchType = searchParams.get('type') === 'players' ? 'players' : 'games'
  const query = searchParams.get('q')?.trim() ?? ''
  const filters = useMemo<LocalGameSearchFilters>(() => ({
    genres: parseList(searchParams.get('genre') ?? searchParams.get('genres')),
    platforms: parseList(searchParams.get('platform') ?? searchParams.get('platforms')),
    yearFrom: parseNumber(searchParams.get('yearFrom')),
    yearTo: parseNumber(searchParams.get('yearTo')),
    minRating: parseNumber(searchParams.get('minRating')),
    ratedOnly: searchParams.get('ratedOnly') === 'true',
    sort: (sortOptions.some((option) => option.value === searchParams.get('sort')) ? searchParams.get('sort') : 'relevance') as LocalGameSort,
    limit: PAGE_SIZE,
    offset: Math.max(0, Number(searchParams.get('offset') ?? 0) || 0),
  }), [searchParams])
  const [filterOptions, setFilterOptions] = useState<GameFilterOptions>({ genres: [], platforms: [] })
  const [searchInput, setSearchInput] = useState(query)
  const [searchFocused, setSearchFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const { results: autocompleteResults, isLoading: autocompleteLoading, error: autocompleteError } = useGameAutocomplete(searchType === 'games' ? searchInput : '')
  const [results, setResults] = useState<Game[]>([])
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drawerState = useOverlayState()
  const [externalResults, setExternalResults] = useState<ExternalGame[]>([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalError, setExternalError] = useState<string | null>(null)
  const [externalSearched, setExternalSearched] = useState(false)
  const [externalHasMore, setExternalHasMore] = useState(false)
  const [playerResults, setPlayerResults] = useState<PlayerSearchResult[]>([])
  const [playerPagination, setPlayerPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false })
  const [playerLoading, setPlayerLoading] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const requestId = useRef(0)
  const externalRequestId = useRef(0)
  const playerRequestId = useRef(0)

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    if (filters.ratedOnly && filters.minRating !== undefined) {
      const next = new URLSearchParams(searchParams)
      next.delete('ratedOnly')
      setSearchParams(next, { replace: true })
    }
  }, [filters.minRating, filters.ratedOnly, searchParams, setSearchParams])

  useEffect(() => {
    if (searchType !== 'players') return
    const gameOnlyKeys = ['genre', 'genres', 'platform', 'platforms', 'yearFrom', 'yearTo', 'minRating', 'ratedOnly', 'sort', 'offset']
    if (!gameOnlyKeys.some((key) => searchParams.has(key))) return
    const next = new URLSearchParams(searchParams)
    for (const key of gameOnlyKeys) next.delete(key)
    setSearchParams(next, { replace: true })
  }, [searchParams, searchType, setSearchParams])

  useEffect(() => {
    if (searchType !== 'games') return
    const controller = new AbortController()
    void getGameFilterOptions(controller.signal).then(setFilterOptions).catch(() => undefined)
    return () => controller.abort()
  }, [searchType])

  useEffect(() => {
    if (searchType !== 'games') {
      requestId.current += 1
      setResults([])
      setIsLoading(false)
      return
    }
    requestId.current += 1
    const currentRequest = requestId.current
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)
      void searchLocalGames(query, filters, controller.signal)
        .then((result) => {
          if (currentRequest !== requestId.current) return
          setResults(result.games)
          setPagination(result.pagination)
        })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted || currentRequest !== requestId.current) return
          setResults([])
          setPagination({ total: 0, limit: PAGE_SIZE, offset: filters.offset, hasMore: false })
          setError(requestError instanceof Error ? requestError.message : '搜尋服務暫時無法使用')
        })
        .finally(() => {
          if (currentRequest === requestId.current) setIsLoading(false)
        })
    }, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, filters, searchType])

  useEffect(() => {
    if (searchType !== 'games') return
    externalRequestId.current += 1
    setExternalResults([])
    setExternalError(null)
    setExternalSearched(false)
    setExternalLoading(false)
    setExternalHasMore(false)
  }, [query, searchType])

  useEffect(() => {
    playerRequestId.current += 1
    const currentRequest = playerRequestId.current
    if (searchType !== 'players') {
      setPlayerResults([])
      setPlayerError(null)
      setPlayerLoading(false)
      return
    }
    if (!query) {
      setPlayerResults([])
      setPlayerPagination({ total: 0, limit: PAGE_SIZE, offset: filters.offset, hasMore: false })
      setPlayerError(null)
      setPlayerLoading(false)
      return
    }
    const controller = new AbortController()
    setPlayerLoading(true)
    setPlayerError(null)
    void searchPlayers(query, PAGE_SIZE, filters.offset, controller.signal)
      .then((result) => {
        if (currentRequest !== playerRequestId.current) return
        setPlayerResults(result.players)
        setPlayerPagination(result.pagination)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || currentRequest !== playerRequestId.current) return
        setPlayerResults([])
        setPlayerPagination({ total: 0, limit: PAGE_SIZE, offset: filters.offset, hasMore: false })
        setPlayerError(requestError instanceof Error ? requestError.message : '玩家搜尋服務暫時無法使用')
      })
      .finally(() => {
        if (currentRequest === playerRequestId.current) setPlayerLoading(false)
      })
    return () => controller.abort()
  }, [filters.offset, query, searchType])

  const updateFilters = (updates: Record<string, string | string[] | undefined>, resetOffset = true) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || (Array.isArray(value) && value.length === 0) || value === '') next.delete(key)
      else next.set(key, Array.isArray(value) ? value.join(',') : value)
    }
    if (resetOffset) next.delete('offset')
    setSearchParams(next)
  }

  const toggleFilterValue = (key: 'genre' | 'platform', value: string) => {
    const current = key === 'genre' ? filters.genres : filters.platforms
    updateFilters({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] })
  }

  const resetFilters = () => updateFilters({ genre: undefined, platform: undefined, yearFrom: undefined, yearTo: undefined, minRating: undefined, ratedOnly: undefined, sort: undefined })
  const switchSearchType = (nextType: 'games' | 'players') => {
    const next = new URLSearchParams(searchParams)
    if (nextType === 'players') {
      next.set('type', 'players')
      for (const key of ['genre', 'genres', 'platform', 'platforms', 'yearFrom', 'yearTo', 'minRating', 'ratedOnly', 'sort', 'offset']) next.delete(key)
    } else {
      next.delete('type')
      next.delete('offset')
    }
    setSearchParams(next)
  }
  const loadMorePlayers = () => updateFilters({ offset: String(filters.offset + PAGE_SIZE) }, false)
  const handlePageSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = searchInput.trim()
    updateFilters({ q: nextQuery || undefined })
    setSearchFocused(false)
    setHighlightedIndex(-1)
  }
  const navigateToGame = (gameId: string) => {
    setSearchFocused(false)
    setHighlightedIndex(-1)
    navigate(`/game/${gameId}`)
  }
  const handlePageSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchFocused(false)
      setHighlightedIndex(-1)
      return
    }
    if (event.key === 'ArrowDown' && autocompleteResults.length > 0) {
      event.preventDefault()
      setHighlightedIndex((current) => (current + 1) % autocompleteResults.length)
      return
    }
    if (event.key === 'ArrowUp' && autocompleteResults.length > 0) {
      event.preventDefault()
      setHighlightedIndex((current) => current <= 0 ? autocompleteResults.length - 1 : current - 1)
      return
    }
    if (event.key === 'Enter' && highlightedIndex >= 0 && autocompleteResults[highlightedIndex]) {
      event.preventDefault()
      navigateToGame(autocompleteResults[highlightedIndex].id)
    }
  }
  const handleRatingFilterChange = (value: string) => {
    if (value === 'rated') {
      updateFilters({ ratedOnly: 'true', minRating: undefined })
    } else if (value) {
      updateFilters({ minRating: value, ratedOnly: undefined })
    } else {
      updateFilters({ minRating: undefined, ratedOnly: undefined })
    }
  }
  const loadMore = () => updateFilters({ offset: String(filters.offset + PAGE_SIZE) }, false)
  const loadExternalGames = (offset: number, append: boolean) => {
    if (!query || externalLoading) return
    const currentRequest = externalRequestId.current + 1
    externalRequestId.current = currentRequest
    setExternalLoading(true)
    setExternalError(null)
    if (!append) {
      setExternalResults([])
      setExternalHasMore(false)
      setExternalSearched(true)
    }
    void searchExternalGames(query, 20, offset).then((result) => {
      if (currentRequest !== externalRequestId.current) return
      setExternalResults((current) => append ? [...current, ...result.games] : result.games)
      setExternalHasMore(result.pagination.hasMore)
    }).catch((requestError: unknown) => {
      if (currentRequest !== externalRequestId.current) return
      if (!append) setExternalResults([])
      setExternalError(requestError instanceof Error ? requestError.message : '外部搜尋服務暫時無法使用')
    }).finally(() => {
      if (currentRequest === externalRequestId.current) setExternalLoading(false)
    })
  }

  const refreshLocalResults = () => {
    updateFilters({ offset: '0' }, false)
  }

  const renderFilterPanel = (mobile = false) => <div className={mobile ? 'bg-transparent p-5' : 'glass rounded-xl p-5'}>
    <div className="mb-4 flex items-center justify-between"><h2 className="display-font flex items-center gap-2 font-semibold"><Filter size={17} className="text-[#f2c544]" />篩選遊戲</h2>{mobile && <DrawerCloseTrigger className="rounded-md p-1 text-[#a5a7af] hover:bg-white/10" aria-label="關閉篩選"><X size={18} /></DrawerCloseTrigger>}</div>
    <AccordionRoot className="space-y-0 bg-transparent text-[#deddd7]" allowsMultipleExpanded defaultExpandedKeys={['genres', 'platforms']}>
      <AccordionItem id="genres" className="border-b border-white/[.08] bg-transparent pb-2">
        <AccordionHeading><AccordionTrigger className="flex w-full items-center justify-between rounded-none bg-transparent py-3 text-sm font-semibold text-[#eeece5] hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]/60">遊戲類型<AccordionIndicator className="text-[#f2c544]" /></AccordionTrigger></AccordionHeading>
        <AccordionPanel className="bg-transparent"><AccordionBody className="space-y-1 bg-transparent pr-1">{filterOptions.genres.map((genre) => <Checkbox key={genre.id} isSelected={filters.genres.includes(genre.id)} onChange={() => toggleFilterValue('genre', genre.id)} className="w-full text-xs"><CheckboxContent className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-[#d1d5db] hover:bg-white/[.03] hover:text-[#f5f3ed]"><CheckboxControl className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/25 bg-transparent data-[selected=true]:border-[#f2c544] data-[selected=true]:bg-[#f2c544]"><CheckboxIndicator className="text-[#10120f]" /></CheckboxControl><span className="min-w-0 break-words text-[#d1d5db]">{getGenreDisplayName(genre.name)}</span></CheckboxContent></Checkbox>)}</AccordionBody></AccordionPanel>
      </AccordionItem>
      <AccordionItem id="platforms" className="border-b border-white/[.08] bg-transparent pb-2">
        <AccordionHeading><AccordionTrigger className="flex w-full items-center justify-between rounded-none bg-transparent py-3 text-sm font-semibold text-[#eeece5] hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]/60">遊戲平台<AccordionIndicator className="text-[#f2c544]" /></AccordionTrigger></AccordionHeading>
        <AccordionPanel className="bg-transparent"><AccordionBody className="space-y-1 bg-transparent pr-1">{filterOptions.platforms.map((platform) => <Checkbox key={platform.id} isSelected={filters.platforms.includes(platform.id)} onChange={() => toggleFilterValue('platform', platform.id)} className="w-full text-xs"><CheckboxContent className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-[#d1d5db] hover:bg-white/[.03] hover:text-[#f5f3ed]"><CheckboxControl className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/25 bg-transparent data-[selected=true]:border-[#f2c544] data-[selected=true]:bg-[#f2c544]"><CheckboxIndicator className="text-[#10120f]" /></CheckboxControl><span className="min-w-0 break-words text-[#d1d5db]">{formatPlatformName(platform.name)}</span></CheckboxContent></Checkbox>)}</AccordionBody></AccordionPanel>
      </AccordionItem>
      <AccordionItem id="release-year" className="border-b border-white/[.08] bg-transparent pb-2">
        <AccordionHeading><AccordionTrigger className="flex w-full items-center justify-between rounded-none bg-transparent py-3 text-sm font-semibold text-[#eeece5] hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]/60">發售年份<AccordionIndicator className="text-[#f2c544]" /></AccordionTrigger></AccordionHeading>
        <AccordionPanel className="bg-transparent"><AccordionBody className="grid grid-cols-2 gap-2 bg-transparent"><label className="text-xs text-[#c5c6ca]">起<input type="number" min="1900" max="2200" value={filters.yearFrom ?? ''} onChange={(event) => updateFilters({ yearFrom: event.target.value || undefined })} className="filter-select mt-2 w-full rounded-lg px-2 py-2 text-xs" /></label><label className="text-xs text-[#c5c6ca]">迄<input type="number" min="1900" max="2200" value={filters.yearTo ?? ''} onChange={(event) => updateFilters({ yearTo: event.target.value || undefined })} className="filter-select mt-2 w-full rounded-lg px-2 py-2 text-xs" /></label></AccordionBody></AccordionPanel>
      </AccordionItem>
      <AccordionItem id="rating" className="border-b border-white/[.08] bg-transparent pb-2">
        <AccordionHeading><AccordionTrigger className="flex w-full items-center justify-between rounded-none bg-transparent py-3 text-sm font-semibold text-[#eeece5] hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]/60">玩家評分<AccordionIndicator className="text-[#f2c544]" /></AccordionTrigger></AccordionHeading>
        <AccordionPanel className="bg-transparent"><AccordionBody className="bg-transparent"><label className="block text-xs text-[#c5c6ca]">玩家評分<select aria-label="玩家評分篩選" value={filters.minRating !== undefined ? String(filters.minRating) : filters.ratedOnly ? 'rated' : ''} onChange={(event) => handleRatingFilterChange(event.target.value)} className="filter-select mt-2 w-full rounded-lg px-3 py-2 text-xs"><option value="">不限</option><option value="rated">只顯示有評分的遊戲</option>{[3, 3.5, 4, 4.5].map((rating) => <option key={rating} value={rating}>{rating.toFixed(1)} 分以上</option>)}<option value="5">5.0 分</option></select></label></AccordionBody></AccordionPanel>
      </AccordionItem>
      <AccordionItem id="sort" className="bg-transparent pb-2">
        <AccordionHeading><AccordionTrigger className="flex w-full items-center justify-between rounded-none bg-transparent py-3 text-sm font-semibold text-[#eeece5] hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]/60">排序方式<AccordionIndicator className="text-[#f2c544]" /></AccordionTrigger></AccordionHeading>
        <AccordionPanel className="bg-transparent"><AccordionBody className="bg-transparent"><label className="block text-xs text-[#c5c6ca]">排序方式<select aria-label="排序方式" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value })} className="filter-select mt-2 w-full rounded-lg px-3 py-2 text-xs">{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></AccordionBody></AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
    <button type="button" onClick={resetFilters} className="ghost-button mt-4 w-full rounded-lg px-3 py-2 text-xs">清除篩選</button>
  </div>

  const activeFilters = [
    ...filters.genres.map((id) => ({ key: `genre-${id}`, label: getGenreDisplayName(filterOptions.genres.find((genre) => genre.id === id)?.name ?? id), remove: () => toggleFilterValue('genre', id) })),
    ...filters.platforms.map((id) => ({ key: `platform-${id}`, label: formatPlatformName(filterOptions.platforms.find((platform) => platform.id === id)?.name ?? id), remove: () => toggleFilterValue('platform', id) })),
    ...(filters.yearFrom === undefined ? [] : [{ key: 'year-from', label: `${filters.yearFrom} 年後`, remove: () => updateFilters({ yearFrom: undefined }) }]),
    ...(filters.yearTo === undefined ? [] : [{ key: 'year-to', label: `${filters.yearTo} 年前`, remove: () => updateFilters({ yearTo: undefined }) }]),
    ...(filters.minRating === undefined ? [] : [{ key: 'rating', label: `評分 ≥ ${filters.minRating.toFixed(1)}`, remove: () => updateFilters({ minRating: undefined }) }]),
    ...(filters.ratedOnly ? [{ key: 'rated-only', label: '已有評分', remove: () => updateFilters({ ratedOnly: undefined }) }] : []),
  ]

  const localContent = isLoading
    ? <div className="glass flex min-h-64 items-center justify-center rounded-2xl text-sm text-[#81848f]">搜尋中...</div>
    : error
      ? <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">搜尋暫時無法使用</h2><p className="mt-2 text-sm text-[#81848f]">{error}</p></div>
      : results.length > 0
        ? <><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((game) => <GameCard key={game.id} game={game} />)}</div><div className="mt-6 flex items-center justify-center gap-4">{filters.offset > 0 && <button type="button" onClick={() => updateFilters({ offset: String(Math.max(0, filters.offset - PAGE_SIZE)) }, false)} className="ghost-button rounded-lg px-4 py-2 text-sm">上一頁</button>}<span className="text-xs text-[#81848f]">共 {pagination.total} 款遊戲</span>{pagination.hasMore && <button type="button" onClick={loadMore} className="ghost-button rounded-lg px-4 py-2 text-sm">下一頁</button>}</div></>
        : <div className="glass flex min-h-48 flex-col items-center justify-center rounded-2xl px-6 text-center"><Search size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">{query ? `找不到「${query}」相關的遊戲` : '找不到符合條件的遊戲'}</h2><p className="mt-2 text-sm text-[#81848f]">請調整關鍵字或篩選條件。</p></div>

  const playerContent = playerLoading
    ? <div className="glass flex min-h-64 items-center justify-center rounded-2xl text-sm text-[#81848f]">搜尋玩家中...</div>
    : playerError
      ? <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><UserRound size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">玩家搜尋暫時無法使用</h2><p className="mt-2 text-sm text-[#81848f]">{playerError}</p></div>
      : playerResults.length > 0
        ? <><div className="grid gap-4 lg:grid-cols-2">{playerResults.map((player) => <button key={player.userId} type="button" onClick={() => navigate(`/profile/${player.userId}`, { state: { from: `${location.pathname}${location.search}` } })} className="glass flex min-w-0 items-center gap-4 rounded-2xl border border-white/[.08] p-4 text-left transition hover:border-[#f2c544]/40 hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]"><span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#202631] text-lg font-semibold text-[#f2c544]">{player.avatar ? <img src={player.avatar} alt="" className="h-full w-full object-cover" /> : player.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-base font-semibold text-[#f5f3ed]">{player.displayName}</span><span className="mt-1 block line-clamp-3 break-words text-sm text-[#9b9da6]">{player.bio || '這位玩家還沒有留下自我介紹。'}</span><span className="mt-2 block text-xs text-[#f2c544]">查看個人檔案</span></span></button>)}</div><div className="mt-6 flex items-center justify-center gap-4">{filters.offset > 0 && <button type="button" onClick={() => updateFilters({ offset: String(Math.max(0, filters.offset - PAGE_SIZE)) }, false)} className="ghost-button rounded-lg px-4 py-2 text-sm">上一頁</button>}<span className="text-xs text-[#81848f]">共 {playerPagination.total} 位玩家</span>{playerPagination.hasMore && <button type="button" onClick={loadMorePlayers} className="ghost-button rounded-lg px-4 py-2 text-sm">下一頁</button>}</div></>
        : <div className="glass flex min-h-48 flex-col items-center justify-center rounded-2xl px-6 text-center"><UserRound size={28} className="mb-4 text-[#f2c544]" /><h2 className="display-font text-xl font-semibold text-[#f5f3ed]">{query ? `找不到「${query}」相關的玩家` : '請輸入玩家名稱'}</h2><p className="mt-2 text-sm text-[#81848f]">{query ? '請嘗試其他關鍵字。' : '輸入關鍵字後即可搜尋玩家。'}</p></div>

  return <div className="app-shell min-h-screen"><Navbar /><main className="page-width py-8 sm:py-10">
    <div className="mb-8"><p className="section-label mb-2">Search</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">{searchType === 'players' ? '搜尋玩家' : '搜尋遊戲'}</h1><div className="mt-5 inline-flex rounded-xl border border-white/[.08] bg-[#151821] p-1"><button type="button" onClick={() => switchSearchType('games')} className={`rounded-lg px-4 py-2 text-sm transition ${searchType === 'games' ? 'bg-[#f2c544] font-semibold text-[#10120f]' : 'text-[#a5a7af] hover:text-[#f5f3ed]'}`}>遊戲</button><button type="button" onClick={() => switchSearchType('players')} className={`rounded-lg px-4 py-2 text-sm transition ${searchType === 'players' ? 'bg-[#f2c544] font-semibold text-[#10120f]' : 'text-[#a5a7af] hover:text-[#f5f3ed]'}`}>玩家</button></div><p className="mt-3 text-sm text-[#81848f]">{query ? `「${query}」的搜尋結果 · ${searchType === 'players' ? `找到 ${playerPagination.total} 位玩家` : `找到 ${pagination.total} 款遊戲`}` : searchType === 'players' ? '輸入關鍵字，探索 PlayLog 玩家。' : '輸入關鍵字，探索 PlayLog 遊戲資料。'}</p><div className="relative sm:hidden"><form onSubmit={handlePageSearch} className="mt-5 flex w-full items-center gap-2 rounded-xl border border-white/[.08] bg-[#151821] px-3 py-2"><Search size={17} className="shrink-0 text-[#f2c544]" /><input aria-activedescendant={searchType === 'games' && highlightedIndex >= 0 ? `search-page-result-${autocompleteResults[highlightedIndex]?.id}` : undefined} aria-autocomplete={searchType === 'games' ? 'list' : 'none'} aria-controls={searchType === 'games' ? 'search-page-results' : undefined} aria-expanded={searchType === 'games' && searchFocused && searchInput.trim().length >= 2} aria-label={searchType === 'players' ? '搜尋玩家' : '搜尋遊戲'} value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setSearchFocused(true); setHighlightedIndex(-1) }} onFocus={() => setSearchFocused(true)} onKeyDown={handlePageSearchKeyDown} placeholder={searchType === 'players' ? '搜尋玩家...' : '搜尋遊戲...'} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#666a75]" /><button type="submit" className="gold-button rounded-lg px-3 py-2 text-xs">搜尋</button></form>{searchType === 'games' && searchFocused && searchInput.trim().length >= 2 && <div id="search-page-results" role="listbox" className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/[.08] bg-[#10151d] shadow-2xl shadow-black/40">{autocompleteLoading ? <p className="p-3 text-xs text-[#a5a7af]">搜尋中...</p> : autocompleteError ? <p className="p-3 text-xs text-[#e59b9b]">{autocompleteError}</p> : autocompleteResults.length > 0 ? autocompleteResults.map((game, index) => <button id={`search-page-result-${game.id}`} key={game.id} type="button" role="option" aria-selected={highlightedIndex === index} onMouseDown={(event) => event.preventDefault()} onClick={() => navigateToGame(game.id)} onMouseEnter={() => setHighlightedIndex(index)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${highlightedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}`}>{game.cover || game.coverImageId ? <img src={game.cover ?? `https://images.igdb.com/igdb/image/upload/t_cover_small/${game.coverImageId}.jpg`} alt="" className="h-11 w-9 shrink-0 rounded object-cover" /> : <span className="h-11 w-9 shrink-0 rounded bg-[#20232d]" />}<span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#eeece5]">{game.displayName ?? game.name}</span></button>) : <p className="p-3 text-xs text-[#a5a7af]">找不到符合的遊戲</p>}</div>}</div></div>
    {searchType === 'games' && <div className="mb-5 flex items-center justify-between lg:hidden"><button type="button" onClick={drawerState.open} className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"><Filter size={16} />篩選</button>{activeFilters.length > 0 && <span className="text-xs text-[#81848f]">{activeFilters.length} 項已套用</span>}</div>}
    {searchType === 'games' && <DrawerRoot state={drawerState}><DrawerTrigger className="hidden">開啟篩選</DrawerTrigger>{drawerState.isOpen && <><DrawerBackdrop className="fixed inset-0 z-40 bg-black/70" /><DrawerContent placement="bottom" className="z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl border-0 bg-[#151821]"><DrawerDialog className="bg-[#151821]"><DrawerHeading className="sr-only">篩選遊戲</DrawerHeading><DrawerBody className="bg-[#151821] p-0">{renderFilterPanel(true)}</DrawerBody></DrawerDialog></DrawerContent></>}</DrawerRoot>}
    {searchType === 'games' && <div className="mb-5 flex flex-wrap gap-2">{activeFilters.map((filter) => <Chip key={filter.key} color="warning" variant="soft" className="text-xs"><ChipLabel>{filter.label}</ChipLabel><button type="button" onClick={filter.remove} aria-label={`移除${filter.label}`} className="ml-1 text-[#10120f]">×</button></Chip>)}</div>}
    <div className={searchType === 'games' ? 'grid min-w-0 gap-7 lg:grid-cols-[280px_minmax(0,1fr)]' : 'min-w-0'}><section className="min-w-0">{searchType === 'players' ? playerContent : <>{localContent}{query && <section className="mt-10 border-t border-white/[.08] pt-8"><h2 className="display-font text-2xl font-bold text-[#f5f3ed]">沒有找到想要的遊戲？</h2><p className="mt-2 text-sm text-[#81848f]">搜尋外部遊戲資料庫，找到後可手動加入 PlayLog。</p><button type="button" onClick={() => loadExternalGames(0, false)} disabled={externalLoading} className="gold-button mt-4 rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">{externalLoading ? '正在搜尋外部遊戲資料庫...' : '搜尋外部遊戲資料庫'}</button>{externalSearched && <div className="mt-8"><h3 className="display-font text-xl font-semibold text-[#f5f3ed]">外部遊戲資料庫</h3>{externalResults.length === 0 && externalLoading ? <p className="mt-5 text-sm text-[#81848f]">正在搜尋外部遊戲資料庫...</p> : externalResults.length === 0 && externalError ? <div className="mt-5 rounded-xl border border-[#7b3f3f] bg-[#2a1719] p-4 text-sm text-[#e59b9b]">{externalError}</div> : externalResults.length > 0 ? <><div className="mt-5 grid gap-4 lg:grid-cols-2">{externalResults.map((game) => <ExternalGameCard key={game.id} game={game} onImported={refreshLocalResults} />)}</div>{externalHasMore && <div className="mt-6 text-center"><button type="button" onClick={() => loadExternalGames(externalResults.length, true)} disabled={externalLoading} className="ghost-button rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">{externalLoading ? '載入中...' : '載入更多'}</button></div>}</> : <p className="mt-5 text-sm text-[#81848f]">外部遊戲資料庫也找不到符合的遊戲。</p>}</div>}</section>}</>}</section>{searchType === 'games' && <aside className="hidden lg:order-first lg:block">{renderFilterPanel()}</aside>}</div>
  </main></div>
}

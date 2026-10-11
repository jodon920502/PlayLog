import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom'
import { getProfileReviews, getPublicGameLibrary, getPublicProfile, getPublicProfileFavorites, type ProfileReview, type PublicProfile } from '../api/profileApi'
import LibraryGameCard, { type LibraryGame } from '../components/game/LibraryGameCard'
import { GAME_STATUS_LABELS, GAME_STATUSES, type GameStatus } from '../services/gameStatusService'
import type { Game } from '../types/game'
import ProfileReviewCard from '../components/profile/ProfileReviewCard'
import { useAuth } from '../context/AuthContext'
import { getIgdbCoverUrl } from '../services/gameService'
import { formatGenreName } from '../utils/gameDisplay'
import SEO from '../components/seo/SEO'
import '../App.css'

type ProfileTab = 'reviews' | 'library' | 'favorites'

function FavoriteGameCard({ game }: { game: Game }) {
  const title = game.displayName ?? game.name
  const cover = game.cover ?? getIgdbCoverUrl(game.coverImageId)
  const releaseYear = game.firstReleaseDate ? new Date(game.firstReleaseDate).getFullYear() : null
  const genreLabel = game.genres?.map((genre) => formatGenreName(genre.name)).join(' · ') || (typeof game.genre === 'string' ? formatGenreName(game.genre) : null)

  return (
    <RouterLink
      to={`/game/${game.id}`}
      aria-label={`查看 ${title}`}
      className="group flex min-w-0 overflow-hidden rounded-xl border border-white/[.07] bg-[#151821] transition hover:-translate-y-0.5 hover:border-[#f2c544]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]"
    >
      <div className="h-32 w-24 shrink-0 overflow-hidden bg-[#20232d] sm:h-36 sm:w-28">
        {cover
          ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={cover} alt={title} />
          : <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#81848f]">目前尚無封面</div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="display-font line-clamp-2 text-base font-semibold text-[#f2f1eb]">{title}</h3>
        <div className="mt-2 space-y-1 text-xs text-[#a8acb6]">
          {releaseYear && <p>發售年份：{releaseYear}</p>}
          {genreLabel && <p className="truncate">遊戲類型：{genreLabel}</p>}
          {game.developerName && <p className="truncate">開發商：{game.developerName}</p>}
        </div>
        <span className="mt-auto pt-3 text-xs font-medium text-[#f2c544]">已收藏</span>
      </div>
    </RouterLink>
  )
}

function ProfilePage() {
  const { profileId } = useParams()
  const location = useLocation()
  const state = location.state as { from?: unknown } | null
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<ProfileReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewsHasMore, setReviewsHasMore] = useState(false)
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false)
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([])
  const [favoritePagination, setFavoritePagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesError, setFavoritesError] = useState('')
  const [activeTab, setActiveTab] = useState<ProfileTab>('reviews')
  const [libraryStatus, setLibraryStatus] = useState<GameStatus | ''>('')
  const [libraryGames, setLibraryGames] = useState<LibraryGame[]>([])
  const [libraryPagination, setLibraryPagination] = useState({ total: 0, limit: 12, offset: 0, hasMore: false })
  const [libraryCounts, setLibraryCounts] = useState<Record<GameStatus, number> | null>(null)
  const [libraryReviewCount, setLibraryReviewCount] = useState<number | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [libraryError, setLibraryError] = useState('')
  const { profile: currentProfile, isLoading: authLoading } = useAuth()
  const isOwnProfile = !authLoading && currentProfile?.id === profileId
  const canViewLibrary = isOwnProfile || Boolean(profile?.gameLibraryPublic)
  const hasValidSearchSource = typeof state?.from === 'string' && (state.from === '/search' || state.from.startsWith('/search?'))
  const hasValidGameSource = typeof state?.from === 'string' && /^\/game\/[^/?#]+$/.test(state.from)
  const returnPath = hasValidSearchSource || hasValidGameSource ? state.from as string : '/search?type=players'
  const returnLabel = isOwnProfile ? '返回首頁' : hasValidGameSource ? '返回遊戲' : hasValidSearchSource ? '返回搜尋結果' : '返回玩家搜尋'
  const returnTarget = isOwnProfile ? '/' : returnPath

  useEffect(() => {
    if (!profileId) {
      setError('找不到玩家資料')
      setLoading(false)
      return
    }

    let alive = true

    const run = async () => {
      try {
        const nextProfile = await getPublicProfile(profileId)
        if (alive) {
          setProfile(nextProfile)
        }
      } catch (requestError) {
        if (alive) {
          setError(requestError instanceof Error ? requestError.message : '無法載入玩家資料')
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [profileId])

  useEffect(() => {
    if (!profileId || !profile || authLoading || !canViewLibrary || activeTab !== 'library') return
    let alive = true
    setLibraryLoading(true)
    setLibraryError('')
    void getPublicGameLibrary(profileId, libraryStatus || undefined, 12, libraryPagination.offset).then((result) => {
      if (!alive) return
      setLibraryGames(result.games)
      setLibraryPagination(result.pagination)
      setLibraryCounts(result.statusCounts)
      setLibraryReviewCount(result.reviewCount)
    }).catch((requestError: unknown) => {
      if (alive) {
        setLibraryGames([])
        setLibraryError(requestError instanceof Error ? requestError.message : '無法載入玩家遊戲庫')
      }
    }).finally(() => {
      if (alive) setLibraryLoading(false)
    })
    return () => { alive = false }
  }, [activeTab, authLoading, canViewLibrary, libraryPagination.offset, libraryStatus, profile, profileId])

  const changeLibraryStatus = (nextStatus: GameStatus | '') => {
    setLibraryStatus(nextStatus)
    setLibraryPagination((current) => ({ ...current, offset: 0 }))
  }

  useEffect(() => {
    if (!profileId || activeTab !== 'favorites') return
    let alive = true
    setFavoritesLoading(true)
    setFavoritesError('')
    void getPublicProfileFavorites(profileId).then((result) => {
      if (alive) {
        setFavoriteGames(result.games)
        setFavoritePagination(result.pagination)
      }
    }).catch((requestError: unknown) => {
      if (alive) setFavoritesError(requestError instanceof Error ? requestError.message : '無法載入收藏遊戲')
    }).finally(() => {
      if (alive) setFavoritesLoading(false)
    })
    return () => { alive = false }
  }, [activeTab, profileId])

  useEffect(() => {
    if (!profileId || activeTab !== 'reviews') return
    let alive = true
    setReviewsLoading(true)
    setReviewsError('')
    setReviews([])
    void getProfileReviews(profileId, 10, 0).then((result) => {
      if (!alive) return
      setReviews(result.reviews)
      setReviewsHasMore(result.pagination.hasMore)
    }).catch((requestError: unknown) => {
      if (alive) setReviewsError(requestError instanceof Error ? requestError.message : '無法載入玩家評測')
    }).finally(() => {
      if (alive) setReviewsLoading(false)
    })
    return () => { alive = false }
  }, [activeTab, profileId])

  useEffect(() => {
    setActiveTab('reviews')
    setLibraryStatus('')
    setLibraryPagination((current) => ({ ...current, offset: 0 }))
  }, [profileId])

  const loadMoreReviews = async () => {
    if (!profileId || reviewsLoadingMore) return
    setReviewsLoadingMore(true)
    try {
      const result = await getProfileReviews(profileId, 10, reviews.length)
      setReviews((current) => [...current, ...result.reviews])
      setReviewsHasMore(result.pagination.hasMore)
    } catch (requestError: unknown) {
      setReviewsError(requestError instanceof Error ? requestError.message : '無法載入更多評測')
    } finally {
      setReviewsLoadingMore(false)
    }
  }

  if (loading) {
    return <><SEO title="玩家個人頁｜PlayLog" description="查看 PlayLog 玩家公開的個人資料、評測與收藏遊戲。" /><main className="page-width py-16 text-center text-[#a8acb6]">載入中...</main></>
  }

  if (error || !profile) {
    return (
      <><SEO title="玩家個人頁｜PlayLog" description="查看 PlayLog 玩家公開的個人資料、評測與收藏遊戲。" /><main className="page-width py-16">
        <div className="glass max-w-xl rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-[#f5f3ed]">玩家資料不存在</p>
          <p className="mt-3 text-sm text-[#a8acb6]">{error || '此頁面目前不可用。'}</p>
          <RouterLink to="/" className="mt-6 inline-block text-sm text-[#f2c544]">返回首頁</RouterLink>
        </div>
      </main></>
    )
  }

  return (
    <><SEO title={`${profile.displayName} 的個人頁｜PlayLog`} description={`查看 ${profile.displayName} 在 PlayLog 的公開評測與收藏遊戲。`} /><main className="page-width py-10">
      {authLoading
        ? <span aria-live="polite" className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#81848f]"><ArrowLeft size={16} />返回選項載入中...</span>
        : <RouterLink to={returnTarget} className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#c5c6ca] transition hover:bg-white/[.05] hover:text-[#f2c544] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]"><ArrowLeft size={16} />{returnLabel}</RouterLink>}
      <div className="overflow-hidden rounded-3xl border border-white/[.08] bg-[#10151d] shadow-2xl shadow-black/20">
        <div className="h-40 bg-gradient-to-r from-[#f2c544]/30 via-[#7c5cff]/25 to-[#3ab0ff]/20" />
        <div className="px-6 pb-8 pt-0 sm:px-8">
          <div className="-mt-14 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#10151d] bg-[#1d2430] text-3xl font-bold text-[#f2c544]">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" /> : profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="display-font text-3xl font-bold text-[#f5f3ed]">{profile.displayName}</h1>
              <p className="mt-1 text-xs text-[#8a8f9c]">加入於 {new Date(profile.createdAt).toLocaleDateString('zh-TW')}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            <section className="rounded-2xl border border-white/[.06] bg-[#0d1219] p-5">
              <p className="section-label mb-2">自我介紹</p>
              <p className="text-sm leading-7 text-[#dfe2ea]">{profile.bio || '這位玩家還沒有留下自我介紹。'}</p>
            </section>
            <aside className="rounded-2xl border border-white/[.06] bg-[#0d1219] p-5">
              <p className="section-label mb-3">最近動態</p>
              <div className="space-y-3 text-sm text-[#bac0cd]">
                <p>{libraryReviewCount === null ? '評測統計請查看玩家評測' : `公開評測 ${libraryReviewCount} 篇`}</p>
                <p>{favoritePagination.total > 0 ? `收藏遊戲 ${favoritePagination.total} 款` : '收藏數量請查看收藏分頁'}</p>
              </div>
            </aside>
          </div>

          <div className="mt-10 border-b border-white/[.08]" role="tablist" aria-label="玩家內容分類">
            <div className="flex flex-wrap gap-2 sm:gap-6">
              <button type="button" role="tab" aria-selected={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} className={`border-b-2 px-2 py-3 text-sm font-medium transition ${activeTab === 'reviews' ? 'border-[#f2c544] text-[#f2c544]' : 'border-transparent text-[#a8acb6] hover:text-[#f2c544]'}`}>玩家評測</button>
              {canViewLibrary && <button type="button" role="tab" aria-selected={activeTab === 'library'} onClick={() => setActiveTab('library')} className={`border-b-2 px-2 py-3 text-sm font-medium transition ${activeTab === 'library' ? 'border-[#f2c544] text-[#f2c544]' : 'border-transparent text-[#a8acb6] hover:text-[#f2c544]'}`}>遊戲庫{libraryPagination.total > 0 && ` (${libraryPagination.total})`}</button>}
              <button type="button" role="tab" aria-selected={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} className={`border-b-2 px-2 py-3 text-sm font-medium transition ${activeTab === 'favorites' ? 'border-[#f2c544] text-[#f2c544]' : 'border-transparent text-[#a8acb6] hover:text-[#f2c544]'}`}>收藏{favoritePagination.total > 0 && ` (${favoritePagination.total})`}</button>
            </div>
          </div>
          {activeTab === 'reviews' && <section className="mt-8" role="tabpanel">
            <div className="mb-5">
              <p className="section-label mb-2">Reviews</p>
              <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">{currentProfile?.id === profile.id ? '我的評測' : '玩家評測'}</h2>
            </div>
            {reviewsLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入評測中...</p>}
            {reviewsError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{reviewsError}</p>}
            {!reviewsLoading && !reviewsError && reviews.length === 0 && <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-8 text-center text-sm text-[#81848f]">目前還沒有公開評測。</div>}
            {!reviewsLoading && !reviewsError && reviews.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{reviews.map((review) => <div key={review.id} className="min-w-0"><ProfileReviewCard review={review} /></div>)}</div>}
            {!reviewsLoading && reviewsHasMore && <div className="mt-6 text-center"><button type="button" onClick={() => void loadMoreReviews()} disabled={reviewsLoadingMore} className="ghost-button rounded-lg px-5 py-2.5 text-sm">{reviewsLoadingMore ? '載入中...' : '載入更多'}</button></div>}
          </section>}
          {activeTab === 'library' && canViewLibrary && <section className="mt-8" role="tabpanel">
            <div className="mb-5">
              <p className="section-label mb-2">Game Library</p>
              <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">{isOwnProfile ? '我的遊戲統計與遊戲庫' : '玩家遊戲庫'}</h2>
            </div>
            {libraryCounts && <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">想玩</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryCounts.wishlist}</p></div>
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">遊玩中</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryCounts.playing}</p></div>
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">已通關</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryCounts.completed}</p></div>
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">已暫停</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryCounts.paused}</p></div>
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">已棄坑</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryCounts.dropped}</p></div>
              <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-3"><p className="text-xs text-[#81848f]">評測總數</p><p className="mt-1 text-xl font-semibold text-[#f2c544]">{libraryReviewCount ?? 0}</p></div>
            </div>}
            <div className="mb-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => changeLibraryStatus('')} className={`rounded-full px-3 py-1.5 text-xs transition ${libraryStatus === '' ? 'bg-[#f2c544] text-[#10120f]' : 'border border-white/[.1] text-[#a5a7af] hover:border-[#f2c544]/50'}`}>全部</button>
              {GAME_STATUSES.map((item) => <button key={item} type="button" onClick={() => changeLibraryStatus(item)} className={`rounded-full px-3 py-1.5 text-xs transition ${libraryStatus === item ? 'bg-[#f2c544] text-[#10120f]' : 'border border-white/[.1] text-[#a5a7af] hover:border-[#f2c544]/50'}`}>{GAME_STATUS_LABELS[item]}</button>)}
            </div>
            {libraryLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入遊戲庫中...</p>}
            {libraryError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{libraryError}</p>}
            {!libraryLoading && !libraryError && libraryGames.length === 0 && <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-8 text-center text-sm text-[#81848f]">目前沒有符合的遊戲。</div>}
            {!libraryLoading && !libraryError && libraryGames.length > 0 && <><div className="grid gap-4 lg:grid-cols-2">{libraryGames.map((game) => <LibraryGameCard key={game.id} game={game} />)}</div><div className="mt-6 flex items-center justify-between text-xs text-[#777b86]"><span>共 {libraryPagination.total} 款遊戲</span><div className="flex gap-2"><button type="button" disabled={libraryPagination.offset === 0} onClick={() => setLibraryPagination((current) => ({ ...current, offset: Math.max(0, current.offset - current.limit) }))} className="rounded-lg border border-white/[.08] px-3 py-2 disabled:opacity-40">上一頁</button><button type="button" disabled={!libraryPagination.hasMore} onClick={() => setLibraryPagination((current) => ({ ...current, offset: current.offset + current.limit }))} className="rounded-lg border border-white/[.08] px-3 py-2 disabled:opacity-40">下一頁</button></div></div></>}
          </section>}
          {activeTab === 'favorites' && <section className="mt-8" role="tabpanel">
            <div className="mb-5">
              <p className="section-label mb-2">Collection</p>
              <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">收藏的遊戲</h2>
            </div>
            {favoritesLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入收藏遊戲中...</p>}
            {favoritesError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{favoritesError}</p>}
            {!favoritesLoading && !favoritesError && favoriteGames.length === 0 && <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-8 text-center text-sm text-[#81848f]">目前還沒有公開收藏的遊戲。</div>}
            {!favoritesLoading && !favoritesError && favoriteGames.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{favoriteGames.map((game) => <FavoriteGameCard key={game.id} game={game} />)}</div>}
          </section>}
        </div>
      </div>
    </main></>
  )
}

export default ProfilePage

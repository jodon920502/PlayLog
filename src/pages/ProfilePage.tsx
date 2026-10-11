import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom'
import { getProfileReviews, getPublicProfile, getPublicProfileFavorites, type ProfileReview, type PublicProfile } from '../api/profileApi'
import type { Game } from '../types/game'
import ProfileReviewCard from '../components/profile/ProfileReviewCard'
import { useAuth } from '../context/AuthContext'
import { getIgdbCoverUrl } from '../services/gameService'
import { formatGenreName } from '../utils/gameDisplay'
import '../App.css'

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
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesError, setFavoritesError] = useState('')
  const { profile: currentProfile, isLoading: authLoading } = useAuth()
  const isOwnProfile = !authLoading && currentProfile?.id === profileId
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
    if (!profileId) return
    let alive = true
    setFavoritesLoading(true)
    setFavoritesError('')
    void getPublicProfileFavorites(profileId).then((result) => {
      if (alive) setFavoriteGames(result.games)
    }).catch((requestError: unknown) => {
      if (alive) setFavoritesError(requestError instanceof Error ? requestError.message : '無法載入收藏遊戲')
    }).finally(() => {
      if (alive) setFavoritesLoading(false)
    })
    return () => { alive = false }
  }, [profileId])

  useEffect(() => {
    if (!profileId) return
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
    return <main className="page-width py-16 text-center text-[#a8acb6]">載入中...</main>
  }

  if (error || !profile) {
    return (
      <main className="page-width py-16">
        <div className="glass max-w-xl rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-[#f5f3ed]">玩家資料不存在</p>
          <p className="mt-3 text-sm text-[#a8acb6]">{error || '此頁面目前不可用。'}</p>
          <RouterLink to="/" className="mt-6 inline-block text-sm text-[#f2c544]">返回首頁</RouterLink>
        </div>
      </main>
    )
  }

  return (
    <main className="page-width py-10">
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
                <p>{reviewsLoading ? '評測載入中...' : `公開評測 ${reviews.length}${reviewsHasMore ? '+' : ''} 篇`}</p>
                <p>{favoritesLoading ? '收藏載入中...' : `收藏遊戲 ${favoriteGames.length}${favoriteGames.length === 20 ? '+' : ''} 款`}</p>
              </div>
            </aside>
          </div>

          <section className="mt-10">
            <div className="mb-5">
              <p className="section-label mb-2">Reviews</p>
              <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">{currentProfile?.id === profile.id ? '我的評測' : '玩家評測'}</h2>
            </div>
            {reviewsLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入評測中...</p>}
            {reviewsError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{reviewsError}</p>}
            {!reviewsLoading && !reviewsError && reviews.length === 0 && <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-8 text-center text-sm text-[#81848f]">目前還沒有公開評測。</div>}
            {!reviewsLoading && !reviewsError && reviews.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{reviews.map((review) => <div key={review.id} className="min-w-0"><ProfileReviewCard review={review} /></div>)}</div>}
            {!reviewsLoading && reviewsHasMore && <div className="mt-6 text-center"><button type="button" onClick={() => void loadMoreReviews()} disabled={reviewsLoadingMore} className="ghost-button rounded-lg px-5 py-2.5 text-sm">{reviewsLoadingMore ? '載入中...' : '載入更多'}</button></div>}
          </section>
          <section className="mt-10">
            <div className="mb-5">
              <p className="section-label mb-2">Collection</p>
              <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">收藏的遊戲</h2>
            </div>
            {favoritesLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入收藏遊戲中...</p>}
            {favoritesError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{favoritesError}</p>}
            {!favoritesLoading && !favoritesError && favoriteGames.length === 0 && <div className="rounded-xl border border-white/[.06] bg-[#0d1219] p-8 text-center text-sm text-[#81848f]">目前還沒有公開收藏的遊戲。</div>}
            {!favoritesLoading && !favoritesError && favoriteGames.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{favoriteGames.map((game) => <FavoriteGameCard key={game.id} game={game} />)}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage

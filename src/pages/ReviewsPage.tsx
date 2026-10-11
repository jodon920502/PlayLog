import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import ReviewDisplayCard from '../components/review/ReviewDisplayCard'
import SortDropdown from '../components/ui/SortDropdown'
import { getPublicReviews, type CommunityReview, type ReviewSort } from '../services/reviewService'

const sortOptions: Array<{ value: ReviewSort; label: string }> = [
  { value: 'latest', label: '最新評測' },
  { value: 'oldest', label: '最舊評測' },
  { value: 'highest', label: '評分最高' },
  { value: 'lowest', label: '評分最低' },
]

export default function ReviewsPage() {
  const [sort, setSort] = useState<ReviewSort>('latest')
  const [reviews, setReviews] = useState<CommunityReview[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void getPublicReviews(sort, 20, page * 20)
      .then((result) => {
        if (!active) return
        setReviews(result.reviews)
        setTotal(result.pagination.total ?? 0)
        setHasMore(result.pagination.hasMore)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(requestError instanceof Error ? requestError.message : '評論服務暫時無法使用')
        setReviews([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, sort])

  const changeSort = (value: ReviewSort) => {
    setSort(value)
    setPage(0)
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar />
      <main className="page-width py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Community Reviews</p>
          <h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">玩家評測</h1>
          <p className="mt-2 text-sm text-[#898d99]">看看 PlayLog 玩家分享的遊戲心得。</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#a5a7af]">
          <span>排序</span>
          <SortDropdown value={sort} options={sortOptions} onChange={(value) => changeSort(value as ReviewSort)} />
        </div>
      </div>

      {loading && <p className="rounded-xl border border-white/[.07] bg-[#151821] p-6 text-sm text-[#a5a7af]">載入玩家評測中...</p>}
      {!loading && error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">{error}</p>}
      {!loading && !error && reviews.length === 0 && <div className="rounded-xl border border-white/[.07] bg-[#151821] p-10 text-center"><p className="text-sm text-[#c7c6c0]">目前還沒有公開玩家評測。</p><p className="mt-2 text-xs text-[#777b86]">成為第一個分享遊戲心得的玩家吧！</p></div>}
      {!loading && !error && reviews.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => <ReviewDisplayCard key={review.id} review={{
              gameId: review.gameId,
              gameName: review.gameName ?? '未知遊戲',
              coverImageId: review.coverImageId ?? null,
              rating: review.rating,
              content: review.content,
              createdAt: review.createdAt,
              updatedAt: review.updatedAt,
              authorProfileId: review.author.profileId,
              authorDisplayName: review.author.displayName,
              authorAvatarUrl: review.author.avatarUrl,
            }} />)}
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            <span className="text-xs text-[#777b86]">共 {total} 則評測</span>
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

import { Link } from 'react-router-dom'
import { getIgdbCoverUrl } from '../../services/gameService'
import type { ProfileReview } from '../../api/profileApi'

export default function ProfileReviewCard({ review }: { review: ProfileReview }) {
  const createdAt = new Date(review.createdAt)
  const updatedAt = new Date(review.updatedAt)
  const wasEdited = updatedAt.getTime() - createdAt.getTime() > 1000
  const cover = getIgdbCoverUrl(review.coverImageId)
  const formatDate = (value: Date) => [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('/') + ` ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`

  return (
    <article className="flex gap-4 rounded-xl border border-white/[.07] bg-[#151821] p-4 sm:gap-5 sm:p-5">
      <Link to={`/game/${review.gameId}`} className="block w-24 shrink-0 sm:w-32">
        {cover ? <img src={cover} alt={`${review.gameName} 封面`} className="aspect-[4/5] w-full rounded-lg object-cover" /> : <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-[#20232d] text-center text-[11px] text-[#81848f]">目前尚無封面</div>}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/game/${review.gameId}`} className="display-font line-clamp-2 text-lg font-bold text-[#f5f3ed] hover:text-[#f2c544]">{review.gameName}</Link>
        <p className="mt-2 text-sm font-bold text-[#f2c544]">{review.rating.toFixed(1)} / 5.0</p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#b9bbc2]">{review.content || '僅評分'}</p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#777b86]">
          <span>發表於 {formatDate(createdAt)}</span>
          {wasEdited && <span>編輯於 {formatDate(updatedAt)} · 已編輯</span>}
        </div>
      </div>
    </article>
  )
}

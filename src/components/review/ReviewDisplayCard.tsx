import { Link } from 'react-router-dom'
import { getIgdbCoverUrl } from '../../services/gameService'

export interface ReviewDisplayData {
  gameId: string
  gameName: string
  coverImageId: string | null
  rating: number
  content: string | null
  createdAt: string
  updatedAt: string
  authorProfileId: string | null
  authorDisplayName: string
  authorAvatarUrl: string | null
}

export default function ReviewDisplayCard({ review }: { review: ReviewDisplayData }) {
  const createdAt = new Date(review.createdAt)
  const updatedAt = new Date(review.updatedAt)
  const wasEdited = updatedAt.getTime() - createdAt.getTime() > 1000
  const formatDate = (value: Date) => value.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/-/g, '/').replace(/\s+/g, ' ')
  const avatar = review.authorAvatarUrl ?? 'https://placehold.co/80x80/20232d/f2c544?text=P'
  const cover = getIgdbCoverUrl(review.coverImageId)

  return (
    <article className="h-full min-w-0 rounded-xl border border-white/[.07] bg-[#151821] p-5">
      <div className="flex items-center gap-3">
        {review.authorProfileId ? <Link to={`/profile/${review.authorProfileId}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]"><img className="h-9 w-9 rounded-full object-cover" src={avatar} alt={review.authorDisplayName} /></Link> : <img className="h-9 w-9 rounded-full object-cover" src={avatar} alt={review.authorDisplayName} />}
        <div className="min-w-0 text-sm text-[#eeece5]">
          {review.authorProfileId ? <Link to={`/profile/${review.authorProfileId}`} className="font-semibold hover:text-[#f2c544]">{review.authorDisplayName}</Link> : <span className="font-semibold">{review.authorDisplayName}</span>}
          <div className="text-[11px] text-[#777b86]">{formatDate(createdAt)}{wasEdited && ' · 已編輯'}</div>
        </div>
      </div>
      <div className="mt-5 flex gap-4">
        <Link to={`/game/${review.gameId}`} className="h-24 w-16 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c544]">
          {cover ? <img className="h-full w-full rounded-lg object-cover" src={cover} alt={review.gameName} /> : <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#20232d] text-center text-[10px] text-[#81848f]">無封面</div>}
        </Link>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="display-font break-words text-sm"><Link to={`/game/${review.gameId}`} className="font-semibold text-[#f3f1e9] hover:text-[#f2c544]">{review.gameName}</Link></h3>
          <p className="mt-2 text-sm font-bold text-[#f2c544]">{review.rating.toFixed(1)} / 5.0</p>
          <p className="mt-3 line-clamp-3 break-words text-xs leading-5 text-[#a5a7af]">{review.content || '僅評分'}</p>
        </div>
      </div>
      {wasEdited && <p className="mt-3 text-[11px] text-[#777b86]">編輯於 {formatDate(updatedAt)} · 已編輯</p>}
    </article>
  )
}

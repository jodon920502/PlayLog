import { Pencil, Trash2 } from 'lucide-react'
import UserAvatar from '../user/UserAvatar'
import type { CommunityReview } from '../../services/reviewService'

export default function CommunityReviewCard({
  review,
  isOwner,
  onEdit,
  onDelete,
}: {
  review: CommunityReview
  isOwner: boolean
  onEdit: () => void
  onDelete: (trigger: HTMLButtonElement) => void
}) {
  const avatar = review.author.avatarUrl ?? 'https://placehold.co/80x80/20232d/f2c544?text=P'
  const createdAt = new Date(review.createdAt)
  const updatedAt = new Date(review.updatedAt)
  const wasEdited = updatedAt.getTime() - createdAt.getTime() > 1000
  const isNew = !wasEdited && Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000
  const formatDate = (value: Date) => [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('/') + ` ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  return (
    <article className="rounded-xl border border-white/[.07] bg-[#151821] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar src={avatar} name={review.author.displayName} size="sm" />
          <div>
            <h3 className="text-sm font-semibold text-[#eeece5]">{review.author.displayName}</h3>
            <div className="flex flex-wrap gap-x-2 text-[11px] text-[#777b86]">
              <span>發表於 {formatDate(createdAt)}</span>
              {wasEdited && <span>編輯於 {formatDate(updatedAt)} · 已編輯</span>}
              {isNew && <span className="text-[#f2c544]">新評論</span>}
            </div>
          </div>
        </div>
        {isOwner && <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="text-[#777b86] hover:text-[#f2c544]" aria-label="編輯評論"><Pencil size={15} /></button>
          <button type="button" onClick={(event) => onDelete(event.currentTarget)} className="text-[#777b86] hover:text-[#f06c6c]" aria-label="刪除評論"><Trash2 size={15} /></button>
        </div>}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-bold text-[#f2c544]">{review.rating.toFixed(1)} / 5.0</span>
      </div>
      {review.content && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#b9bbc2]">{review.content}</p>}
    </article>
  )
}

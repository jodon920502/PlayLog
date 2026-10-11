import { ArrowLeft, PenLine } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import CommunityReviewCard from '../components/review/CommunityReviewCard'
import RatingInput from '../components/review/RatingInput'
import { useAuth } from '../context/AuthContext'
import { getGameById, getIgdbCoverUrl } from '../services/gameService'
import { createReview, deleteReview, getMyReview, getRatingSummary, getReviews, updateReview, type CommunityReview, type RatingSummary, type ReviewSort } from '../services/reviewService'
import type { Game } from '../types/game'

function DeleteReviewDialog({ isOpen, isDeleting, error, onCancel, onConfirm }: {
  isOpen: boolean
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    cancelRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onCancel()
      if (event.key !== 'Tab') return
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLButtonElement[]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDeleting, isOpen, onCancel])

  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) onCancel() }}>
    <div className="w-full max-w-md rounded-2xl border border-white/[.1] bg-[#151821] p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-review-title" aria-describedby="delete-review-description">
      <h2 id="delete-review-title" className="display-font text-xl font-bold text-[#f5f3ed]">確定刪除這篇評測？</h2>
      <p id="delete-review-description" className="mt-3 text-sm leading-6 text-[#a5a7af]">刪除後，你的評分與心得將從 PlayLog 移除，且無法復原。</p>
      {error && <p className="mt-3 text-sm text-[#f06c6c]" role="alert">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button ref={cancelRef} type="button" onClick={onCancel} disabled={isDeleting} className="ghost-button rounded-lg px-4 py-2 text-sm">取消</button>
        <button ref={confirmRef} type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-lg bg-[#b94b4b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d05b5b] disabled:cursor-not-allowed disabled:opacity-60">{isDeleting ? '刪除中...' : '確認刪除'}</button>
      </div>
    </div>
  </div>
}

export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, accessToken } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<ReviewSort>('latest')
  const [communityReviews, setCommunityReviews] = useState<CommunityReview[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ averageRating: null, ratingCount: 0 })
  const [myReview, setMyReview] = useState<CommunityReview | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const reviewsHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getGameById(gameId).then((result) => {
      if (!cancelled) setGame(result)
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : '遊戲資料暫時無法使用')
    }).finally(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [gameId])

  useEffect(() => {
    if (!game?.id) return
    let cancelled = false
    setReviewsLoading(true)
    setReviewsError(null)
    Promise.all([
      getReviews(game.id, sort),
      getRatingSummary(game.id),
      isAuthenticated && accessToken ? getMyReview(game.id) : Promise.resolve(null),
    ]).then(([reviewPage, summary, ownReview]) => {
      if (cancelled) return
      setCommunityReviews(reviewPage.reviews)
      setRatingSummary(summary)
      setMyReview(ownReview)
    }).catch((requestError: unknown) => {
      if (!cancelled) setReviewsError(requestError instanceof Error ? requestError.message : '評論資料暫時無法使用')
    }).finally(() => {
      if (!cancelled) setReviewsLoading(false)
    })
    return () => { cancelled = true }
  }, [accessToken, game?.id, isAuthenticated, sort])

  const resetForm = () => {
    setFormRating(myReview?.rating ?? 5)
    setFormContent(myReview?.content ?? '')
    setFormError(null)
  }

  const openCreateForm = () => {
    resetForm()
    setEditing(false)
    setShowForm(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const openEditForm = () => {
    if (!myReview) return
    setFormRating(myReview.rating)
    setFormContent(myReview.content ?? '')
    setFormError(null)
    setEditing(true)
    setShowForm(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const closeForm = () => {
    resetForm()
    setEditing(false)
    setShowForm(false)
  }

  const refreshReviews = async () => {
    if (!game?.id) return
    const [reviewPage, summary, ownReview] = await Promise.all([
      getReviews(game.id, sort),
      getRatingSummary(game.id),
      isAuthenticated && accessToken ? getMyReview(game.id) : Promise.resolve(null),
    ])
    setCommunityReviews(reviewPage.reviews)
    setRatingSummary(summary)
    setMyReview(ownReview)
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!game?.id || !isAuthenticated) return
    setFormLoading(true)
    setFormError(null)
    try {
      if (editing && myReview) await updateReview(myReview.id, formRating, formContent)
      else await createReview(game.id, formRating, formContent)
      await refreshReviews()
      setEditing(false)
      setShowForm(false)
    } catch (requestError: unknown) {
      setFormError(requestError instanceof Error ? requestError.message : '評論送出失敗')
    } finally {
      setFormLoading(false)
    }
  }

  const requestDelete = (trigger: HTMLButtonElement) => {
    deleteTriggerRef.current = trigger
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const restoreDeleteFocus = () => {
    requestAnimationFrame(() => {
      if (deleteTriggerRef.current?.isConnected) {
        deleteTriggerRef.current.focus()
      } else {
        reviewsHeadingRef.current?.focus()
      }
    })
  }

  const cancelDelete = () => {
    if (deleteLoading) return
    setDeleteDialogOpen(false)
    restoreDeleteFocus()
  }

  const confirmDelete = async () => {
    if (!myReview) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteReview(myReview.id)
      await refreshReviews()
      setDeleteDialogOpen(false)
      closeForm()
      restoreDeleteFocus()
    } catch (requestError: unknown) {
      setDeleteError(requestError instanceof Error ? requestError.message : '評論刪除失敗')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isLoading) return <div className="app-shell min-h-screen"><Navbar /><main className="page-width flex min-h-[60vh] items-center justify-center text-sm text-[#81848f]">載入遊戲資料中...</main></div>
  if (error || !game) return <div className="app-shell min-h-screen"><Navbar /><main className="page-width flex min-h-[60vh] flex-col items-center justify-center text-center"><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">{error ? '遊戲資料暫時無法使用' : '找不到這款遊戲'}</h1><p className="mt-3 text-sm text-[#81848f]">{error ?? '這個遊戲可能尚未加入 PlayLog。'}</p><div className="mt-6 flex gap-3"><button onClick={() => navigate('/')} className="gold-button rounded-lg px-4 py-2 text-sm">返回首頁</button><Link to="/search" className="ghost-button rounded-lg px-4 py-2 text-sm">搜尋其他遊戲</Link></div></main></div>

  const title = game.displayName ?? game.name
  const cover = game.cover ?? getIgdbCoverUrl(game.coverImageId)
  const genres = game.genres?.map((genre) => genre.name).join(' · ')
  const platforms = game.platforms.map((platform) => typeof platform === 'string' ? platform : platform.name).join(' · ')
  const releaseYear = game.firstReleaseDate ? new Date(game.firstReleaseDate).getFullYear() : null

  return <div className="app-shell min-h-screen">
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a5a8b2] hover:text-[#f2c544]"><ArrowLeft size={16} />返回上一頁</button>
      <section className="grid gap-7 rounded-2xl border border-white/[.08] bg-[#151821] p-5 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {cover ? <img src={cover} alt={`${title} 封面`} className="mx-auto aspect-[4/5] w-44 rounded-xl object-cover shadow-2xl ring-1 ring-white/10 sm:w-52 lg:mx-0 lg:w-full" /> : <div className="mx-auto flex aspect-[4/5] w-44 items-center justify-center rounded-xl bg-[#20232d] text-center text-xs text-[#81848f] sm:w-52 lg:mx-0 lg:w-full">目前尚無封面</div>}
        <div className="min-w-0"><p className="section-label mb-3">Game profile</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">{title}</h1><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#a5a7af]">{releaseYear && <span>{releaseYear}</span>}{genres && <span>{genres}</span>}{game.developerName && <span>{game.developerName}</span>}{game.publisherName && <span>{game.publisherName}</span>}{platforms && <span>{platforms}</span>}</div><p className="mt-5 max-w-3xl text-sm leading-6 text-[#b9bbc2]">{game.displaySummary ?? '目前尚無遊戲介紹。'}</p>{isAuthenticated ? <button type="button" onClick={openCreateForm} disabled={Boolean(myReview)} className="mt-7 inline-flex items-center gap-2 rounded-lg border border-[#f2c544]/30 px-4 py-2.5 text-sm text-[#f2c544] disabled:cursor-not-allowed disabled:opacity-50"><PenLine size={15} />{myReview ? '已發表評測' : '撰寫評測'}</button> : <a href="#community-reviews" className="mt-7 inline-flex items-center gap-2 rounded-lg border border-[#f2c544]/30 px-4 py-2.5 text-sm text-[#f2c544]"><PenLine size={15} />登入後撰寫評測</a>}</div>
      </section>
      <section className="mt-10"><h2 className="display-font text-2xl font-bold text-[#f5f3ed]">遊戲介紹</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#a5a7af]">{game.displaySummary ?? '目前尚無遊戲介紹。'}</p></section>
      <section id="community-reviews" className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-label mb-2">Community reviews</p><h2 ref={reviewsHeadingRef} tabIndex={-1} className="display-font text-2xl font-bold text-[#f5f3ed]">玩家評測 <span className="text-base font-normal text-[#777b86]">({ratingSummary.ratingCount})</span></h2><p className="mt-2 text-sm text-[#a5a7af]">{ratingSummary.averageRating === null ? '尚無評分' : `平均評分 ${ratingSummary.averageRating.toFixed(1)} / 5.0`}</p></div><select aria-label="評測排序" value={sort} onChange={(event) => setSort(event.target.value as ReviewSort)} className="filter-select rounded-lg px-3 py-2 text-xs outline-none"><option value="latest">最新</option><option value="oldest">最舊</option><option value="highest">最高分</option><option value="lowest">最低分</option></select></div>
        {!isAuthenticated && <div className="mb-5 rounded-xl border border-[#f2c544]/20 bg-[#f2c544]/[.06] p-4 text-sm text-[#c5c3bb]">登入後即可評分或發表評論。 <Link to="/login" className="text-[#f2c544] hover:underline">前往登入</Link></div>}
        {isAuthenticated && showForm && <form ref={formRef} onSubmit={submitReview} className="mb-6 rounded-xl border border-white/[.07] bg-[#151821] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><RatingInput value={formRating} onChange={setFormRating} disabled={formLoading} /><span className="text-xs text-[#777b86]">{formContent.length}/5000</span></div><textarea value={formContent} onChange={(event) => setFormContent(event.target.value)} maxLength={5000} rows={4} placeholder="分享你的遊戲心得（選填）" className="mt-4 w-full rounded-lg border border-white/[.08] bg-[#20232d] p-3 text-sm text-[#eeece5] outline-none focus:border-[#f2c544]/60" disabled={formLoading} />{formError && <p className="mt-3 text-sm text-[#f06c6c]" role="alert">{formError}</p>}<div className="mt-4 flex gap-3"><button type="submit" disabled={formLoading} className="gold-button rounded-lg px-4 py-2 text-sm">{formLoading ? '處理中...' : editing ? '儲存修改' : '發表評論'}</button>{editing && <button type="button" onClick={closeForm} disabled={formLoading} className="ghost-button rounded-lg px-4 py-2 text-sm">取消</button>}</div></form>}
        {reviewsLoading && <p className="py-6 text-center text-sm text-[#81848f]">載入評論中...</p>}
        {reviewsError && <p className="rounded-xl border border-[#f06c6c]/30 p-5 text-sm text-[#f06c6c]" role="alert">{reviewsError}</p>}
        {!reviewsLoading && !reviewsError && communityReviews.length > 0 && <div className="grid gap-4 xl:grid-cols-2">{communityReviews.map((review) => <CommunityReviewCard key={review.id} review={review} isOwner={myReview?.id === review.id} onEdit={openEditForm} onDelete={requestDelete} />)}</div>}
        {!reviewsLoading && !reviewsError && communityReviews.length === 0 && <div className="glass rounded-xl p-8 text-center text-sm text-[#81848f]">目前還沒有玩家評測。<br /><span className="mt-2 inline-block">成為第一個分享遊戲心得的玩家吧！</span></div>}
      </section>
    </main>
    <DeleteReviewDialog isOpen={deleteDialogOpen} isDeleting={deleteLoading} error={deleteError} onCancel={cancelDelete} onConfirm={confirmDelete} />
  </div>
}

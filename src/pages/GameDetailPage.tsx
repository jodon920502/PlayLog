import { ArrowLeft, PenLine, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import GameScore from '../components/game/GameScore'
import RatingBar from '../components/review/RatingBar'
import ReviewCard from '../components/review/ReviewCard'
import { reviews } from '../data/mockReviews'
import { getGameById } from '../services/gameService'

type ReviewSort = 'latest' | 'highest' | 'lowest'

export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = getGameById(gameId)
  const [sort, setSort] = useState<ReviewSort>('latest')

  const gameReviews = useMemo(() => {
    const matchingReviews = reviews.filter((review) => review.game.id === game?.id)
    return [...matchingReviews].sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating
      if (sort === 'lowest') return a.rating - b.rating
      return reviews.indexOf(b) - reviews.indexOf(a)
    })
  }, [game?.id, sort])

  if (!game) {
    return <div className="app-shell min-h-screen"><Navbar /><main className="page-width flex min-h-[60vh] flex-col items-center justify-center text-center"><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">找不到這款遊戲</h1><p className="mt-3 text-sm text-[#81848f]">這個遊戲可能尚未加入 PlayLog。</p><div className="mt-6 flex gap-3"><button onClick={() => navigate('/')} className="gold-button rounded-lg px-4 py-2 text-sm">返回首頁</button><Link to="/search" className="ghost-button rounded-lg px-4 py-2 text-sm">搜尋其他遊戲</Link></div></main></div>
  }

  return <div className="app-shell min-h-screen">
    <Navbar />
    <main className="page-width py-8 sm:py-10">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a5a8b2] hover:text-[#f2c544]"><ArrowLeft size={16} />返回上一頁</button>
      <section className="grid gap-7 rounded-2xl border border-white/[.08] bg-[#151821] p-5 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
        <img src={game.cover} alt={`${game.name} 封面`} className="mx-auto aspect-[4/5] w-44 rounded-xl object-cover shadow-2xl ring-1 ring-white/10 sm:w-52 lg:mx-0 lg:w-full" />
        <div className="min-w-0">
          <p className="section-label mb-3">Game profile</p>
          <h1 className="display-font text-3xl font-bold text-[#f5f3ed] sm:text-4xl">{game.name}</h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#a5a7af]"><span>{game.genre}</span><span>{game.developer}</span><span>{game.platforms.join(' · ')}</span></div>
          <p className="mt-5 text-sm leading-6 text-[#b9bbc2]">{game.description || '目前尚無遊戲介紹。'}</p>
          <button disabled className="mt-7 flex cursor-not-allowed items-center gap-2 rounded-lg border border-[#f2c544]/30 px-4 py-2.5 text-sm text-[#f2c544]/70"><PenLine size={15} />評測功能開發中</button>
        </div>
        <div className="rounded-xl border border-white/[.07] bg-[#10131b] p-5">
          <p className="text-sm text-[#a5a7af]">PlayLog Score</p>
          <div className="mt-3 flex items-center gap-3"><GameScore score={game.score} /><span className="text-xs text-[#777b86]">/ 5.0</span></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#777b86]"><Star size={13} fill="#f2c544" color="#f2c544" />{game.reviewCount.toLocaleString()} 則評測</div>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">遊戲介紹</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#a5a7af]">{game.description || '目前尚無遊戲介紹。'}</p>
        {gameReviews.length > 0 && <div className="mt-7 max-w-xl rounded-xl border border-white/[.07] bg-[#151821] p-5"><h3 className="display-font mb-4 font-semibold">玩家評分分析</h3><RatingBar label="平均評分" value={game.score} /></div>}
      </section>
      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-label mb-2">Community reviews</p><h2 className="display-font text-2xl font-bold text-[#f5f3ed]">玩家評測 <span className="text-base font-normal text-[#777b86]">({gameReviews.length})</span></h2></div><select aria-label="評測排序" value={sort} onChange={(event) => setSort(event.target.value as ReviewSort)} className="filter-select rounded-lg px-3 py-2 text-xs outline-none"><option value="latest">最新</option><option value="highest">最高評分</option><option value="lowest">最低評分</option></select></div>
        {gameReviews.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{gameReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : <div className="glass rounded-xl p-8 text-center text-sm text-[#81848f]">目前還沒有玩家評測。<br /><span className="mt-2 inline-block">成為第一個分享遊戲心得的玩家吧！</span></div>}
      </section>
    </main>
  </div>
}

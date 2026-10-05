import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProfile, type PublicProfile } from '../api/profileApi'
import '../App.css'

function ProfilePage() {
  const { profileId } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) {
    return <main className="page-width py-16 text-center text-[#a8acb6]">載入中...</main>
  }

  if (error || !profile) {
    return (
      <main className="page-width py-16">
        <div className="glass max-w-xl rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-[#f5f3ed]">玩家資料不存在</p>
          <p className="mt-3 text-sm text-[#a8acb6]">{error || '此頁面目前不可用。'}</p>
          <Link to="/" className="mt-6 inline-block text-sm text-[#f2c544]">返回首頁</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-width py-10">
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
                <p>尚未公開評測</p>
                <p>收藏清單正在整理中</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage

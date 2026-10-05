import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { updateMyProfile } from '../api/profileApi'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function ProfileEditPage() {
  const navigate = useNavigate()
  const { profile, accessToken, setSession, isAuthenticated } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) {
      return
    }

    setDisplayName(profile.displayName)
    setBio(profile.bio ?? '')
    setAvatarUrl(profile.avatarUrl ?? '')
    setBannerUrl(profile.bannerUrl ?? '')
  }, [profile])

  if (!isAuthenticated) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || !accessToken) {
      setError('尚未登入，請重新登入後再試。')
      return
    }

    setLoading(true)
    setError('')

    try {
      const nextProfile = await updateMyProfile(accessToken, {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
      })

      setSession({
        user: { id: profile.accountUserId, username: profile.displayName },
        profile: nextProfile,
        accessToken,
      })
      navigate(`/profile/${nextProfile.id}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '更新失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-width py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-[#9aa0ad] hover:text-[#f2c544]">
          <ArrowLeft size={14} /> 返回首頁
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-3xl border border-white/[.07] bg-[#10151d] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-7">
          <p className="section-label mb-2">Profile</p>
          <h1 className="display-font text-3xl font-bold text-[#f5f3ed]">編輯個人資料</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">顯示名稱</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#151b23] px-3 py-3 text-sm text-white outline-none focus:border-[#f2c544]/60" maxLength={50} />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">自我介紹</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={5} className="w-full rounded-xl border border-white/[.08] bg-[#151b23] px-3 py-3 text-sm text-white outline-none focus:border-[#f2c544]/60" maxLength={500} />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">頭像網址</span>
            <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#151b23] px-3 py-3 text-sm text-white outline-none focus:border-[#f2c544]/60" placeholder="https://..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">Banner 網址</span>
            <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#151b23] px-3 py-3 text-sm text-white outline-none focus:border-[#f2c544]/60" placeholder="https://..." />
          </label>
        </div>

        {error && <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/')} className="rounded-lg border border-white/[.08] px-4 py-2 text-sm text-[#dfe2ea]">取消</button>
          <button type="submit" disabled={loading} className="gold-button rounded-lg px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default ProfileEditPage

import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../App.css'
import { getMyProfile } from '../api/profileApi'
import { useAuth } from '../context/AuthContext'
import { login } from '../lib/authApi'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      const { user, accessToken } = await login(String(form.get('email')), String(form.get('password')))
      const profile = await getMyProfile(accessToken)
      setSession({ user, accessToken, profile })
      navigate('/')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <section className="login-card relative z-10 w-full max-w-[430px] rounded-2xl p-7 sm:p-9">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs text-[#9599a5] transition hover:text-[#f2c544]">
          <ArrowLeft size={14} /> 返回首頁
        </Link>
        <div className="mb-8">
          <Link to="/" className="display-font mb-6 flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2c544] text-sm text-[#10120f]">P</span>
            Play<span className="text-[#f2c544]">Log</span>
          </Link>
          <p className="section-label mb-2">Welcome back</p>
          <h1 className="display-font text-3xl font-bold text-[#f5f3ed]">登入 PlayLog</h1>
          <p className="mt-2 text-sm leading-6 text-[#898d99]">登入後繼續記錄你的遊戲旅程。</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">電子郵件</span>
            <span className="login-input flex items-center gap-3 rounded-lg px-3.5">
              <Mail size={17} className="text-[#777c89]" />
              <input name="email" required type="email" placeholder="you@example.com" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">密碼</span>
            <span className="login-input flex items-center gap-3 rounded-lg px-3.5">
              <LockKeyhole size={17} className="text-[#777c89]" />
              <input name="password" required minLength={8} type={showPassword ? 'text' : 'password'} placeholder="輸入你的密碼" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" />
              <button type="button" aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} className="text-[#777c89] hover:text-[#f2c544]" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-[#898d99]"><input type="checkbox" className="accent-[#f2c544]" />記住我</label>
            <button type="button" className="text-[#f2c544] hover:text-[#ffd85f]">忘記密碼？</button>
          </div>
          <button disabled={loading} type="submit" className="gold-button w-full rounded-lg py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">{loading ? '登入中...' : '登入'}</button>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-center text-xs text-red-300">{error}</p>}
          {registered && <p className="rounded-lg border border-[#f2c544]/20 bg-[#f2c544]/10 px-3 py-2 text-center text-xs text-[#f2c544]">帳號建立成功，請登入。</p>}
        </form>

        <p className="mt-8 text-center text-xs text-[#898d99]">還沒有 PlayLog 帳號？ <Link to="/register" className="font-semibold text-[#f2c544] hover:text-[#ffd85f]">立即註冊</Link></p>
      </section>
    </main>
  )
}

export default LoginPage

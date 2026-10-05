import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { register } from '../lib/authApi'

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username')).trim()
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    if (username.length < 3 || username.length > 50) {
      setError('使用者名稱長度必須介於 3 到 50 個字元')
      setLoading(false)
      return
    }
    try {
      await register(username, email, password)
      navigate('/login', { state: { registered: true } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '註冊失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
      <section className="login-card relative z-10 w-full max-w-[430px] rounded-2xl p-7 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-[#9599a5] transition hover:text-[#f2c544]"><ArrowLeft size={14} /> 返回首頁</Link>
        <div className="mb-7"><Link to="/" className="display-font mb-5 flex items-center gap-2 text-xl font-bold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2c544] text-sm text-[#10120f]">P</span>Play<span className="text-[#f2c544]">Log</span></Link><p className="section-label mb-2">Join the community</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">建立 PlayLog 帳號</h1><p className="mt-2 text-sm leading-6 text-[#898d99]">開始收藏遊戲，留下你的第一則評測。</p></div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">使用者名稱</span><span className="login-input flex items-center gap-3 rounded-lg px-3.5"><UserRound size={17} className="text-[#777c89]" /><input name="username" required minLength={3} maxLength={50} placeholder="你的玩家名稱" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /></span></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">電子郵件</span><span className="login-input flex items-center gap-3 rounded-lg px-3.5"><Mail size={17} className="text-[#777c89]" /><input name="email" required type="email" placeholder="you@example.com" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /></span></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">密碼</span><span className="login-input flex items-center gap-3 rounded-lg px-3.5"><LockKeyhole size={17} className="text-[#777c89]" /><input name="password" required minLength={8} maxLength={256} type={showPassword ? 'text' : 'password'} placeholder="至少 8 個字元" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /><button type="button" aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} className="text-[#777c89] hover:text-[#f2c544]" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <button disabled={loading} type="submit" className="gold-button w-full rounded-lg py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">{loading ? '建立中...' : '建立帳號'}</button>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-center text-xs text-red-300">{error}</p>}
        </form>
        <p className="mt-7 text-center text-xs text-[#898d99]">已經有帳號？ <Link to="/login" className="font-semibold text-[#f2c544] hover:text-[#ffd85f]">登入</Link></p>
      </section>
    </main>
  )
}

export default RegisterPage

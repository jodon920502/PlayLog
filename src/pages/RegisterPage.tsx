import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { register } from '../lib/authApi'
import { useDisplayNameAvailability } from '../hooks/useDisplayNameAvailability'
import SEO from '../components/seo/SEO'

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const nameCheck = useDisplayNameAvailability(username)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const submittedUsername = String(form.get('username'))
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    if (!nameCheck.isValidFormat) {
      setError(nameCheck.hasWhitespace ? '顯示名稱不可包含空白' : '顯示名稱長度必須介於 1 到 30 個字元')
      setLoading(false)
      return
    }
    if (nameCheck.isChecking || !nameCheck.isAvailable || username.toLocaleLowerCase() !== submittedUsername.toLocaleLowerCase()) {
      setError(nameCheck.isTaken ? '此玩家名稱已被使用' : '請先完成玩家名稱檢查')
      setLoading(false)
      return
    }
    try {
      await register(submittedUsername, email, password)
      navigate('/login', { state: { registered: true } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '註冊失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <><SEO title="建立帳號｜PlayLog" description="建立 PlayLog 帳號，加入遊戲評測與玩家社群。" indexable={false} /><main className="login-page flex min-h-screen items-center justify-center px-5 py-10">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
      <section className="login-card relative z-10 w-full max-w-[430px] rounded-2xl p-7 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-[#9599a5] transition hover:text-[#f2c544]"><ArrowLeft size={14} /> 返回首頁</Link>
        <div className="mb-7"><Link to="/" className="display-font mb-5 flex items-center gap-2 text-xl font-bold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2c544] text-sm text-[#10120f]">P</span>Play<span className="text-[#f2c544]">Log</span></Link><p className="section-label mb-2">Join the community</p><h1 className="display-font text-3xl font-bold text-[#f5f3ed]">建立 PlayLog 帳號</h1><p className="mt-2 text-sm leading-6 text-[#898d99]">開始收藏遊戲，留下你的第一則評測。</p></div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">玩家顯示名稱</span><span className={`login-input flex items-center gap-3 rounded-lg px-3.5 ${!nameCheck.isValidFormat || nameCheck.isTaken || nameCheck.hasError ? 'border-red-400/70' : nameCheck.isAvailable ? 'border-emerald-400/60' : ''}`}><UserRound size={17} className="text-[#777c89]" /><input name="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={1} maxLength={30} placeholder="你的玩家名稱" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /></span>{username && !nameCheck.isValidFormat && <p className="mt-1 text-xs text-red-300">{nameCheck.hasWhitespace ? '顯示名稱不可包含空白' : '顯示名稱長度必須介於 1 到 30 個字元'}</p>}{nameCheck.isChecking && <p className="mt-1 text-xs text-[#a5a7af]">正在檢查名稱...</p>}{nameCheck.isTaken && <p className="mt-1 text-xs text-red-300">此玩家名稱已被使用</p>}{nameCheck.hasError && <p className="mt-1 text-xs text-red-300">無法檢查玩家名稱，請稍後再試</p>}{nameCheck.isAvailable && <p className="mt-1 text-xs text-emerald-300">此名稱可以使用</p>}</label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">電子郵件</span><span className="login-input flex items-center gap-3 rounded-lg px-3.5"><Mail size={17} className="text-[#777c89]" /><input name="email" required type="email" placeholder="you@example.com" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /></span></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-[#c7c6c0]">密碼</span><span className="login-input flex items-center gap-3 rounded-lg px-3.5"><LockKeyhole size={17} className="text-[#777c89]" /><input name="password" required minLength={8} maxLength={256} type={showPassword ? 'text' : 'password'} placeholder="至少 8 個字元" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#5f6470]" /><button type="button" aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} className="text-[#777c89] hover:text-[#f2c544]" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <button disabled={loading || !nameCheck.isAvailable || nameCheck.isChecking} type="submit" className="gold-button w-full rounded-lg py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">{loading ? '建立中...' : '建立帳號'}</button>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-center text-xs text-red-300">{error}</p>}
        </form>
        <p className="mt-7 text-center text-xs text-[#898d99]">已經有帳號？ <Link to="/login" className="font-semibold text-[#f2c544] hover:text-[#ffd85f]">登入</Link></p>
      </section>
    </main></>
  )
}

export default RegisterPage

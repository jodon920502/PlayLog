import { Bell, ChevronDown, LogOut, Menu, PenLine, Search, User, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { searchGames } from '../../services/gameService'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const { user, profile, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = profile?.displayName ?? user?.username ?? '玩家'
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || 'P'

  useEffect(() => {
    setSearchQuery(location.pathname === '/search' ? searchParams.get('q') ?? '' : '')
    setSearchFocused(false)
    setHighlightedIndex(-1)
  }, [location.pathname, searchParams])

  const autocompleteResults = useMemo(
    () => searchQuery.trim() ? searchGames(searchQuery).slice(0, 5) : [],
    [searchQuery],
  )
  const showSearchDropdown = searchFocused && Boolean(searchQuery.trim())

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      setSearchFocused(false)
      setHighlightedIndex(-1)
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSearchInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchFocused(false)
      setHighlightedIndex(-1)
      return
    }

    if (event.key === 'ArrowDown' && autocompleteResults.length > 0) {
      event.preventDefault()
      setHighlightedIndex((current) => (current + 1) % autocompleteResults.length)
    }

    if (event.key === 'ArrowUp' && autocompleteResults.length > 0) {
      event.preventDefault()
      setHighlightedIndex((current) => current <= 0 ? autocompleteResults.length - 1 : current - 1)
    }

    if (event.key === 'Enter' && highlightedIndex >= 0 && autocompleteResults[highlightedIndex]) {
      event.preventDefault()
      navigateToGame(autocompleteResults[highlightedIndex].id)
    }
  }

  const navigateToGame = (gameId: string) => {
    setSearchFocused(false)
    setHighlightedIndex(-1)
    navigate(`/game/${gameId}`)
  }

  const navigateToSearchResults = () => {
    const query = searchQuery.trim()
    if (!query) return
    setSearchFocused(false)
    setHighlightedIndex(-1)
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/[.06] bg-[#0b0d13]/90 backdrop-blur-xl">
      <div className="page-width flex h-[72px] items-center justify-between gap-6">
        <Link to="/" className="display-font flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2c544] text-sm text-[#10120f]">P</span>
          Play<span className="text-[#f2c544]">Log</span>
        </Link>
        <nav className="desktop-nav flex items-center gap-5">
          <Link className="nav-link active" to="/">首頁</Link><Link className="nav-link" to="/">探索遊戲</Link>
          <Link className="nav-link" to="/">玩家評測</Link><Link className="nav-link" to="/">排行榜</Link><Link className="nav-link" to="/">我的收藏</Link>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/about">關於</NavLink>
        </nav>
        <div className="hidden items-center gap-4 sm:flex">
          <div ref={searchRef} className="relative w-44">
            <form onSubmit={handleSearch} className="flex w-full items-center gap-2 rounded-full border border-white/[.08] bg-[#151821] px-3 py-2 text-[#7e828e]">
              <input
                aria-activedescendant={highlightedIndex >= 0 ? `search-result-${autocompleteResults[highlightedIndex]?.id}` : undefined}
                aria-autocomplete="list"
                aria-controls="navbar-search-results"
                aria-expanded={showSearchDropdown}
                aria-label="搜尋遊戲或玩家"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setSearchFocused(Boolean(event.target.value.trim()))
                  setHighlightedIndex(-1)
                }}
                onFocus={() => {
                  setSearchFocused(Boolean(searchQuery.trim()))
                  setHighlightedIndex(-1)
                }}
                onKeyDown={handleSearchInputKeyDown}
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666a75]"
                placeholder="搜尋遊戲或玩家..."
              />
              <button type="submit" aria-label="搜尋"><Search size={16} /></button>
            </form>
            {showSearchDropdown && (
              <div id="navbar-search-results" role="listbox" className="absolute left-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto rounded-xl border border-white/[.08] bg-[#10151d] shadow-2xl shadow-black/40">
                {autocompleteResults.length > 0 ? (
                  <>
                    {autocompleteResults.map((game, index) => (
                      <button
                        id={`search-result-${game.id}`}
                        key={game.id}
                        type="button"
                        role="option"
                        aria-selected={highlightedIndex === index}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => navigateToGame(game.id)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${highlightedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <img src={game.cover} alt="" className="h-11 w-9 shrink-0 rounded object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-[#eeece5]">{game.name}</span>
                          <span className="mt-1 block truncate text-[10px] text-[#777b86]">{game.genre}</span>
                        </span>
                      </button>
                    ))}
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={navigateToSearchResults} className="w-full truncate border-t border-white/[.07] px-3 py-3 text-left text-[11px] text-[#f2c544] transition hover:bg-white/5">查看「{searchQuery.trim()}」的所有搜尋結果 →</button>
                  </>
                ) : (
                  <div className="p-3">
                    <p className="text-xs text-[#a5a7af]">找不到符合的遊戲</p>
                    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={navigateToSearchResults} className="mt-2 text-[11px] text-[#f2c544] hover:text-[#ffe38a]">搜尋「{searchQuery.trim()}」查看更多 →</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="text-[#a6a9b5] hover:text-white" aria-label="通知"><Bell size={19} /></button>
          {isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-white/5" />
          ) : isAuthenticated ? (
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen((current) => !current)} className="flex items-center gap-2 rounded-full border border-white/[.08] bg-[#121722] px-2 py-1.5 text-left text-sm text-[#ebe9e5] transition hover:border-[#f2c544]/40">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#242b39] ring-1 ring-[#f2c544]/40">
                  {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : <span className="text-xs font-semibold text-[#f2c544]">{avatarLetter}</span>}
                </span>
                <span className="max-w-[110px] truncate">{displayName}</span>
                <ChevronDown size={15} className="text-[#a5a8b3]" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 overflow-hidden rounded-xl border border-white/[.08] bg-[#10151d] shadow-2xl shadow-black/30">
                  <button onClick={() => { setProfileOpen(false); navigate(`/profile/${profile?.id ?? user?.id ?? ''}`) }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#ebedf1] transition hover:bg-white/5"><User size={15} className="text-[#f2c544]" />個人檔案</button>
                  <button onClick={() => { setProfileOpen(false); navigate('/profile/edit') }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#ebedf1] transition hover:bg-white/5"><PenLine size={15} className="text-[#f2c544]" />編輯個人檔案</button>
                  <div className="my-1 h-px bg-white/[.08]" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#ffb4a7] transition hover:bg-red-500/10"><LogOut size={15} />登出</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="nav-link" to="/login">登入</Link>
              <Link className="nav-link" to="/register">註冊</Link>
            </>
          )}
          <button className="gold-button hidden rounded-lg px-4 py-2 text-xs md:block"><PenLine size={14} className="mr-1.5 inline" />撰寫評測</button>
        </div>
        <button className="text-[#d9d7d0] sm:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="開啟選單">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <div className="border-t border-white/[.06] bg-[#10131b] p-5 sm:hidden"><nav className="flex flex-col gap-5 text-sm text-[#bfc1c8]">
        <Link to="/">首頁</Link><Link to="/">探索遊戲</Link><Link to="/">玩家評測</Link><Link to="/">排行榜</Link><Link to="/">我的收藏</Link><Link to="/about">關於</Link>
        {isAuthenticated ? (
          <>
            <button onClick={() => navigate(`/profile/${profile?.id ?? user?.id ?? ''}`)} className="text-left">個人檔案</button>
            <button onClick={() => navigate('/profile/edit')} className="text-left">編輯個人檔案</button>
            <button onClick={handleLogout} className="text-left text-[#ffb4a7]">登出</button>
          </>
        ) : (
          <Link className="text-[#f2c544]" to="/login">登入</Link>
        )}
      </nav></div>}
    </header>
  )
}

import { useEffect, useState } from 'react'
import { searchGames } from '../services/gameService'
import type { Game } from '../types/game'

interface UseGameAutocompleteResult {
  results: Game[]
  isLoading: boolean
  error: string | null
}

export function useGameAutocomplete(query: string): UseGameAutocompleteResult {
  const [results, setResults] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)
      void searchGames(normalizedQuery, controller.signal)
        .then((games) => setResults(games.slice(0, 5)))
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return
          setResults([])
          setError(requestError instanceof Error ? requestError.message : '搜尋服務暫時無法使用')
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, isLoading, error }
}

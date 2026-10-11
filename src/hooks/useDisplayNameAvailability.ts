import { useEffect, useState } from 'react'
import { checkDisplayNameAvailability } from '../api/profileApi'

function normalize(value: string): string {
  return value.toLocaleLowerCase()
}

export function useDisplayNameAvailability(value: string, options: { initialValue?: string; forCurrentUser?: boolean; minimumLength?: number } = {}) {
  const minimumLength = options.minimumLength ?? 1
  const normalizedValue = normalize(value)
  const normalizedInitial = normalize(options.initialValue ?? '')
  const hasWhitespace = /\s/u.test(value)
  const isUnchanged = Boolean(normalizedInitial) && !hasWhitespace && normalizedValue === normalizedInitial
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')

  useEffect(() => {
    const controller = new AbortController()
    const length = Array.from(value).length
    if (!normalizedValue || length < minimumLength || length > 30 || hasWhitespace) {
      setStatus('idle')
      return () => controller.abort()
    }
    if (isUnchanged) {
      setStatus('idle')
      return () => controller.abort()
    }

    setStatus('checking')
    const timeout = window.setTimeout(() => {
      void checkDisplayNameAvailability(value, options.forCurrentUser, controller.signal)
        .then((available) => setStatus(available ? 'available' : 'taken'))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setStatus('error')
        })
    }, 400)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [value, minimumLength, normalizedValue, normalizedInitial, isUnchanged, hasWhitespace, options.forCurrentUser])

  return {
    status,
    isChecking: status === 'checking',
    isAvailable: status === 'available',
    isTaken: status === 'taken',
    hasError: status === 'error',
    isValidFormat: Boolean(normalizedValue) && Array.from(value).length >= minimumLength && Array.from(value).length <= 30 && !hasWhitespace,
    hasWhitespace,
    isUnchanged,
  }
}

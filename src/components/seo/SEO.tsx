import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title: string
  description: string
  indexable?: boolean
  image?: string | null
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '')

function setMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export default function SEO({ title, description, indexable = true, image = null }: SEOProps) {
  const location = useLocation()

  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', indexable ? 'index, follow' : 'noindex, nofollow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'PlayLog')
    setMeta('property', 'og:url', SITE_URL ? `${SITE_URL}${location.pathname}` : null)
    setMeta('property', 'og:image', image)

    const canonicalHref = SITE_URL ? `${SITE_URL}${location.pathname}` : null
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonicalHref) {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = canonicalHref
    } else {
      canonical?.remove()
    }

    return () => {
      setMeta('name', 'description', null)
      setMeta('name', 'robots', null)
      setMeta('property', 'og:title', null)
      setMeta('property', 'og:description', null)
      setMeta('property', 'og:type', null)
      setMeta('property', 'og:site_name', null)
      setMeta('property', 'og:url', null)
      setMeta('property', 'og:image', null)
      canonical?.remove()
    }
  }, [description, image, indexable, location.pathname, title])

  return null
}

import { useEffect } from 'react'

const SITE_NAME = 'Guide to AI'

/** Updates document title (and meta description) on client-side navigation.
 *  Crawlers get the same values from the prerendered HTML (scripts/prerender.mjs). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }
  }, [title, description])
}

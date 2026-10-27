import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

interface RSSItem {
  title: string
  link: string
  pubDate?: string
  source?: string
}

/** RSS is fetched at build time by scripts/fetch-rss.mjs into public/data/rss.json (GitHub Pages has no server). */
export default function RSSFeed() {
  const { t } = useI18n()
  const [items, setItems] = useState<RSSItem[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/rss.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RSSItem[]) => setItems(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setItems([]))
  }, [])

  if (!items.length) return null

  return (
    <section className="border border-hairline bg-surface-raised p-6">
      <h2 className="label flex items-center gap-2 text-ink-muted">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping bg-ink opacity-50 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 bg-ink" />
        </span>
        {t('rssTitle')}
      </h2>
      {/* The headlines are English publisher copy whatever the page language. */}
      <ul className="mt-4 space-y-2" dir="ltr">
        {items.map((item) => (
          <li key={item.link} className="text-sm">
            <a href={item.link} target="_blank" rel="noreferrer" className="font-medium text-ink transition-colors duration-150 hover:text-ink">
              {item.title}
            </a>
            <span className="ms-2 whitespace-nowrap text-xs text-ink-muted">
              {[item.source, item.pubDate && new Date(item.pubDate).toLocaleDateString()].filter(Boolean).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

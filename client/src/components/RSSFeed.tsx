import { useEffect, useState } from 'react'

interface RSSItem {
  title: string
  link: string
  pubDate?: string
}

/** RSS is fetched at build time by scripts/fetch-rss.mjs into public/data/rss.json (GitHub Pages has no server). */
export default function RSSFeed() {
  const [items, setItems] = useState<RSSItem[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/rss.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RSSItem[]) => setItems(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setItems([]))
  }, [])

  if (!items.length) return null

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" dir="ltr">
      <h2 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wide text-stone-700">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-600 opacity-50 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-700" />
        </span>
        AI News Feed
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.link} className="text-sm">
            <a href={item.link} target="_blank" rel="noreferrer" className="font-medium text-stone-800 transition-colors duration-150 hover:text-orange-800">
              {item.title}
            </a>
            {item.pubDate && (
              <span className="ms-2 text-xs text-stone-400">{new Date(item.pubDate).toLocaleDateString()}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

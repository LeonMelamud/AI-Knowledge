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
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6" dir="ltr">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">AI News Feed</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.link} className="text-sm">
            <a href={item.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">
              {item.title}
            </a>
            {item.pubDate && (
              <span className="ms-2 text-xs text-slate-400">{new Date(item.pubDate).toLocaleDateString()}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

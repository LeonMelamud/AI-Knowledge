// Fetches the AI news RSS feed at build time into public/data/rss.json.
// GitHub Pages has no server, so the app reads this static snapshot instead of proxying.
// Never fails the build: on any error it writes [] and exits 0.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FEED_URL = 'https://www.nasdaq.com/feed/rssoutbound?category=Artificial+Intelligence'
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const OUT_FILE = path.join(OUT_DIR, 'rss.json')

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }

function decodeEntities(text) {
  // feeds often double-encode (&amp;quot;) — decode until stable
  let prev
  do {
    prev = text
    text = text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ENTITIES[name])
  } while (text !== prev)
  return text
}

function textBetween(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  if (!match) return ''
  return decodeEntities(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim())
}

let items = []
try {
  const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  // ponytail: regex XML parsing for one known well-formed feed; swap in fast-xml-parser if more feeds appear
  items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => ({
      title: textBetween(item, 'title'),
      link: textBetween(item, 'link'),
      pubDate: textBetween(item, 'pubDate'),
    }))
    .filter((item) => item.title && item.link)
    .slice(0, 20)
  console.log(`fetch-rss: got ${items.length} items`)
} catch (err) {
  console.warn(`fetch-rss: failed (${err.message}), writing empty feed`)
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(items, null, 2))

// Fetches AI news RSS/Atom feeds at build time into public/data/rss.json.
// GitHub Pages has no server, so the app reads this static snapshot instead of proxying.
// The Pages workflow rebuilds daily (static.yml cron), so the snapshot stays current.
// Never fails the build: a dead feed is skipped, a total failure writes [] and exits 0.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { XMLParser } from 'fast-xml-parser'

// Publisher feeds that actually cover AI as a subject. `max` caps each source so
// a high-volume publisher can't crowd the others out of the 8 slots the widget shows.
const FEEDS = [
  { source: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', max: 3 },
  { source: 'Ars Technica', url: 'https://arstechnica.com/ai/feed/', max: 3 },
  { source: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', max: 3 },
  { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', max: 2 },
  { source: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/', max: 2 },
]

const MAX_AGE_DAYS = 30 // a feed that stops publishing drops off instead of going stale on the page
const MAX_ITEMS = 20
const TIMEOUT_MS = 20000

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const OUT_FILE = path.join(OUT_DIR, 'rss.json')

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false, // keep titles and dates as strings
  trimValues: true,
})

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text) {
  // feeds often double-encode (&amp;quot;) — decode until stable.
  // Numeric refs matter here: WordPress feeds emit curly quotes as &#8216;/&#8217;.
  let prev
  do {
    prev = text
    text = text.replace(/&(?:(amp|lt|gt|quot|apos|nbsp)|#(\d+)|#x([0-9a-fA-F]+));/g, (match, name, dec, hex) => {
      if (name) return ENTITIES[name]
      const code = Number.parseInt(dec ?? hex, dec ? 10 : 16)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    })
  } while (text !== prev)
  return text
}

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value])

/** Tag bodies come back as a string, or as an object when the tag carried attributes. */
function textOf(value) {
  if (typeof value === 'string') return decodeEntities(value).trim()
  if (value && typeof value === 'object' && typeof value['#text'] === 'string') {
    return decodeEntities(value['#text']).trim()
  }
  return ''
}

/** RSS puts the URL in the <link> body; Atom puts it in a href attribute. */
function linkOf(link) {
  const candidates = asArray(link)
  const alternate = candidates.find((c) => c?.['@_rel'] === 'alternate' || (c && typeof c === 'object' && !c['@_rel']))
  const chosen = alternate ?? candidates[0]
  if (typeof chosen === 'string') return decodeEntities(chosen).trim()
  return typeof chosen?.['@_href'] === 'string' ? decodeEntities(chosen['@_href']).trim() : ''
}

function parseFeed(xml, source) {
  const doc = parser.parse(xml)
  const entries = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? doc?.['rdf:RDF']?.item
  return asArray(entries)
    .map((entry) => ({
      title: textOf(entry.title),
      link: linkOf(entry.link),
      pubDate: textOf(entry.pubDate ?? entry.published ?? entry.updated ?? entry['dc:date']),
      source,
    }))
    .filter((item) => item.title && item.link)
}

async function fetchFeed({ url, source, max }) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'ai-know.org RSS snapshot (+https://ai-know.org)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseFeed(await res.text(), source).slice(0, max)
}

const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
const timeOf = (item) => {
  const parsed = Date.parse(item.pubDate) // handles both RFC-822 (RSS) and ISO-8601 (Atom)
  return Number.isNaN(parsed) ? 0 : parsed
}

const settled = await Promise.allSettled(FEEDS.map(fetchFeed))

const seen = new Set()
const items = settled
  .flatMap((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`fetch-rss: ${FEEDS[i].source} -> ${result.value.length} items`)
      return result.value
    }
    console.warn(`fetch-rss: ${FEEDS[i].source} failed (${result.reason?.message ?? result.reason})`)
    return []
  })
  .filter((item) => timeOf(item) >= cutoff)
  .filter((item) => !seen.has(item.link) && seen.add(item.link))
  .sort((a, b) => timeOf(b) - timeOf(a))
  .slice(0, MAX_ITEMS)

if (!items.length) console.warn('fetch-rss: no items from any feed, writing empty feed')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(items, null, 2))

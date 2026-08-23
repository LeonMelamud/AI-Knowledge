// Fetches AI news RSS/Atom feeds at build time into public/data/rss.json.
// GitHub Pages has no server, so the app reads this static snapshot instead of proxying.
// The Pages workflow rebuilds daily (static.yml cron), so the snapshot stays current.
// Never fails the build: a dead feed is skipped, a total failure writes [] and exits 0.
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { XMLParser } from 'fast-xml-parser'

// Publisher feeds that actually cover AI as a subject. `max` caps each source so
// a high-volume publisher can't crowd the others out of the 8 slots the widget shows.
const FEEDS = [
  { source: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', max: 3 },
  { source: 'The Guardian', url: 'https://www.theguardian.com/technology/artificialintelligenceai/rss', max: 3 },
  { source: 'Ars Technica', url: 'https://arstechnica.com/ai/feed/', max: 3 },
  { source: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', max: 3 },
  { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', max: 2 },
  { source: 'The Register', url: 'https://www.theregister.com/software/ai_ml/headlines.atom', max: 2 },
  { source: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/', max: 2 },
]

const MAX_AGE_DAYS = 30 // a feed that stops publishing drops off instead of going stale on the page
const MAX_ITEMS = 20
const TIMEOUT_MS = 20000

// Health thresholds. Losing a source or two is normal (publishers rate-limit, CDNs hiccup);
// losing three at once means something systemic — the last time that happened it was a
// user-agent the bot filters didn't like, and it went unnoticed because the build stayed green.
// Under --strict these exit non-zero; the Pages build runs without it so a feed outage can
// never block a content deploy. See .github/workflows/feed-health.yml.
const MIN_HEALTHY_SOURCES = 5
const MAX_NEWEST_AGE_HOURS = 72 // every source here publishes at least weekly
const STRICT = process.argv.includes('--strict')

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const OUT_FILE = path.join(OUT_DIR, 'rss.json')

const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
const timeOf = (item) => {
  const parsed = Date.parse(item.pubDate) // handles both RFC-822 (RSS) and ISO-8601 (Atom)
  return Number.isNaN(parsed) ? 0 : parsed
}

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
  // Browser UA is load-bearing: with a custom "ai-know.org RSS snapshot" UA, TechCrunch
  // returned "fetch failed" from GitHub's runners while working fine from a laptop.
  // Publisher bot filters score UA and datacenter IP together — don't self-identify here.
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  // Sort before capping: newest-first is only a convention, and `max` silently keeps
  // whatever happens to be at the top of the document.
  return parseFeed(await res.text(), source)
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, max)
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

// --- health ---------------------------------------------------------------
// Write the snapshot first: even a degraded one beats none, and --strict must not
// cost the site its feed on the way out.

// Health is measured on what SHIPPED, not on what fetched. A feed can return 200 with
// items that are all months old — it contributes nothing to the page while looking fine
// at the fetch layer. That gap is precisely how the old Nasdaq source stayed unnoticed.
const shipped = new Set(items.map((item) => item.source))
const healthyCount = shipped.size
const missingSources = FEEDS.map(({ source }, i) => {
  if (shipped.has(source)) return null
  const result = settled[i]
  if (result.status === 'rejected') return `${source} (fetch failed)`
  if (!result.value.length) return `${source} (empty feed)`
  const hasRecent = result.value.some((item) => timeOf(item) >= cutoff)
  return `${source} (${hasRecent ? 'items excluded from snapshot' : `nothing newer than ${MAX_AGE_DAYS}d`})`
}).filter(Boolean)
const newestAgeHours = items.length ? (Date.now() - timeOf(items[0])) / 3_600_000 : Infinity

const problems = []
if (healthyCount < MIN_HEALTHY_SOURCES) {
  problems.push(
    `only ${healthyCount}/${FEEDS.length} sources reached the snapshot (need ${MIN_HEALTHY_SOURCES}); missing: ${missingSources.join(', ')}`,
  )
}
if (newestAgeHours > MAX_NEWEST_AGE_HOURS) {
  const age = Number.isFinite(newestAgeHours) ? `${Math.round(newestAgeHours)}h old` : 'no items at all'
  problems.push(`newest item is ${age} (expected under ${MAX_NEWEST_AGE_HOURS}h) — feeds may be reachable but stale`)
}

const summary = `fetch-rss: ${items.length} items, ${healthyCount}/${FEEDS.length} sources in snapshot${
  missingSources.length ? ` (missing: ${missingSources.join(', ')})` : ''
}`
console.log(summary)

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [`**${summary}**`, ...problems.map((p) => `- :warning: ${p}`)]
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

for (const problem of problems) {
  // ::error:: annotates the run in the Actions UI even when the step exits 0
  console.log(`::error title=RSS feed health::${problem}`)
}

if (problems.length && STRICT) process.exit(1)

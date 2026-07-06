// Fetches each news topic's story image automatically at build time:
// takes the topic's source links from news_en.yaml (HE shares the same URLs),
// scrapes the page's og:image / twitter:image, and downloads it into
// public/images/news-auto/. Writes public/data/news-images.json mapping
// link URL -> local file name; HotNews.tsx falls back to the static category
// photo when a story has no image here. Like fetch-rss.mjs, this must NEVER
// fail the build — any error just means fewer images.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { load } from 'js-yaml'

const CLIENT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMG_DIR = path.join(CLIENT_DIR, 'public', 'images', 'news-auto')
const MANIFEST = path.join(CLIENT_DIR, 'public', 'data', 'news-images.json')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }

// Listing pages (site /news hubs) serve generic marketing cards as og:image,
// not story images — only article-looking URLs (deep path or a year) qualify.
function looksLikeArticle(url) {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    return segments.length >= 3 || /\b20\d{2}\b/.test(url)
  } catch {
    return false
  }
}

const get = (url, accept) =>
  fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'follow', signal: AbortSignal.timeout(12000) })

function extractImage(html, pageUrl) {
  const meta =
    html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i) ??
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (!meta) return null
  try {
    return new URL(meta[1].replace(/&amp;/g, '&'), pageUrl).href
  } catch {
    return null
  }
}

async function storyImage(linkUrl) {
  const page = await get(linkUrl, 'text/html')
  if (!page.ok) return null
  const imgUrl = extractImage(await page.text(), page.url)
  if (!imgUrl) return null

  const res = await get(imgUrl, 'image/*')
  const ext = EXT[res.headers.get('content-type')?.split(';')[0]]
  if (!res.ok || !ext) return null
  const bytes = Buffer.from(await res.arrayBuffer())
  // tracking pixels / placeholders are tiny; anything huge isn't worth shipping
  if (bytes.length < 5_000 || bytes.length > 5_000_000) return null

  const name = createHash('sha1').update(linkUrl).digest('hex').slice(0, 12) + ext
  writeFileSync(path.join(IMG_DIR, name), bytes)
  return name
}

mkdirSync(IMG_DIR, { recursive: true })
for (const stale of readdirSync(IMG_DIR)) unlinkSync(path.join(IMG_DIR, stale))
const manifest = {}
try {
  const news = load(readFileSync(path.join(CLIENT_DIR, 'data', 'news_en.yaml'), 'utf8')).hot_news ?? []
  for (const section of news) {
    for (const topic of section.topics ?? []) {
      for (const link of (topic.links ?? []).filter((l) => looksLikeArticle(l.url))) {
        if (manifest[link.url] !== undefined) break
        try {
          const name = await storyImage(link.url)
          if (name) {
            manifest[link.url] = name
            break // first link with an image wins
          }
        } catch {
          // unreachable/slow source — try the next link or move on
        }
      }
    }
  }
} catch (err) {
  console.error('fetch-news-images: giving up –', err.message)
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
console.log(`fetch-news-images: ${Object.keys(manifest).length} story images`)

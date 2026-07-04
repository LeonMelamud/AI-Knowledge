// Postbuild: copies dist/index.html to dist/<route>/index.html with per-route
// title/description/OG/canonical, writes dist/404.html and dist/sitemap.xml.
// Social scrapers don't run JS, so every shared link needs real HTML with its own tags.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'js-yaml'

const CLIENT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(CLIENT_DIR, 'dist')
const DATA_DIR = path.join(CLIENT_DIR, '..', 'public', 'data')
const BASE_URL = 'https://leonmelamud.github.io/AI-Knowledge/'
const SITE_NAME = 'Guide to AI'

const concepts = load(readFileSync(path.join(DATA_DIR, 'concepts_en.yaml'), 'utf8')).concepts
const tools = load(readFileSync(path.join(DATA_DIR, 'links_en.yaml'), 'utf8')).tools

const names = (items, n) => items.slice(0, n).map((item) => item.name).join(', ')

const routes = [
  ...concepts.map((s) => ({
    path: s.id,
    title: s.title,
    description: `${s.title} — AI concepts explained: ${names(s.items, 5)}.`,
  })),
  ...tools.map((s) => ({
    path: s.id,
    title: s.title,
    description: `${s.title} — curated AI tools and resources: ${names(s.items, 6)}.`,
  })),
  { path: 'hot-news', title: 'Hot News', description: 'Latest advancements and updates in AI technology.' },
  { path: 'calculator', title: 'Token Calculator', description: 'Count LLM tokens for any text, right in your browser.' },
  { path: 'text-generation', title: 'Text Generation', description: 'Generate text with OpenAI models using your own API key.' },
  { path: 'privacy-policy', title: 'Privacy Policy', description: 'Privacy policy of the Guide to AI knowledge base.' },
  { path: 'terms-of-service', title: 'Terms of Service', description: 'Terms of service of the Guide to AI knowledge base.' },
]

const shell = readFileSync(path.join(DIST, 'index.html'), 'utf8')
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

for (const route of routes) {
  const url = `${BASE_URL}${route.path}/`
  const title = escapeHtml(`${route.title} | ${SITE_NAME}`)
  const description = escapeHtml(route.description)
  const html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  mkdirSync(path.join(DIST, route.path), { recursive: true })
  writeFileSync(path.join(DIST, route.path, 'index.html'), html)
}

// Unknown paths on GitHub Pages fall back to 404.html → boot the SPA shell
writeFileSync(path.join(DIST, '404.html'), shell)

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', ...routes.map((r) => `${r.path}/`)]
  .map((p) => `  <url><loc>${BASE_URL}${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`
writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)

console.log(`prerender: ${routes.length} routes, 404.html, sitemap.xml`)

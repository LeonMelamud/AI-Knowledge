// Postbuild step 1: turn the SPA shell into real HTML for everything that does
// not run JavaScript — social scrapers, search crawlers and AI agents. Each
// route gets its own title/description/OG/canonical, its own JSON-LD, and the
// page's actual content written inside #root (the app replaces it on load, so
// browsers see no difference). Also writes 404.html and sitemap.xml.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import {
  DIST,
  BASE_URL,
  SITE_NAME,
  allRoutes,
  routes,
  escapeHtml,
  jsonLdFor,
  siteChrome,
  concepts,
  tools,
} from './lib/content.mjs'

const ROOT_DIV = '<div id="root"></div>'
const shell = readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (!shell.includes(ROOT_DIV)) {
  throw new Error(`prerender: ${ROOT_DIV} not found in dist/index.html — cannot inject content`)
}

const PRERENDER_NOTE =
  '<!-- Static content for clients that do not run JavaScript (crawlers, AI agents, ' +
  'no-JS browsers). The React app replaces it on load. -->'

function render(route) {
  const url = `${BASE_URL}${route.path ? `${route.path}/` : ''}`
  const mdUrl = `${BASE_URL}${route.path ? `${route.path}.md` : 'index.md'}`
  const title = escapeHtml(route.titleIsFull ? route.title : `${route.title} | ${SITE_NAME}`)
  const description = escapeHtml(route.description)
  const head = `<link rel="alternate" type="text/markdown" href="${mdUrl}" title="Markdown version of this page" />
    <link rel="alternate" type="text/plain" href="${BASE_URL}llms.txt" title="llms.txt site index" />
    <script type="application/ld+json">
${JSON.stringify(jsonLdFor(route), null, 2)}
    </script>
  `
  const chrome = siteChrome(route.path)
  const body = `<div id="root">${PRERENDER_NOTE}<div lang="en" dir="ltr">
    ${chrome.header}
    <main>
    ${route.body}
    </main>
    ${chrome.nav}
    ${chrome.footer}
  </div></div>`

  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${BASE_URL}${route.image}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${BASE_URL}${route.image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace('</head>', `${head}</head>`)
    .replace(ROOT_DIV, body)
}

for (const route of allRoutes) {
  const html = render(route)
  if (route.path) {
    mkdirSync(path.join(DIST, route.path), { recursive: true })
    writeFileSync(path.join(DIST, route.path, 'index.html'), html)
  } else {
    writeFileSync(path.join(DIST, 'index.html'), html)
  }
}

// GitHub Pages serves 404.html with a real 404 status for unknown paths. It has
// to boot the SPA (deep links depend on it) but it can still say what happened
// and where to go instead — an agent that lands here gets a usable index rather
// than a silent redirect to /ai-basics.
const notFound = render({
  path: '404',
  title: 'Page not found (404)',
  description: `The requested page does not exist on ${SITE_NAME}. Browse the AI concept and tool sections, or use the site index.`,
  image: 'og-image.png',
  kind: 'page',
  body: `<h1>Page not found (404)</h1>
    <p>The URL you requested does not exist on ${SITE_NAME} (ai-know.org). Nothing was moved: this address was probably mistyped, or it comes from a very old version of the site that used hash routes such as <code>/#/hot-news</code>.</p>
    <p>Everything the site publishes is listed below and in the machine-readable indexes.</p>
    <h2>AI concepts</h2>
    <ul>
      ${concepts.map((s) => `<li><a href="/${s.id}/">${escapeHtml(s.title)}</a></li>`).join('\n      ')}
    </ul>
    <h2>AI tools and resources</h2>
    <ul>
      ${tools.map((s) => `<li><a href="/${s.id}/">${escapeHtml(s.title)}</a></li>`).join('\n      ')}
    </ul>
    <h2>Other pages</h2>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/hot-news/">Hot News</a> — daily AI news digest</li>
      <li><a href="/calculator/">Token Calculator</a></li>
      <li><a href="/about/">About</a> · <a href="/contact/">Contact</a></li>
    </ul>
    <h2>Machine-readable indexes</h2>
    <ul>
      <li><a href="/llms.txt">/llms.txt</a> — index for LLMs, <a href="/llms-full.txt">/llms-full.txt</a> for the full text</li>
      <li><a href="/sitemap.xml">/sitemap.xml</a> — every page</li>
      <li><a href="/.well-known/ai-catalog.json">/.well-known/ai-catalog.json</a> — capability catalog</li>
    </ul>
    <h2>Recovery block</h2>
    <pre>${[
      '# 404 — no such page on ai-know.org',
      '',
      'The status is a real 404: this path does not exist. Recover from one of these.',
      '',
      `- [Site index for LLMs](${BASE_URL}llms.txt)`,
      `- [Whole knowledge base, one document](${BASE_URL}llms-full.txt)`,
      `- [Sitemap, every canonical URL](${BASE_URL}sitemap.xml)`,
      `- [Capability catalog](${BASE_URL}.well-known/ai-catalog.json)`,
      `- [Home](${BASE_URL})`,
      '',
      '## Sections',
      '',
      ...[...concepts, ...tools].map((s) => `- [${s.title}](${BASE_URL}${s.id}/) — markdown: ${BASE_URL}${s.id}.md`),
    ].join('\n')}</pre>`,
})
writeFileSync(path.join(DIST, '404.html'), notFound)

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', ...routes.map((r) => `${r.path}/`)]
  .map((p) => `  <url><loc>${BASE_URL}${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`
writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)

console.log(`prerender: ${allRoutes.length} routes with content + JSON-LD, 404.html, sitemap.xml`)

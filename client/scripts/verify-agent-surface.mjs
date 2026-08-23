// Checks dist/ the way a crawler or an agent-readiness scanner does, so a
// pipeline change cannot quietly ship a page with no text or a catalog whose
// digests no longer match the files. Run after `npm run build`:
//   node scripts/verify-agent-surface.mjs   (or: npm run verify:agents)
// Exits non-zero on the first class of failure a scanner would penalise.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { DIST, BASE_URL } from './lib/content.mjs'

const DOMAIN = new URL(BASE_URL).hostname
let fail = 0
const bad = (msg) => {
  console.log(`  FAIL  ${msg}`)
  fail++
}

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error(`no build found at ${DIST} — run \`npm run build\` first`)
  process.exit(1)
}

const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const pages = ['index.html', '404.html', ...readdirSync(DIST, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(path.join(DIST, e.name, 'index.html')))
  .map((e) => `${e.name}/index.html`)]

console.log(`\n== HTML pages (${pages.length}) ==`)
for (const rel of pages) {
  const html = readFileSync(path.join(DIST, rel), 'utf8')
  const text = textOf(html)
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  const types = []
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw)
      for (const node of parsed['@graph'] ?? [parsed]) types.push(node['@type'])
    } catch (e) {
      bad(`${rel}: JSON-LD does not parse — ${e.message}`)
    }
  }
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? ''
  // A page under 500 chars of text is what scored the site 35/100: the shell
  // shipped without content because the app renders client-side.
  if (text.length < 500) bad(`${rel}: only ${text.length} chars of body text`)
  if (!h1) bad(`${rel}: no <h1>`)
  if (!html.includes('rel="alternate" type="text/markdown"')) bad(`${rel}: no markdown alternate link`)
  if (!desc) bad(`${rel}: no meta description`)
  if (!canonical) bad(`${rel}: no canonical`)
  if (!title.trim()) bad(`${rel}: empty title`)
  console.log(
    `  ${rel.padEnd(30)} text=${String(text.length).padStart(5)}  h1="${(h1?.[1] ?? '').slice(0, 34)}"  ld=[${types.join(',')}]`,
  )
}

console.log('\n== markdown twins ==')
const slugs = pages.filter((p) => p.includes('/')).map((p) => p.split('/')[0])
for (const slug of ['index', ...slugs]) {
  const rel = slug === 'index' ? 'index.md' : `${slug}.md`
  // Both spellings must resolve: agents guess either, and GitHub Pages cannot
  // rewrite one to the other.
  for (const f of [rel, slug === 'index' ? null : `${slug}/index.md`, slug === 'index' ? null : `${slug}/llms.txt`].filter(Boolean)) {
    if (!existsSync(path.join(DIST, f))) bad(`missing ${f}`)
  }
  const body = existsSync(path.join(DIST, rel)) ? readFileSync(path.join(DIST, rel), 'utf8') : ''
  const end = body.indexOf('\n---\n')
  if (!(body.startsWith('---\n') && end > 0)) {
    bad(`${rel}: no YAML frontmatter block`)
    continue
  }
  for (const key of ['title:', 'description:', 'canonical:', 'last-updated:']) {
    if (!body.slice(0, end).includes(key)) bad(`${rel}: frontmatter missing ${key}`)
  }
  if (!body.slice(end + 5).trimStart().startsWith('# ')) bad(`${rel}: body after frontmatter does not start with an H1`)
  if (body.length < 300) bad(`${rel}: only ${body.length} chars`)
}
console.log(`  ${slugs.length + 1} twins present, each with frontmatter and an H1`)

console.log('\n== AI catalog (ARD 1.0) conformance ==')
{
  const cat = JSON.parse(readFileSync(path.join(DIST, '.well-known/ai-catalog.json'), 'utf8'))
  if (cat.specVersion !== '1.0') bad(`ai-catalog specVersion is ${cat.specVersion}, expected 1.0`)
  if (cat.host?.identifier !== `did:web:${DOMAIN}`) bad(`host.identifier is ${cat.host?.identifier}`)
  const urn = new RegExp(`^urn:air:${DOMAIN.replace('.', '\\.')}:[a-z]+:[a-z0-9-]+$`)
  let trusted = 0
  for (const [i, e] of cat.entries.entries()) {
    if (!urn.test(e.identifier || '')) bad(`entry[${i}] identifier is not a domain-anchored urn:air: ${e.identifier}`)
    if (!e.displayName) bad(`entry[${i}] has no displayName`)
    if (!/^[a-z]+\/[a-zA-Z0-9.+-]+$/.test(e.type || '')) bad(`entry[${i}] type is not a media type: ${e.type}`)
    if (!!e.url === !!e.data) bad(`entry[${i}] must have exactly one of url/data`)
    if (e.trustManifest?.identity) trusted++
    if (e.trustManifest?.identity && e.trustManifest.identity !== e.identifier) {
      bad(`entry[${i}] trustManifest.identity does not match its identifier`)
    }
  }
  console.log(`  specVersion ${cat.specVersion}, host ${cat.host.identifier}, ${cat.entries.length} entries, ${trusted} with a trustManifest`)

  const did = JSON.parse(readFileSync(path.join(DIST, '.well-known/did.json'), 'utf8'))
  if (did.id !== `did:web:${DOMAIN}`) bad(`did.json id is ${did.id}`)

  // A provenance digest that no longer matches its file is worse than no digest.
  let checked = 0
  for (const e of cat.entries) {
    const digest = e.trustManifest?.provenance?.[0]?.sourceDigest
    if (!digest || !e.url?.startsWith(BASE_URL)) continue
    const rel = e.url.slice(BASE_URL.length)
    const p = path.join(DIST, rel)
    if (!existsSync(p)) {
      bad(`catalog entry points at a missing file: ${rel}`)
      continue
    }
    const actual = `sha256:${createHash('sha256').update(readFileSync(p)).digest('hex')}`
    if (actual !== digest) bad(`digest mismatch for ${rel}`)
    else checked++
  }
  console.log(`  ${checked} entry digests match the shipped files`)
}

console.log('\n== machine-readable files ==')
for (const f of ['.well-known/ai-catalog.json', '.well-known/agent-skills/index.json', '.well-known/api-catalog', 'openapi.json']) {
  const p = path.join(DIST, f)
  if (!existsSync(p)) {
    bad(`missing ${f}`)
    continue
  }
  try {
    console.log(`  ${f.padEnd(38)} ok  keys=${Object.keys(JSON.parse(readFileSync(p, 'utf8'))).join(',')}`)
  } catch (e) {
    bad(`${f}: ${e.message}`)
  }
}
for (const f of ['llms.txt', 'llms-full.txt', 'docs/llms.txt', 'api/llms.txt', 'auth.md', 'pricing.md',
                 'agent-instructions.md', 'sitemap.xml', 'schemamap.xml', 'robots.txt',
                 'skills/ai-know-lookup/SKILL.md', 'feeds/concepts.json', 'feeds/tools.json', 'feeds/pages.json']) {
  const p = path.join(DIST, f)
  if (!existsSync(p)) bad(`missing ${f}`)
  else console.log(`  ${f.padEnd(38)} ${readFileSync(p, 'utf8').length} bytes`)
}

console.log('\n== JSONL feeds ==')
for (const f of ['feeds/concepts.jsonl', 'feeds/tools.jsonl', 'feeds/pages.jsonl']) {
  const p = path.join(DIST, f)
  if (!existsSync(p)) {
    bad(`missing ${f}`)
    continue
  }
  const lines = readFileSync(p, 'utf8').trim().split('\n')
  let broken = 0
  for (const line of lines) {
    try {
      JSON.parse(line)
    } catch {
      broken++
    }
  }
  if (broken) bad(`${f}: ${broken} unparseable lines`)
  else console.log(`  ${f.padEnd(38)} ${lines.length} objects, all parse`)
}

console.log('\n== OpenAPI coverage ==')
{
  const oas = JSON.parse(readFileSync(path.join(DIST, 'openapi.json'), 'utf8'))
  const ops = Object.values(oas.paths).map((p) => p.get)
  const withJson = ops.filter((o) => o.responses['200']?.content?.['application/json']).length
  const typed = ops.filter((o) => {
    const s = o.responses['200']?.content?.['application/json']?.schema
    return s && (s.$ref || s.items?.$ref)
  }).length
  const pct = Math.round((withJson / ops.length) * 100)
  console.log(`  ${ops.length} operations, ${withJson} application/json (${pct}%), ${typed} with a $ref schema, ${Object.keys(oas.components.schemas).length} component schemas`)
  // Scanners want a majority of documented responses to be typed JSON.
  if (pct < 61) bad(`only ${pct}% of operations return application/json (target >60%)`)
}

console.log('\n== structure and annotations ==')
{
  const html = readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const landmarks = ['<header>', '<nav ', '<main>', '<footer>'].filter((t) => html.includes(t))
  console.log(`  landmarks on the prerendered homepage: ${landmarks.join(' ')} (${landmarks.length}/4)`)
  if (landmarks.length < 4) bad('prerendered homepage is missing landmarks')
  const h1s = (html.match(/<h1[ >]/g) || []).length
  if (h1s !== 1) bad(`prerendered homepage has ${h1s} h1 elements`)

  const index = JSON.parse(readFileSync(path.join(DIST, '.well-known/agent-skills/index.json'), 'utf8'))
  const actual = `sha256:${createHash('sha256').update(readFileSync(path.join(DIST, 'skills/ai-know-lookup/SKILL.md'))).digest('hex')}`
  if (index.skills[0].digest !== actual) bad(`skill digest mismatch: index says ${index.skills[0].digest}, file is ${actual}`)
  else console.log(`  skill digest ${actual.slice(0, 24)}… matches the index`)

  const robots = readFileSync(path.join(DIST, 'robots.txt'), 'utf8')
  for (const needle of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Content-Signal', 'schemamap:', 'Sitemap:']) {
    if (!robots.includes(needle)) bad(`robots.txt missing ${needle}`)
  }
  console.log(`  robots.txt: ${robots.split('\n').filter((l) => l.startsWith('User-agent')).length} User-agent lines, Content-Signal + schemamap present`)

  const bundles = readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js'))
  const entry = bundles.find((f) => readFileSync(path.join(DIST, 'assets', f), 'utf8').includes('modelContext'))
  if (!entry) bad('no bundle references navigator.modelContext (WebMCP tools lost?)')
  else console.log(`  WebMCP registration found in assets/${entry}`)
  if (!readFileSync(path.join(DIST, 'calculator/index.html'), 'utf8').includes('toolname="count_tokens"')) {
    bad('prerendered calculator form has no toolname annotation')
  } else console.log('  prerendered calculator form carries toolname/tooldescription')
}

console.log(fail ? `\n${fail} FAILURES\n` : '\nall checks passed\n')
process.exit(fail ? 1 : 0)

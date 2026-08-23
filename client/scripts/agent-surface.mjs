// Postbuild step 2: the machine-readable half of the site. Everything here is
// generated from the same YAML the pages render, so a markdown twin, a schema
// feed and a page can never disagree.
//
//   /<page>.md, /<page>/index.md   markdown twin of every page
//   /index.md, /llms-full.txt      homepage twin, whole knowledge base in one file
//   /<page>/llms.txt               per-section index (llms.txt spec, optional)
//   /feeds/*.jsonl                 schema.org JSON-LD, one object per line
//   /schemamap.xml                 NLWeb schema-feed map (linked from robots.txt)
//   /.well-known/ai-catalog.json   Agent Readiness capability catalog
//   /.well-known/agent-skills/index.json  agent-skills discovery index
//   /.well-known/api-catalog       RFC 9727 linkset for the JSON endpoints
//   /openapi.json                  OpenAPI 3.1 for the static GET endpoints
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import {
  DIST,
  BASE_URL,
  SITE_NAME,
  REPO_URL,
  AUTHOR,
  home,
  routes,
  allRoutes,
  concepts,
  tools,
  jsonLdFor,
  mdToText,
  truncate,
  stats,
} from './lib/content.mjs'

const write = (rel, body) => {
  const target = path.join(DIST, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, body)
}
const json = (rel, value) => write(rel, `${JSON.stringify(value, null, 2)}\n`)

// --- markdown twins --------------------------------------------------------
// Both /calculator.md and /calculator/index.md resolve, because agents guess
// either one from the page URL.
write('index.md', home.markdown)
for (const route of routes) {
  write(`${route.path}.md`, route.markdown)
  write(path.join(route.path, 'index.md'), route.markdown)
  write(path.join(route.path, 'llms.txt'), route.markdown)
}

write(
  'llms-full.txt',
  `${allRoutes.map((r) => r.markdown.trim()).join('\n\n---\n\n')}\n`,
)

// --- schema.org feeds ------------------------------------------------------
const jsonl = (objects) => `${objects.map((o) => JSON.stringify(o)).join('\n')}\n`

write(
  'feeds/concepts.jsonl',
  jsonl(
    concepts.flatMap((section) =>
      section.items.map((item) => ({
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': `${BASE_URL}${section.id}/#${encodeURIComponent(item.name)}`,
        name: item.name,
        description: truncate(mdToText(item.shortDescription || item.fullDescription || ''), 400),
        url: `${BASE_URL}${section.id}/`,
        inLanguage: 'en',
        inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': `${BASE_URL}${section.id}/#terms`, name: section.title },
      })),
    ),
  ),
)

write(
  'feeds/tools.jsonl',
  jsonl(
    tools.flatMap((section) =>
      section.items.map((item) => ({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: item.name,
        applicationCategory: 'AI tool',
        description: truncate(mdToText(item.description || ''), 400),
        ...(item.url ? { url: item.url } : {}),
        ...(item.company ? { publisher: { '@type': 'Organization', name: item.company } } : {}),
        isPartOf: { '@type': 'CollectionPage', '@id': `${BASE_URL}${section.id}/`, name: section.title },
      })),
    ),
  ),
)

write('feeds/pages.jsonl', jsonl(allRoutes.map((route) => jsonLdFor(route))))

const FEEDS = [
  { url: `${BASE_URL}feeds/concepts.jsonl`, label: `${stats.concepts} AI concepts as schema.org DefinedTerm` },
  { url: `${BASE_URL}feeds/tools.jsonl`, label: `${stats.tools} AI tools as schema.org SoftwareApplication` },
  { url: `${BASE_URL}feeds/pages.jsonl`, label: 'every page as a schema.org graph' },
]

// NLWeb schema map: robots.txt advertises it with a `schemamap:` directive.
write(
  'schemamap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:sf="http://schema.org/schemas/schemafeed/0.1">
${FEEDS.map(
  (feed) => `  <url>
    <loc>${feed.url}</loc>
    <sf:contentType>structuredData/schema.org</sf:contentType>
  </url>`,
).join('\n')}
</urlset>
`,
)

// --- /.well-known/ai-catalog.json -----------------------------------------
const catalogEntry = (identifier, displayName, type, url, description) => ({
  identifier,
  displayName,
  type,
  url,
  description,
})

json('.well-known/ai-catalog.json', {
  specVersion: '0.1',
  host: {
    displayName: SITE_NAME,
    identifier: 'ai-know.org',
    description: `Bilingual (English/Hebrew) AI knowledge base: ${stats.concepts} explained concepts, ${stats.tools} curated tools, a daily news digest and a browser-side token calculator. Static site, no authentication.`,
    url: BASE_URL,
    maintainer: AUTHOR,
    contact: `${BASE_URL}contact/`,
  },
  entries: [
    catalogEntry(
      'llms-txt',
      'llms.txt site index',
      'documentation',
      `${BASE_URL}llms.txt`,
      'Curated index of every section with one-line summaries. Start here.',
    ),
    catalogEntry(
      'llms-full-txt',
      'Full knowledge base (single document)',
      'documentation',
      `${BASE_URL}llms-full.txt`,
      'Every page of the knowledge base concatenated as markdown, for one-shot ingestion.',
    ),
    catalogEntry(
      'markdown-twins',
      'Markdown twin of any page',
      'documentation',
      `${BASE_URL}index.md`,
      'Append .md to any page path (for example /ai-basics.md) to get that page as markdown; /<page>/index.md and /<page>/llms.txt resolve to the same content.',
    ),
    catalogEntry(
      'concepts-feed',
      'AI concepts feed',
      'dataset',
      `${BASE_URL}feeds/concepts.jsonl`,
      `${stats.concepts} concepts as schema.org DefinedTerm objects, one JSON object per line.`,
    ),
    catalogEntry(
      'tools-feed',
      'AI tools feed',
      'dataset',
      `${BASE_URL}feeds/tools.jsonl`,
      `${stats.tools} curated tools as schema.org SoftwareApplication objects, one JSON object per line.`,
    ),
    catalogEntry(
      'news-snapshot',
      'AI news snapshot',
      'dataset',
      `${BASE_URL}data/rss.json`,
      'Raw publisher-feed snapshot behind the Hot News page, rebuilt daily.',
    ),
    catalogEntry(
      'openapi',
      'OpenAPI description of the read-only endpoints',
      'api',
      `${BASE_URL}openapi.json`,
      'OpenAPI 3.1 description of the static GET endpoints (feeds, snapshots, markdown twins). Read-only, no authentication, no write operations.',
    ),
    catalogEntry(
      'agent-skill',
      'Agent skill for looking things up here',
      'skill',
      `${BASE_URL}.well-known/agent-skills/index.json`,
      'Discovery index pointing at a SKILL.md that tells an agent how to search and cite this knowledge base.',
    ),
    catalogEntry(
      'schemamap',
      'Schema feed map',
      'dataset',
      `${BASE_URL}schemamap.xml`,
      'NLWeb-style map of the schema.org JSON-LD feeds published by this site.',
    ),
    catalogEntry(
      'sitemap',
      'Sitemap',
      'sitemap',
      `${BASE_URL}sitemap.xml`,
      'Every canonical page URL.',
    ),
    catalogEntry(
      'repository',
      'Source repository',
      'documentation',
      REPO_URL,
      'The content (YAML/JSON) and the build pipeline that produces this site. Corrections as issues or pull requests.',
    ),
  ],
})

// --- /.well-known/agent-skills/index.json ---------------------------------
// The SKILL.md itself ships from public/skills/ (Vite copies it); the digest is
// computed from what actually landed in dist, so it can never describe a stale file.
const SKILL_REL = 'skills/ai-know-lookup/SKILL.md'
const skillFile = path.join(DIST, SKILL_REL)
if (!existsSync(skillFile)) {
  throw new Error(`agent-surface: ${SKILL_REL} missing from dist — is it still in public/?`)
}
const digest = `sha256:${createHash('sha256').update(readFileSync(skillFile)).digest('hex')}`

json('.well-known/agent-skills/index.json', {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  name: 'ai-know.org',
  description: `Skills for using the ${SITE_NAME} knowledge base (ai-know.org).`,
  skills: [
    {
      name: 'ai-know-lookup',
      type: 'skill-md',
      description:
        'Look up an AI concept or tool on ai-know.org and cite it: which markdown twin, feed or index to fetch, and how the content is structured.',
      url: `${BASE_URL}${SKILL_REL}`,
      digest,
    },
  ],
})

// --- /.well-known/api-catalog (RFC 9727) + OpenAPI ------------------------
// Extensionless file: GitHub Pages will serve it as application/octet-stream
// rather than application/linkset+json. Published anyway — the document is
// correct and content type is the one thing static hosting cannot set.
json('.well-known/api-catalog', {
  linkset: [
    {
      anchor: `${BASE_URL}.well-known/api-catalog`,
      item: [{ href: `${BASE_URL}openapi.json`, type: 'application/vnd.oai.openapi+json' }],
    },
    {
      anchor: `${BASE_URL}openapi.json`,
      'service-desc': [{ href: `${BASE_URL}openapi.json`, type: 'application/vnd.oai.openapi+json' }],
      'service-doc': [{ href: `${BASE_URL}llms.txt`, type: 'text/plain' }],
      author: [{ href: `${BASE_URL}contact/` }],
      status: [{ href: `${BASE_URL}about/` }],
    },
  ],
})

const jsonResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { type: 'object' } } },
})

json('openapi.json', {
  openapi: '3.1.0',
  info: {
    title: `${SITE_NAME} read-only content endpoints`,
    version: '1.0.0',
    summary: 'Static JSON, JSONL and markdown representations of the ai-know.org knowledge base.',
    description:
      'ai-know.org is a static site. These are the files it publishes for programmatic use: every operation is an unauthenticated HTTP GET, there are no write operations, no rate limits and no API keys. Quoting is welcome; attribution to ai-know.org is appreciated.',
    contact: { name: AUTHOR, url: `${BASE_URL}contact/` },
  },
  servers: [{ url: BASE_URL.replace(/\/$/, ''), description: 'GitHub Pages, static hosting' }],
  paths: {
    '/llms.txt': {
      get: {
        operationId: 'getLlmsIndex',
        summary: 'Index of the knowledge base for LLMs',
        responses: {
          200: { description: 'llms.txt index', content: { 'text/plain': { schema: { type: 'string' } } } },
        },
      },
    },
    '/llms-full.txt': {
      get: {
        operationId: 'getLlmsFull',
        summary: 'The whole knowledge base as one markdown document',
        responses: {
          200: { description: 'Full text', content: { 'text/plain': { schema: { type: 'string' } } } },
        },
      },
    },
    '/{page}.md': {
      get: {
        operationId: 'getPageMarkdown',
        summary: 'Markdown twin of a page',
        parameters: [
          {
            name: 'page',
            in: 'path',
            required: true,
            description: 'Page path without the extension, for example ai-basics or calculator.',
            schema: { type: 'string', enum: routes.map((r) => r.path) },
          },
        ],
        responses: {
          200: { description: 'Page as markdown', content: { 'text/markdown': { schema: { type: 'string' } } } },
          404: { description: 'No such page' },
        },
      },
    },
    '/feeds/concepts.jsonl': {
      get: {
        operationId: 'getConceptsFeed',
        summary: 'AI concepts as schema.org DefinedTerm, one JSON object per line',
        responses: {
          200: {
            description: 'JSON Lines',
            content: { 'application/x-ndjson': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/feeds/tools.jsonl': {
      get: {
        operationId: 'getToolsFeed',
        summary: 'Curated AI tools as schema.org SoftwareApplication, one JSON object per line',
        responses: {
          200: {
            description: 'JSON Lines',
            content: { 'application/x-ndjson': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/feeds/pages.jsonl': {
      get: {
        operationId: 'getPagesFeed',
        summary: 'Every page as a schema.org graph, one JSON object per line',
        responses: {
          200: {
            description: 'JSON Lines',
            content: { 'application/x-ndjson': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/data/rss.json': {
      get: {
        operationId: 'getNewsSnapshot',
        summary: 'Publisher-feed snapshot behind the Hot News page (rebuilt daily)',
        responses: { 200: jsonResponse('Feed snapshot') },
      },
    },
    '/data/news-images.json': {
      get: {
        operationId: 'getNewsImages',
        summary: 'Article image manifest for the news digest',
        responses: { 200: jsonResponse('Image manifest') },
      },
    },
    '/.well-known/ai-catalog.json': {
      get: {
        operationId: 'getAiCatalog',
        summary: 'Capability catalog: every machine-readable entry point on the site',
        responses: { 200: jsonResponse('Capability catalog') },
      },
    },
  },
})

console.log(
  `agent-surface: ${routes.length} markdown twins + per-section llms.txt, llms-full.txt, ` +
    `${FEEDS.length} schema feeds, schemamap.xml, ai-catalog.json, agent-skills index, api-catalog, openapi.json`,
)

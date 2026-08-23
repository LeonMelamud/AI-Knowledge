// Postbuild step 2: the machine-readable half of the site. Everything here is
// generated from the same YAML the pages render, so a markdown twin, a schema
// feed and a page can never disagree.
//
//   /<page>.md, /<page>/index.md   markdown twin of every page (with frontmatter)
//   /<file>.md                     what each machine file is, for "append .md to anything"
//   /index.md, /llms-full.txt      homepage twin, whole knowledge base in one file
//   /<page>/llms.txt               per-section index (llms.txt spec, optional)
//   /docs/llms.txt, /api/llms.txt  scoped indexes: the knowledge base, the endpoints
//   /feeds/*.jsonl, /feeds/*.json  schema.org data, one object per line / as an array
//   /schemamap.xml                 NLWeb schema-feed map (linked from robots.txt)
//   /auth.md                       there is no authentication — say so definitively
//   /.well-known/ai-catalog.json   AI Catalog 1.0 (ARD) with per-entry trust manifests
//   /.well-known/did.json          makes did:web:ai-know.org resolve
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

const DOMAIN = 'ai-know.org'
const TODAY = new Date().toISOString().slice(0, 10)

const write = (rel, body) => {
  const target = path.join(DIST, rel)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, body)
}
const json = (rel, value) => write(rel, `${JSON.stringify(value, null, 2)}\n`)

// Digest of what actually shipped, so a catalog entry can never describe a file
// that has since changed. Callers run after the file is written.
const digestOf = (rel) => {
  const target = path.join(DIST, rel)
  return existsSync(target) ? `sha256:${createHash('sha256').update(readFileSync(target)).digest('hex')}` : undefined
}

// --- markdown twins --------------------------------------------------------
// Frontmatter first: agents read document metadata without scraping the body.
const frontmatter = (route) => `---
title: ${route.titleIsFull ? route.title : `${route.title} | ${SITE_NAME}`}
description: ${route.description.replace(/\n/g, ' ')}
canonical: ${BASE_URL}${route.path ? `${route.path}/` : ''}
last-updated: ${TODAY}
site: ${SITE_NAME} (${DOMAIN})
---

`

write('index.md', frontmatter(home) + home.markdown)
for (const route of routes) {
  // Both /calculator.md and /calculator/index.md resolve, because agents guess
  // either one from the page URL. The per-section llms.txt stays frontmatter-free:
  // llms.txt files are specified to open with the H1.
  write(`${route.path}.md`, frontmatter(route) + route.markdown)
  write(path.join(route.path, 'index.md'), frontmatter(route) + route.markdown)
  write(path.join(route.path, 'llms.txt'), route.markdown)
}

write('llms-full.txt', `${allRoutes.map((r) => r.markdown.trim()).join('\n\n---\n\n')}\n`)

// --- scoped llms.txt -------------------------------------------------------
// "Fetch context for one product area instead of the whole manual": the
// knowledge base under /docs, the machine endpoints under /api.
write(
  'docs/llms.txt',
  `# ${SITE_NAME} — knowledge base

> The explanatory content of ${DOMAIN}: ${stats.concepts} AI concepts across ${stats.conceptSections} sections and ${stats.tools} curated tools across ${stats.toolSections} sections. Scoped index; the site-wide index is at ${BASE_URL}llms.txt.

## When to use this

Use it for a plain-language definition of an AI term, or a curated shortlist of
tools for a job. Every entry links to its canonical page and to a markdown twin.

## Concepts

${concepts.map((s) => `- [${s.title}](${BASE_URL}${s.id}/) — ${s.items.length} concepts · markdown: ${BASE_URL}${s.id}.md`).join('\n')}

## Tools

${tools.map((s) => `- [${s.title}](${BASE_URL}${s.id}/) — ${s.items.length} tools · markdown: ${BASE_URL}${s.id}.md`).join('\n')}

## Everything at once

- ${BASE_URL}llms-full.txt — every page as one markdown document
`,
)

write(
  'api/llms.txt',
  `# ${SITE_NAME} — machine endpoints

> Every programmatic surface of ${DOMAIN}. All of it is static: unauthenticated HTTP GET, no API key, no rate limit, no write operations. Scoped index; the site-wide index is at ${BASE_URL}llms.txt.

## When to use this

Use these when you want records to filter rather than prose to read, or when you
are wiring ${DOMAIN} into a pipeline. Prefer a feed over crawling pages.

## Data

- ${BASE_URL}feeds/concepts.jsonl — ${stats.concepts} concepts, schema.org DefinedTerm, one JSON object per line
- ${BASE_URL}feeds/concepts.json — the same records as a JSON array
- ${BASE_URL}feeds/tools.jsonl — ${stats.tools} tools, schema.org SoftwareApplication, one per line
- ${BASE_URL}feeds/tools.json — the same records as a JSON array
- ${BASE_URL}feeds/pages.jsonl — every page as a schema.org graph
- ${BASE_URL}data/rss.json — raw publisher-feed snapshot behind Hot News, rebuilt daily

## Descriptions

- ${BASE_URL}openapi.json — OpenAPI 3.1 for the endpoints above
- ${BASE_URL}.well-known/ai-catalog.json — AI Catalog (ARD) of everything published here
- ${BASE_URL}.well-known/api-catalog — RFC 9727 linkset
- ${BASE_URL}schemamap.xml — map of the schema.org feeds
- ${BASE_URL}auth.md — why there is nothing to authenticate against

## Text

- ${BASE_URL}llms.txt — site index · ${BASE_URL}llms-full.txt — everything, one document
- ${BASE_URL}<page>.md — markdown twin of any page
`,
)

// --- schema.org feeds ------------------------------------------------------
const conceptRecords = concepts.flatMap((section) =>
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
)

const toolRecords = tools.flatMap((section) =>
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
)

const pageRecords = allRoutes.map((route) => jsonLdFor(route))

const jsonl = (objects) => `${objects.map((o) => JSON.stringify(o)).join('\n')}\n`

// JSONL for streaming consumers, JSON array for anything that just wants to
// parse a body — same records, and the array form gets a real content type.
write('feeds/concepts.jsonl', jsonl(conceptRecords))
write('feeds/tools.jsonl', jsonl(toolRecords))
write('feeds/pages.jsonl', jsonl(pageRecords))
json('feeds/concepts.json', conceptRecords)
json('feeds/tools.json', toolRecords)
json('feeds/pages.json', pageRecords)

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

// --- /auth.md --------------------------------------------------------------
// There is no authentication anywhere on this site. That is worth stating
// definitively: an agent that cannot find credentials otherwise has to guess
// whether it is unauthorised or simply unwelcome. Every section below is the
// honest answer for a keyless, read-only, static service — nothing here
// describes a credential, endpoint or flow that exists.
write(
  'auth.md',
  `# Authentication for ${DOMAIN}

**Short answer: there is nothing to authenticate.** ${SITE_NAME} is a static
site on GitHub Pages. Every URL it publishes is an unauthenticated HTTP \`GET\`
of a file: no API keys, no tokens, no OAuth, no sign-up, no rate limits, no
quotas, and no write operations of any kind. If you are an agent looking for
credentials before you fetch something here, stop looking and fetch it.

## Discover

Nothing to discover. This site deliberately publishes **no**
\`/.well-known/oauth-protected-resource\` and no
\`/.well-known/oauth-authorization-server\`, because no resource on it is
protected — advertising authorization-server metadata for a service with no
authorization server would be a false claim. No response from this origin ever
carries a \`WWW-Authenticate\` challenge, and no endpoint returns 401 or 403.

What to read instead: [\`/llms.txt\`](${BASE_URL}llms.txt) for the site index,
[\`/api/llms.txt\`](${BASE_URL}api/llms.txt) for the machine endpoints,
[\`/openapi.json\`](${BASE_URL}openapi.json) for their shapes, and
[\`/.well-known/ai-catalog.json\`](${BASE_URL}.well-known/ai-catalog.json) for
everything in one catalog.

## Pick a method

There is one method: send a plain HTTPS GET. No \`Authorization\` header, no
\`agent_auth\` scheme, no client certificate, no signed request. Sending
credentials anyway is harmless — they are ignored, and they are never logged,
because the origin is a static file host with no application layer.

## Register

Not applicable: there is no client registration, no \`register_uri\`, and no
dynamic client registration endpoint. Nothing needs a client ID because nothing
distinguishes one caller from another.

## Claim

Not applicable: there are no credentials to claim, no \`identity_assertion\` to
present, and no token exchange (no \`id-jag\` or any other grant), because there
is no authorization server to exchange anything with.

## Use the credential

There is no credential. A request looks like this in full:

\`\`\`http
GET /feeds/concepts.json HTTP/1.1
Host: ${DOMAIN}
Accept: application/json
\`\`\`

Courtesy, not requirement: send a descriptive \`User-Agent\` so the maintainer
can see how the site is used, and prefer one feed fetch over crawling every
page. Attribution to ${DOMAIN} is appreciated when you quote the content.

## Errors

Only transport-level errors exist:

| Status | Meaning | What to do |
| --- | --- | --- |
| 200 | The file exists. | Use it. |
| 301 | You asked for \`/page\`; the canonical URL is \`/page/\`. | Follow the redirect. |
| 404 | No such file. The body lists the site's sections and indexes. | Fix the path — check \`/sitemap.xml\` or \`/llms.txt\`. |

You will never see 401, 403, 429 or a paywall here. A 5xx means GitHub Pages is
having a bad day; retry with ordinary backoff.

## Revocation

Not applicable: nothing was issued, so nothing can be revoked or expire. Access
cannot be withdrawn from an individual caller, because the site does not know
who you are. The only global switch is \`/robots.txt\`, which currently permits
every crawler on every path — read it if you want the machine-readable version
of that permission.

---

Questions about use of this content: [${BASE_URL}contact/](${BASE_URL}contact/).
Terms: [${BASE_URL}terms-of-service/](${BASE_URL}terms-of-service/).
`,
)

// --- /pricing.md -----------------------------------------------------------
// Nothing here costs anything, and an agent comparing sources should be able to
// establish that in one fetch instead of hunting for a pricing page that does
// not exist.
write(
  'pricing.md',
  `# Pricing for ${DOMAIN}

**Everything on ${SITE_NAME} is free.** There is no paid tier, no subscription,
no metered usage, no credits, no trial that expires, and no commercial offering
of any kind. Nothing on this site can be purchased, and nothing asks for a
payment method.

| What | Price | Limits |
| --- | --- | --- |
| Reading any page | Free | None |
| The token calculator | Free | Runs in your browser; nothing is sent anywhere |
| Every feed, index and markdown twin (see [/api/llms.txt](${BASE_URL}api/llms.txt)) | Free | No API key, no quota, no rate limit |
| Quoting the content | Free | Attribution to ${DOMAIN} is appreciated |

## Why there is no price

${SITE_NAME} is a personal, non-commercial project maintained by ${AUTHOR}
alongside a full-time job. It carries no advertising, no sponsored placements and
no affiliate links — tools are listed because they are useful, and nobody pays to
appear ([about](${BASE_URL}about/)). Hosting is a static site on GitHub Pages, so
serving one more agent costs nothing worth billing for.

## What this means for an agent

No payment protocol is implemented or needed: this site publishes no
x402, ACP, AP2, UCP or MPP surface, because there is nothing to charge for.
Fetch what you need, prefer a feed over crawling every page, and there is
nothing else to arrange. Authentication is likewise absent — see
[/auth.md](${BASE_URL}auth.md).

The tools listed in the directory are other companies' products with their own
prices; this page describes ${DOMAIN} only. Follow a tool's vendor URL for its
pricing, and verify it there.

---
Questions: [${BASE_URL}contact/](${BASE_URL}contact/) · Terms: [${BASE_URL}terms-of-service/](${BASE_URL}terms-of-service/)
`,
)

// --- /.well-known/did.json -------------------------------------------------
// The catalog identifies the publisher as did:web:${DOMAIN}; that identifier
// has to resolve, or it is a dangling claim. This document asserts exactly one
// thing — that this DID is this domain, which is what did:web means — and
// publishes no keys, because none exist to publish.
json('.well-known/did.json', {
  '@context': ['https://www.w3.org/ns/did/v1'],
  id: `did:web:${DOMAIN}`,
  alsoKnownAs: [BASE_URL, REPO_URL, 'https://www.linkedin.com/in/leon-melamud'],
  verificationMethod: [],
  service: [
    {
      id: `did:web:${DOMAIN}#ai-catalog`,
      type: 'AICatalog',
      serviceEndpoint: `${BASE_URL}.well-known/ai-catalog.json`,
    },
    {
      id: `did:web:${DOMAIN}#llms-txt`,
      type: 'LinkedDomains',
      serviceEndpoint: `${BASE_URL}llms.txt`,
    },
  ],
})

// --- /.well-known/agent-skills/index.json ---------------------------------
// The SKILL.md itself ships from public/skills/ (Vite copies it); the digest is
// computed from what actually landed in dist, so it can never describe a stale file.
const SKILL_REL = 'skills/ai-know-lookup/SKILL.md'
if (!existsSync(path.join(DIST, SKILL_REL))) {
  throw new Error(`agent-surface: ${SKILL_REL} missing from dist — is it still in public/?`)
}

json('.well-known/agent-skills/index.json', {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  name: DOMAIN,
  description: `Skills for using the ${SITE_NAME} knowledge base (${DOMAIN}): a free, bilingual AI knowledge base with ${stats.concepts} explained concepts, ${stats.tools} curated tools, a daily news digest and a browser-side token calculator.`,
  whenToUse:
    'Use ai-know.org to define an AI term in plain language, to shortlist curated AI tools for a specific job, to cite a stable explanatory page about AI, to count the tokens in a text, or to catch up on recent AI news. Do not use it for a vendor current pricing or feature matrix, or for primary research such as papers and benchmarks — follow the vendor URL in a tool record and verify there. Everything is unauthenticated HTTP GET: start at https://ai-know.org/llms.txt, fetch https://ai-know.org/<page>.md for one page, or https://ai-know.org/feeds/concepts.json and tools.json for records to filter.',
  whenNotToUse:
    'Vendor pricing or current feature lists, primary research, anything needing an account or a write operation — this site is static and read-only.',
  skills: [
    {
      name: 'ai-know-lookup',
      type: 'skill-md',
      description:
        'Look up an AI concept or tool on ai-know.org and cite it: which markdown twin, feed or index to fetch, and how the content is structured.',
      url: `${BASE_URL}${SKILL_REL}`,
      digest: digestOf(SKILL_REL),
    },
  ],
})

// --- /.well-known/api-catalog (RFC 9727) ----------------------------------
// Extensionless file: GitHub Pages serves it as application/octet-stream rather
// than application/linkset+json. Published anyway — the document is correct, and
// the content type is the one thing static hosting cannot set.
json('.well-known/api-catalog', {
  linkset: [
    {
      anchor: `${BASE_URL}.well-known/api-catalog`,
      item: [{ href: `${BASE_URL}openapi.json`, type: 'application/vnd.oai.openapi+json' }],
    },
    {
      anchor: `${BASE_URL}openapi.json`,
      'service-desc': [{ href: `${BASE_URL}openapi.json`, type: 'application/vnd.oai.openapi+json' }],
      'service-doc': [{ href: `${BASE_URL}api/llms.txt`, type: 'text/plain' }],
      author: [{ href: `${BASE_URL}contact/` }],
      status: [{ href: `${BASE_URL}about/` }],
    },
  ],
})

// --- /openapi.json ---------------------------------------------------------
const SCHEMAS = {
  Concept: {
    type: 'object',
    description: 'One AI concept as a schema.org DefinedTerm.',
    required: ['@type', 'name', 'description', 'url'],
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'DefinedTerm' },
      '@id': { type: 'string', format: 'uri' },
      name: { type: 'string', description: 'The concept, e.g. "Retrieval-Augmented Generation".' },
      description: { type: 'string', description: 'Plain-language definition, up to ~400 characters.' },
      url: { type: 'string', format: 'uri', description: 'Canonical page to cite.' },
      inLanguage: { type: 'string', const: 'en' },
      inDefinedTermSet: {
        type: 'object',
        description: 'The section this concept belongs to.',
        properties: {
          '@type': { type: 'string', const: 'DefinedTermSet' },
          '@id': { type: 'string', format: 'uri' },
          name: { type: 'string' },
        },
      },
    },
  },
  Tool: {
    type: 'object',
    description: 'One curated AI tool as a schema.org SoftwareApplication.',
    required: ['@type', 'name', 'description'],
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'SoftwareApplication' },
      name: { type: 'string' },
      applicationCategory: { type: 'string', const: 'AI tool' },
      description: { type: 'string', description: 'What the tool is for, up to ~400 characters.' },
      url: { type: 'string', format: 'uri', description: "The vendor's own page. Verify capabilities there." },
      publisher: {
        type: 'object',
        properties: { '@type': { type: 'string', const: 'Organization' }, name: { type: 'string' } },
      },
      isPartOf: {
        type: 'object',
        description: 'The section of this site that lists the tool.',
        properties: {
          '@type': { type: 'string', const: 'CollectionPage' },
          '@id': { type: 'string', format: 'uri' },
          name: { type: 'string' },
        },
      },
    },
  },
  PageGraph: {
    type: 'object',
    description: 'One page described as a schema.org graph (WebPage/CollectionPage plus breadcrumbs and lists).',
    required: ['@context', '@graph'],
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@graph': { type: 'array', items: { type: 'object' } },
    },
  },
  NewsSnapshot: {
    type: 'object',
    description: 'Publisher-feed snapshot behind the Hot News page, rebuilt daily.',
    properties: {
      fetchedAt: { type: 'string', format: 'date-time' },
      feeds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            items: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    additionalProperties: true,
  },
  AiCatalog: {
    type: 'object',
    description: 'AI Catalog 1.0 document (Agentic Resource Discovery).',
    required: ['specVersion', 'entries'],
    properties: {
      specVersion: { type: 'string', const: '1.0' },
      host: {
        type: 'object',
        properties: { displayName: { type: 'string' }, identifier: { type: 'string' } },
      },
      entries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['identifier', 'type'],
          properties: {
            identifier: { type: 'string', description: 'urn:air URN anchored to ai-know.org.' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', description: 'Media type of the artifact.' },
            url: { type: 'string', format: 'uri' },
            trustManifest: { type: 'object' },
          },
        },
      },
    },
  },
  SkillsIndex: {
    type: 'object',
    description: 'agent-skills discovery index.',
    required: ['skills'],
    properties: {
      $schema: { type: 'string', format: 'uri' },
      name: { type: 'string' },
      description: { type: 'string' },
      skills: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'type', 'url'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', const: 'skill-md' },
            description: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            digest: { type: 'string', description: 'sha256:… of the skill document.' },
          },
        },
      },
    },
  },
}

const jsonOp = (operationId, summary, description, schemaRef) => ({
  get: {
    operationId,
    summary,
    description,
    responses: {
      200: {
        description: summary,
        content: { 'application/json': { schema: schemaRef } },
      },
    },
  },
})

const textOp = (operationId, summary, description, mediaType = 'text/plain') => ({
  get: {
    operationId,
    summary,
    description,
    responses: {
      200: { description: summary, content: { [mediaType]: { schema: { type: 'string' } } } },
    },
  },
})

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const arrayOf = (name) => ({ type: 'array', items: ref(name) })

json('openapi.json', {
  openapi: '3.1.0',
  info: {
    title: `${SITE_NAME} read-only content endpoints`,
    version: '1.0.0',
    summary: `Static JSON, JSONL and markdown representations of the ${DOMAIN} knowledge base.`,
    description: `${DOMAIN} is a static site. These are the files it publishes for programmatic use: every operation is an unauthenticated HTTP GET, there are no write operations, no rate limits and no API keys — see ${BASE_URL}auth.md. Each JSON feed has a JSONL twin at the same path with a .jsonl extension, for streaming consumers. Quoting is welcome; attribution to ${DOMAIN} is appreciated.`,
    contact: { name: AUTHOR, url: `${BASE_URL}contact/` },
  },
  servers: [{ url: BASE_URL.replace(/\/$/, ''), description: 'GitHub Pages, static hosting' }],
  paths: {
    '/feeds/concepts.json': jsonOp(
      'getConcepts',
      `All ${stats.concepts} AI concepts`,
      `Every explained concept as a schema.org DefinedTerm. Streaming twin: ${BASE_URL}feeds/concepts.jsonl (application/x-ndjson).`,
      arrayOf('Concept'),
    ),
    '/feeds/tools.json': jsonOp(
      'getTools',
      `All ${stats.tools} curated AI tools`,
      `Every curated tool as a schema.org SoftwareApplication. Streaming twin: ${BASE_URL}feeds/tools.jsonl.`,
      arrayOf('Tool'),
    ),
    '/feeds/pages.json': jsonOp(
      'getPages',
      'Every page as a schema.org graph',
      `One graph per page, matching the JSON-LD embedded in that page. Streaming twin: ${BASE_URL}feeds/pages.jsonl.`,
      arrayOf('PageGraph'),
    ),
    '/data/rss.json': jsonOp(
      'getNewsSnapshot',
      'AI news snapshot',
      'The publisher-feed data behind the Hot News page, rebuilt daily by a scheduled build.',
      ref('NewsSnapshot'),
    ),
    '/.well-known/ai-catalog.json': jsonOp(
      'getAiCatalog',
      'Capability catalog',
      'Every machine-readable entry point on the site, as an AI Catalog 1.0 document with per-entry trust manifests.',
      ref('AiCatalog'),
    ),
    '/.well-known/agent-skills/index.json': jsonOp(
      'getSkillsIndex',
      'Agent skills index',
      'Discovery index for the skill document that explains how to look things up here.',
      ref('SkillsIndex'),
    ),
    '/openapi.json': jsonOp(
      'getOpenApi',
      'This description',
      'The OpenAPI 3.1 document describing these endpoints.',
      { type: 'object' },
    ),
    '/llms.txt': textOp('getLlmsIndex', 'Index of the knowledge base for LLMs', `Curated index of every section. Scoped variants: ${BASE_URL}docs/llms.txt (content) and ${BASE_URL}api/llms.txt (endpoints).`),
    '/llms-full.txt': textOp('getLlmsFull', 'The whole knowledge base as one markdown document', 'Every page concatenated, for one-shot ingestion.'),
    '/auth.md': textOp('getAuthDoc', 'Authentication policy', 'States that there is no authentication and nothing to obtain.', 'text/markdown'),
    '/{page}.md': {
      get: {
        operationId: 'getPageMarkdown',
        summary: 'Markdown twin of a page',
        description: 'Any page path with a .md suffix returns that page as markdown with YAML frontmatter (title, description, canonical, last-updated).',
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
          404: { description: 'No such page. The body lists the sections and indexes of the site.' },
        },
      },
    },
  },
  components: { schemas: SCHEMAS },
})

// --- markdown companions for the machine files ----------------------------
// "Append .md to any URL" should hold for the machine surface too, not just for
// pages: an agent that finds openapi.json can ask what it is in prose.
const FILE_DOCS = [
  {
    file: 'openapi.json',
    title: 'openapi.json',
    body: `OpenAPI 3.1 description of every read-only endpoint on ${DOMAIN}: the JSON and JSONL feeds, the news snapshot, the catalogs and the markdown twins. ${stats.concepts} concepts and ${stats.tools} tools are reachable through it.\n\nEvery operation is an unauthenticated GET of a static file — there are no write operations, no keys and no rate limits (see [auth.md](${BASE_URL}auth.md)). Typed response schemas live in \`components.schemas\`.`,
  },
  {
    file: 'schemamap.xml',
    title: 'schemamap.xml',
    body: `An NLWeb-style schema map: a sitemap-shaped XML file listing this site's schema.org JSON-LD feeds, each tagged \`structuredData/schema.org\`. It is advertised from [robots.txt](${BASE_URL}robots.txt) with a \`schemamap:\` directive.\n\nThe feeds it points at:\n\n${FEEDS.map((f) => `- ${f.url} — ${f.label}`).join('\n')}`,
  },
  {
    file: 'feeds/concepts.jsonl',
    title: 'feeds/concepts.jsonl',
    body: `${stats.concepts} AI concepts, one schema.org \`DefinedTerm\` per line (JSON Lines). Each record carries \`name\`, a plain-language \`description\`, the canonical page \`url\` to cite, and the section it belongs to.\n\nSame records as a JSON array: [feeds/concepts.json](${BASE_URL}feeds/concepts.json). Shapes: [openapi.json](${BASE_URL}openapi.json).`,
  },
  {
    file: 'feeds/tools.jsonl',
    title: 'feeds/tools.jsonl',
    body: `${stats.tools} curated AI tools, one schema.org \`SoftwareApplication\` per line (JSON Lines). Each record carries \`name\`, \`publisher\`, what the tool is for, and the vendor's own \`url\` — verify current capabilities and pricing there, not here.\n\nSame records as a JSON array: [feeds/tools.json](${BASE_URL}feeds/tools.json).`,
  },
  {
    file: '.well-known/ai-catalog.json',
    title: 'ai-catalog.json',
    body: `An [AI Catalog 1.0](https://ai-catalog.io/) document (Agentic Resource Discovery): one list of every machine-readable artifact ${DOMAIN} publishes, each with a \`urn:air\` identifier, a media type, a URL and a trust manifest carrying the sha256 digest of the file that shipped.\n\nStart here if you want to know what this site offers an agent without crawling it.`,
  },
  {
    file: 'sitemap.xml',
    title: 'sitemap.xml',
    body: `Every canonical page URL on ${DOMAIN} with a last-modified date — ${routes.length + 1} entries, regenerated on each build. Trailing slashes are canonical: \`/ai-basics\` redirects to \`/ai-basics/\`.\n\nFor the same list with summaries, read [llms.txt](${BASE_URL}llms.txt); for the pages themselves as markdown, append \`.md\` to any path.`,
  },
  {
    file: 'feeds/concepts.json',
    title: 'feeds/concepts.json',
    body: `${stats.concepts} AI concepts as a JSON array of schema.org \`DefinedTerm\` objects — the same records as [concepts.jsonl](${BASE_URL}feeds/concepts.jsonl), in a form you can hand straight to a JSON parser. Typed schema: \`components.schemas.Concept\` in [openapi.json](${BASE_URL}openapi.json).`,
  },
  {
    file: 'feeds/tools.json',
    title: 'feeds/tools.json',
    body: `${stats.tools} curated AI tools as a JSON array of schema.org \`SoftwareApplication\` objects — the same records as [tools.jsonl](${BASE_URL}feeds/tools.jsonl). Each carries the vendor's own URL; verify current capabilities and pricing there rather than here.`,
  },
  {
    file: 'feeds/pages.json',
    title: 'feeds/pages.json',
    body: `Every page of ${DOMAIN} as a schema.org graph, matching the JSON-LD embedded in that page (WebPage or CollectionPage, BreadcrumbList, and a DefinedTermSet or ItemList of its contents). JSONL twin: [pages.jsonl](${BASE_URL}feeds/pages.jsonl).`,
  },
  {
    file: 'feeds/tools.jsonl',
    title: 'feeds/tools.jsonl',
    body: `${stats.tools} curated AI tools, one schema.org \`SoftwareApplication\` per line. Array form: [tools.json](${BASE_URL}feeds/tools.json).`,
  },
  {
    file: 'feeds/pages.jsonl',
    title: 'feeds/pages.jsonl',
    body: `Every page as a schema.org graph, one per line. Array form: [pages.json](${BASE_URL}feeds/pages.json).`,
  },
  {
    file: '.well-known/agent-skills/index.json',
    title: 'agent-skills/index.json',
    body: `An agent-skills discovery index: it names one skill, \`ai-know-lookup\`, points at its [SKILL.md](${BASE_URL}${SKILL_REL}) and carries that document's sha256 digest so you can verify what you fetched.\n\nThe skill explains when ${DOMAIN} is the right source, which artifact to fetch for which question, and how to cite it.`,
  },
  {
    file: '.well-known/api-catalog',
    title: 'api-catalog',
    body: `An [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) linkset pointing at this site's API description. GitHub Pages cannot set a content type for an extensionless file, so it arrives as \`application/octet-stream\` — the body is a normal linkset JSON document.\n\nThe thing it points at: [openapi.json](${BASE_URL}openapi.json).`,
  },
  {
    file: '.well-known/did.json',
    title: 'did.json',
    body: `The DID document for \`did:web:${DOMAIN}\`, which is the publisher identity used in the [AI Catalog](${BASE_URL}.well-known/ai-catalog.json). It asserts exactly one thing — that this DID is this domain — and publishes **no** verification keys, because none exist. Trust here rests on TLS and on the sha256 digests in the catalog, not on signatures.`,
  },
  {
    file: 'data/rss.json',
    title: 'data/rss.json',
    body: `The raw publisher-feed snapshot behind the [Hot News](${BASE_URL}hot-news/) page: AI desks from several publishers, fetched and cached by a scheduled build once a day. Items older than six months are pruned, so this is a rolling window rather than an archive.`,
  },
]

for (const doc of FILE_DOCS) {
  write(
    `${doc.file}.md`,
    `---
title: ${doc.title} — ${SITE_NAME}
description: What ${BASE_URL}${doc.file} contains and how to use it.
canonical: ${BASE_URL}${doc.file}
last-updated: ${TODAY}
---

# ${doc.title}

${doc.body}

---
Site index: [${BASE_URL}llms.txt](${BASE_URL}llms.txt) · Endpoints: [${BASE_URL}api/llms.txt](${BASE_URL}api/llms.txt)
`,
  )
}

// --- /.well-known/ai-catalog.json -----------------------------------------
// Written last: every entry carries the digest of the file as shipped, so each
// artifact has to exist on disk by now.
//
// Trust manifests state only what is verifiable: the publisher identity is the
// domain itself (did:web, resolvable via /.well-known/did.json), provenance is
// the public repository this file was built from, and the digest is of the
// artifact served. No attestations — there are no audits to point at — and no
// signature, because no signing key is published.
const entry = (kind, name, displayName, type, url, description, file) => {
  const identifier = `urn:air:${DOMAIN}:${kind}:${name}`
  const digest = file ? digestOf(file) : undefined
  return {
    identifier,
    displayName,
    description,
    type,
    url,
    trustManifest: {
      identity: identifier,
      identityType: 'dns',
      provenance: [
        {
          relation: 'publishedFrom',
          sourceId: REPO_URL,
          ...(digest ? { sourceDigest: digest } : {}),
        },
      ],
      privacyPolicyUrl: `${BASE_URL}privacy-policy/`,
      termsOfServiceUrl: `${BASE_URL}terms-of-service/`,
    },
  }
}

json('.well-known/ai-catalog.json', {
  specVersion: '1.0',
  host: {
    displayName: SITE_NAME,
    identifier: `did:web:${DOMAIN}`,
    description: `Bilingual (English/Hebrew) AI knowledge base: ${stats.concepts} explained concepts, ${stats.tools} curated tools, a daily news digest and a browser-side token calculator. Static site, no authentication.`,
    url: BASE_URL,
  },
  entries: [
    entry('doc', 'llms-txt', 'llms.txt site index', 'text/plain', `${BASE_URL}llms.txt`, 'Curated index of every section with one-line summaries. Start here.', 'llms.txt'),
    entry('doc', 'llms-full-txt', 'Full knowledge base, one document', 'text/plain', `${BASE_URL}llms-full.txt`, 'Every page concatenated as markdown, for one-shot ingestion.', 'llms-full.txt'),
    entry('doc', 'markdown-twins', 'Markdown twin of any page', 'text/markdown', `${BASE_URL}index.md`, 'Append .md to any page path (e.g. /ai-basics.md) for that page as markdown with frontmatter; /<page>/index.md and /<page>/llms.txt serve the same content.', 'index.md'),
    entry('doc', 'docs-llms-txt', 'Scoped index: knowledge base', 'text/plain', `${BASE_URL}docs/llms.txt`, 'The explanatory content only — concepts and tool sections.', 'docs/llms.txt'),
    entry('doc', 'api-llms-txt', 'Scoped index: machine endpoints', 'text/plain', `${BASE_URL}api/llms.txt`, 'The programmatic surface only — feeds, catalogs, descriptions.', 'api/llms.txt'),
    entry('doc', 'auth-md', 'Authentication policy', 'text/markdown', `${BASE_URL}auth.md`, 'States definitively that there is no authentication: every endpoint is public, read-only and keyless.', 'auth.md'),
    entry('doc', 'pricing-md', 'Pricing policy', 'text/markdown', `${BASE_URL}pricing.md`, 'States definitively that everything is free: no paid tier, no quota, no payment protocol, nothing to buy.', 'pricing.md'),
    entry('dataset', 'concepts', `${stats.concepts} AI concepts`, 'application/json', `${BASE_URL}feeds/concepts.json`, 'Every explained concept as a schema.org DefinedTerm array. JSONL twin at feeds/concepts.jsonl.', 'feeds/concepts.json'),
    entry('dataset', 'tools', `${stats.tools} curated AI tools`, 'application/json', `${BASE_URL}feeds/tools.json`, 'Every curated tool as a schema.org SoftwareApplication array. JSONL twin at feeds/tools.jsonl.', 'feeds/tools.json'),
    entry('dataset', 'pages', 'Every page as a schema.org graph', 'application/json', `${BASE_URL}feeds/pages.json`, 'One graph per page, matching the JSON-LD embedded in that page.', 'feeds/pages.json'),
    entry('dataset', 'news-snapshot', 'AI news snapshot', 'application/json', `${BASE_URL}data/rss.json`, 'Raw publisher-feed data behind the Hot News page, rebuilt daily.', 'data/rss.json'),
    entry('dataset', 'schemamap', 'Schema feed map', 'application/xml', `${BASE_URL}schemamap.xml`, 'NLWeb-style map of the schema.org JSON-LD feeds published here.', 'schemamap.xml'),
    entry('openapi', 'read-only-endpoints', 'OpenAPI description of the endpoints', 'application/vnd.oai.openapi+json', `${BASE_URL}openapi.json`, 'OpenAPI 3.1 for the static GET endpoints, with typed response schemas. Read-only, no authentication.', 'openapi.json'),
    entry('skill', 'ai-know-lookup', 'Agent skill: look something up here', 'text/markdown', `${BASE_URL}${SKILL_REL}`, 'How to search this knowledge base, which artifact to fetch, and how to cite it.', SKILL_REL),
    entry('catalog', 'agent-skills-index', 'Agent skills discovery index', 'application/json', `${BASE_URL}.well-known/agent-skills/index.json`, 'agent-skills index listing the skill document and its digest.', '.well-known/agent-skills/index.json'),
    entry('sitemap', 'pages', 'Sitemap', 'application/xml', `${BASE_URL}sitemap.xml`, 'Every canonical page URL with a last-modified date.', 'sitemap.xml'),
    entry('repo', 'source', 'Source repository', 'text/html', REPO_URL, 'The YAML/JSON content and the build pipeline that produces this site. Corrections as issues or pull requests.'),
  ],
})

console.log(
  `agent-surface: ${routes.length} markdown twins (frontmatter) + per-section llms.txt, llms-full.txt, ` +
    `scoped docs/ + api/ llms.txt, ${FEEDS.length} feeds x2 formats, ${FILE_DOCS.length} file docs, ` +
    `auth.md, schemamap.xml, ai-catalog 1.0 (+trust manifests), did.json, agent-skills index, api-catalog, openapi.json`,
)

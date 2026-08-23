// One route model, shared by prerender.mjs (HTML) and agent-surface.mjs
// (markdown twins, feeds, catalogs). The YAML under client/data is the single
// source of truth for both, so a page and its .md twin can never drift.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load } from 'js-yaml'

export const CLIENT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DIST = path.join(CLIENT_DIR, 'dist')
const DATA_DIR = path.join(CLIENT_DIR, 'data')

export const BASE_URL = 'https://ai-know.org/'
export const SITE_NAME = 'Guide to AI'
export const REPO_URL = 'https://github.com/LeonMelamud/AI-Knowledge'
export const AUTHOR = 'Leon Melamud'
const SITE_CARD = 'og-image.png'

const TAGLINE =
  'Guide to AI (ai-know.org) is a free, bilingual (English and Hebrew) knowledge base about ' +
  'artificial intelligence: explained concepts, curated tools, a daily news digest and a ' +
  'browser-side token calculator. It is a static site — no account, no tracking, no paywall.'

export const concepts = load(readFileSync(path.join(DATA_DIR, 'concepts_en.yaml'), 'utf8')).concepts
export const tools = load(readFileSync(path.join(DATA_DIR, 'links_en.yaml'), 'utf8')).tools
const ui = JSON.parse(readFileSync(path.join(DATA_DIR, 'ui_translations_en.json'), 'utf8'))

export const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Descriptions are authored as markdown. Body copy needs plain text (a literal
// `**` renders as `**` before React boots), the .md twin keeps the markdown.
export const mdToText = (md = '') =>
  String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export const truncate = (s, n) => {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  return `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…`
}

const names = (items, n) => items.slice(0, n).map((item) => item.name).join(', ')

// Per-route social image; falls back to the site card so a missing hero never
// produces a broken og:image.
const heroPath = (id) =>
  existsSync(path.join(CLIENT_DIR, 'public', 'images', 'heroes', `${id}-og.jpg`))
    ? `images/heroes/${id}-og.jpg`
    : SITE_CARD

const p = (text) => `<p>${escapeHtml(text)}</p>`
const list = (items) => `<ul>\n${items.map((i) => `      <li>${i}</li>`).join('\n')}\n    </ul>`
const link = (href, text) => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`

const contentRoutes = () => [
  ...concepts.map((s) => ({ id: s.id, title: s.title })),
  ...tools.map((s) => ({ id: s.id, title: s.title })),
]

// Repeated on every page: an agent that lands deep still finds the machine
// surface without crawling back to the homepage.
const agentFooter = (routePath) => {
  const md = routePath ? `/${routePath}.md` : '/index.md'
  return `<h2>Machine-readable versions of this site</h2>
    ${list([
      `Markdown twin of this page: ${link(md, md)}`,
      `Index for LLMs: ${link('/llms.txt', '/llms.txt')} — full text: ${link('/llms-full.txt', '/llms-full.txt')}`,
      `Capability catalog: ${link('/.well-known/ai-catalog.json', '/.well-known/ai-catalog.json')}`,
      `Structured data feeds: ${link('/schemamap.xml', '/schemamap.xml')} (schema.org JSON-LD, one object per line)`,
      `Agent skill: ${link('/.well-known/agent-skills/index.json', '/.well-known/agent-skills/index.json')}`,
      `Source content: ${link(REPO_URL, 'github.com/LeonMelamud/AI-Knowledge')}`,
    ])}`
}

// Landmarks around the page body: an agent navigating by landmark and heading
// gets header / nav / main / footer instead of one <main> and a wall of links.
export const siteChrome = (routePath) => ({
  header: `<header>
      ${p(`${SITE_NAME} — the bilingual AI knowledge base at ai-know.org. ${stats.concepts} explained concepts, ${stats.tools} curated tools, daily AI news and a token calculator. Free, no account, no tracking.`)}
    </header>`,
  nav: `<nav aria-label="Site sections">
      <h2>Sections of this guide</h2>
      ${list(
        contentRoutes()
          .filter((s) => s.id !== routePath)
          .map((s) => link(`/${s.id}/`, s.title)),
      )}
      ${list([
        link('/hot-news/', 'Hot News'),
        link('/calculator/', 'Token Calculator'),
        link('/about/', 'About'),
        link('/contact/', 'Contact'),
      ])}
    </nav>`,
  footer: `<footer>
      ${agentFooter(routePath)}
      ${list([
        link('/privacy-policy/', 'Privacy Policy'),
        link('/terms-of-service/', 'Terms of Service'),
        `Maintained by ${AUTHOR} — ${link(REPO_URL, 'source on GitHub')}`,
      ])}
    </footer>`,
})

const questionsOf = (section) =>
  (section.items || []).flatMap((item) =>
    (item.commonQuestions || []).map((q) => ({ ...q, about: item.name })),
  )

function conceptBody(section) {
  const items = section.items || []
  const qs = questionsOf(section)
  return `<h1>${escapeHtml(section.title)}</h1>
    ${p(`${section.title}: ${items.length} artificial-intelligence concepts explained in plain language, each with a short definition and a fuller explanation. Part of the ${SITE_NAME} knowledge base.`)}
    ${p(TAGLINE)}
    <h2>Concepts in this section</h2>
    ${items
      .map(
        (item) => `<section>
      <h3>${escapeHtml(item.name)}</h3>
      ${p(mdToText(item.shortDescription))}
      ${item.fullDescription ? p(truncate(mdToText(item.fullDescription), 900)) : ''}
      ${item.relatedConcepts?.length ? p(`Related concepts: ${item.relatedConcepts.join(', ')}.`) : ''}
    </section>`,
      )
      .join('\n    ')}
    ${
      qs.length
        ? `<h2>Common questions</h2>
    ${qs
      .map(
        (q) => `<section>
      <h3>${escapeHtml(q.question)}</h3>
      ${p(mdToText(q.answer))}
    </section>`,
      )
      .join('\n    ')}`
        : ''
    }
`
}

function toolBody(section) {
  const items = section.items || []
  return `<h1>${escapeHtml(section.title)}</h1>
    ${p(`${section.title}: ${items.length} curated artificial-intelligence tools and resources, each with the vendor and what it is used for. Part of the ${SITE_NAME} knowledge base.`)}
    ${p(TAGLINE)}
    <h2>Tools in this section</h2>
    ${items
      .map(
        (item) => `<section>
      <h3>${item.url ? `<a href="${escapeHtml(item.url)}" rel="noreferrer">${escapeHtml(item.name)}</a>` : escapeHtml(item.name)}</h3>
      ${p(`${item.company ? `${item.company} — ` : ''}${mdToText(item.description)}`)}
    </section>`,
      )
      .join('\n    ')}
`
}

function conceptMarkdown(section) {
  const qs = questionsOf(section)
  return `# ${section.title}

> ${section.items.length} AI concepts explained. Canonical page: ${BASE_URL}${section.id}/

${TAGLINE}

## Concepts

${section.items
  .map(
    (item) => `### ${item.name}

${item.shortDescription || ''}
${item.fullDescription ? `\n${item.fullDescription}\n` : ''}${
      item.relatedConcepts?.length ? `\nRelated: ${item.relatedConcepts.join(', ')}\n` : ''
    }`,
  )
  .join('\n')}
${
  qs.length
    ? `## Common questions

${qs.map((q) => `### ${q.question}\n\n${q.answer}\n`).join('\n')}`
    : ''
}
## Other sections

${contentRoutes()
  .filter((s) => s.id !== section.id)
  .map((s) => `- [${s.title}](${BASE_URL}${s.id}/)`)
  .join('\n')}

---
Source: ${BASE_URL}${section.id}/ · Site index: ${BASE_URL}llms.txt · Repository: ${REPO_URL}
`
}

function toolMarkdown(section) {
  return `# ${section.title}

> ${section.items.length} curated AI tools and resources. Canonical page: ${BASE_URL}${section.id}/

${TAGLINE}

## Tools

${section.items
  .map((item) => `- [${item.name}](${item.url || BASE_URL})${item.company ? ` — ${item.company}` : ''}: ${item.description || ''}`)
  .join('\n')}

## Other sections

${contentRoutes()
  .filter((s) => s.id !== section.id)
  .map((s) => `- [${s.title}](${BASE_URL}${s.id}/)`)
  .join('\n')}

---
Source: ${BASE_URL}${section.id}/ · Site index: ${BASE_URL}llms.txt · Repository: ${REPO_URL}
`
}

// Site-level FAQ: facts about the site itself, mirrored into FAQPage JSON-LD on
// the homepage. Kept here so the visible answer and the structured answer are
// literally the same string.
export const SITE_FAQ = [
  {
    question: 'What is Guide to AI (ai-know.org)?',
    answer:
      'A free, bilingual (English and Hebrew) knowledge base about artificial intelligence. It covers AI concepts with short and full explanations, curated tools by category, a daily news digest, and a token calculator that runs in the browser.',
  },
  {
    question: 'Is it free, and does it require an account?',
    answer:
      'Yes, everything is free and there is no account, no login and no paywall. The site is fully static, stores nothing server-side and sets no tracking cookies.',
  },
  {
    question: 'Who writes and maintains it?',
    answer: `${AUTHOR}, an AI and cloud architecture practitioner. The content lives as YAML and JSON in the public repository ${REPO_URL}, so every change is visible in its git history.`,
  },
  {
    question: 'How can an AI agent or LLM consume this site?',
    answer:
      'Start at /llms.txt for the index, or /llms-full.txt for the whole knowledge base as one markdown document. Every page has a markdown twin at the same path with a .md suffix, /schemamap.xml points to schema.org JSON-LD feeds, and /.well-known/ai-catalog.json lists every machine-readable entry point.',
  },
  {
    question: 'May the content be used to train models or answer questions?',
    answer:
      'Yes. Crawling and quoting are allowed for the major AI crawlers (see /robots.txt), attribution to ai-know.org is appreciated, and the underlying source data is public in the repository.',
  },
  {
    question: 'How current is the AI news section?',
    answer:
      'The news digest is rebuilt automatically every day from publisher RSS feeds; the raw snapshot an agent can read directly is at /data/rss.json.',
  },
]

function homeBody() {
  const sections = contentRoutes()
  return `<h1>${SITE_NAME} — The AI Knowledge Base</h1>
    ${p(TAGLINE)}
    ${p(`The guide is organised into ${concepts.length} concept sections (${concepts.reduce((n, s) => n + s.items.length, 0)} explained terms) and ${tools.length} tool sections (${tools.reduce((n, s) => n + s.items.length, 0)} curated tools and resources), plus a daily AI news digest and a token calculator. Every page is available in English and Hebrew; the language is chosen in the interface and remembered locally.`)}
    <h2>Concepts explained</h2>
    ${list(concepts.map((s) => `${link(`/${s.id}/`, s.title)} — ${escapeHtml(truncate(names(s.items, 5), 120))}`))}
    <h2>Tools and resources</h2>
    ${list(tools.map((s) => `${link(`/${s.id}/`, s.title)} — ${escapeHtml(truncate(names(s.items, 5), 120))}`))}
    <h2>Also on this site</h2>
    ${list([
      `${link('/hot-news/', 'Hot News')} — AI developments, rebuilt daily from publisher feeds`,
      `${link('/calculator/', 'Token Calculator')} — count LLM tokens for any text, computed in your browser`,
      `${link('/about/', 'About')} — who runs this guide and how the content is made`,
      `${link('/contact/', 'Contact')} — how to reach the author or report an error`,
    ])}
    <h2>Frequently asked questions</h2>
    ${SITE_FAQ.map(
      (q) => `<section>
      <h3>${escapeHtml(q.question)}</h3>
      ${p(q.answer)}
    </section>`,
    ).join('\n    ')}
    ${p(`Sections: ${sections.map((s) => s.title).join(', ')}.`)}`
}

function homeMarkdown() {
  return `# ${SITE_NAME} — The AI Knowledge Base

> ${TAGLINE}

Canonical page: ${BASE_URL}

## Concepts explained

${concepts.map((s) => `- [${s.title}](${BASE_URL}${s.id}/) — ${names(s.items, 6)}`).join('\n')}

## Tools and resources

${tools.map((s) => `- [${s.title}](${BASE_URL}${s.id}/) — ${names(s.items, 6)}`).join('\n')}

## Also on this site

- [Hot News](${BASE_URL}hot-news/) — AI developments, rebuilt daily from publisher feeds
- [Token Calculator](${BASE_URL}calculator/) — count LLM tokens for any text, in the browser
- [About](${BASE_URL}about/) — who runs this guide and how the content is made
- [Contact](${BASE_URL}contact/) — how to reach the author

## Frequently asked questions

${SITE_FAQ.map((q) => `### ${q.question}\n\n${q.answer}\n`).join('\n')}

## Machine-readable entry points

- ${BASE_URL}llms.txt — this index
- ${BASE_URL}llms-full.txt — the whole knowledge base as one document
- ${BASE_URL}<page>.md — markdown twin of any page
- ${BASE_URL}schemamap.xml — schema.org JSON-LD feeds
- ${BASE_URL}.well-known/ai-catalog.json — capability catalog
- ${BASE_URL}sitemap.xml — all pages
- ${REPO_URL} — source content (YAML/JSON) and build pipeline

---
Site index: ${BASE_URL}llms.txt · Repository: ${REPO_URL}
`
}

// Static pages. Bodies are written here rather than derived from components,
// because the React tree is what a browser gets and this is what everything
// else gets; both say the same thing.
const staticPages = () => [
  {
    path: 'hot-news',
    title: 'Hot News',
    description: 'Latest advancements and updates in AI technology, refreshed daily.',
    image: heroPath('hot-news'),
    body: `<h1>Hot News — AI developments</h1>
    ${p('A digest of recent artificial-intelligence news, rebuilt automatically every day from publisher RSS feeds (TechCrunch, The Verge, VentureBeat, MIT Technology Review and other AI desks) and grouped by topic.')}
    ${p('Because the digest is regenerated on every build, this page is the freshest content on the site. An agent that wants the underlying data rather than the page can read the snapshot directly.')}
    ${list([
      `Raw feed snapshot (JSON): ${link('/data/rss.json', '/data/rss.json')}`,
      `Article images manifest (JSON): ${link('/data/news-images.json', '/data/news-images.json')}`,
      `Topic summaries are stored in the repository under client/data as news_en.yaml and news_he.yaml: ${link(REPO_URL, 'github.com/LeonMelamud/AI-Knowledge')}`,
    ])}
    ${p('Items older than six months are pruned automatically, so the page is a rolling window rather than an archive.')}`,
    markdown: `# Hot News — AI developments

> A digest of recent AI news, rebuilt automatically every day from publisher RSS feeds and grouped by topic. Canonical page: ${BASE_URL}hot-news/

The freshest content on the site. Items older than six months are pruned, so this is a rolling window, not an archive.

## Data an agent can read directly

- ${BASE_URL}data/rss.json — raw feed snapshot (JSON)
- ${BASE_URL}data/news-images.json — article image manifest (JSON)
- ${REPO_URL} — topic summaries as YAML (client/data/news_en.yaml, news_he.yaml)

---
Site index: ${BASE_URL}llms.txt
`,
  },
  {
    path: 'calculator',
    title: 'Token Calculator',
    description: 'Count LLM tokens for any text, right in your browser.',
    image: heroPath('calculator'),
    // The form carries WebMCP annotations so a browser agent can drive it; the
    // React version registers the same capability as a real tool (lib/webmcp.ts).
    body: `<h1>Token Calculator — count LLM tokens</h1>
    ${p('Paste any text and get the number of tokens a large language model would charge for. The count is computed entirely in your browser with the js-tiktoken GPT-2 encoder: the text is never uploaded, logged or stored anywhere.')}
    ${p('Language models bill and truncate by token, not by word: roughly four characters of English make one token, while Hebrew, code and rare words cost more. Counting before you send a prompt is how you keep a request inside a context window and predict its price.')}
    <form toolname="count_tokens" tooldescription="Count the number of LLM tokens (js-tiktoken GPT-2 encoding) in a piece of text. Runs locally in the browser; the text is not uploaded." action="/calculator" method="get">
      <label for="tokens-input">Text to count</label>
      <textarea id="tokens-input" name="text" toolname="text" tooldescription="The text whose tokens should be counted" rows="6"></textarea>
      <button type="submit">Calculate tokens</button>
    </form>
    ${p('This page needs JavaScript to compute a count, because the encoder runs on your device. Agents can call the same capability as a WebMCP tool named count_tokens once the page has loaded.')}`,
    markdown: `# Token Calculator — count LLM tokens

> Count the tokens a large language model would charge for any text. Canonical page: ${BASE_URL}calculator/

The count runs entirely in the browser using the js-tiktoken GPT-2 encoder. Text is never uploaded, logged or stored.

Language models bill and truncate by token, not by word: roughly four characters of English make one token, while Hebrew, code and rare words cost more.

## For agents

The page exposes a WebMCP tool, \`count_tokens\`, taking \`{ "text": "…" }\` and returning the token count. It is registered on the live page (see \`client/src/lib/webmcp.ts\` in ${REPO_URL}); there is no server-side API to call.

---
Site index: ${BASE_URL}llms.txt
`,
  },
  {
    path: 'about',
    title: 'About',
    description: `About the ${SITE_NAME} knowledge base: what it covers, who maintains it, and how the content is produced.`,
    image: SITE_CARD,
    body: `<h1>About ${SITE_NAME}</h1>
    ${p(TAGLINE)}
    <h2>What is here</h2>
    ${p(`Concept sections explain artificial-intelligence terminology twice over — a one-line definition for orientation and a fuller explanation for depth. Tool sections are a curated directory: each entry names the vendor and says what the tool is actually for, rather than reprinting marketing copy. The news digest is assembled from publisher feeds every day, and the token calculator answers the single most common practical question when working with language models.`)}
    <h2>Who maintains it</h2>
    ${p(`${AUTHOR} — an AI and cloud-architecture practitioner working on generative AI, agents and automation, and a co-founder of several Israeli AI communities. The guide started as a way to give newcomers one honest reference instead of a pile of vendor blog posts.`)}
    <h2>How the content is produced</h2>
    ${p('Content is authored as structured YAML and JSON in a public repository and rendered by a static site generator. There is no CMS and no database. The news digest is refreshed by a scheduled build that reads publisher RSS feeds; every other change is a commit, so the full history of what changed and when is public.')}
    ${p('Corrections are welcome: the fastest route is an issue or pull request in the repository.')}
    <h2>Editorial stance</h2>
    ${list([
      'No sponsored placements. Tools are listed because they are useful, and no one pays to appear.',
      'No tracking, no analytics cookies, no account. The site collects nothing about you.',
      'Bilingual by default — every section exists in English and Hebrew.',
      'Machine-readable by default — the same content is published as markdown, JSON-LD and plain-text indexes for AI agents.',
    ])}
    ${list([`Repository: ${link(REPO_URL, 'github.com/LeonMelamud/AI-Knowledge')}`, `Contact: ${link('/contact/', 'the contact page')}`])}`,
    markdown: `# About ${SITE_NAME}

> ${TAGLINE}

Canonical page: ${BASE_URL}about/

## What is here

Concept sections explain AI terminology twice over — a one-line definition and a fuller explanation. Tool sections are a curated directory naming the vendor and the real use case. The news digest is assembled daily from publisher feeds. The token calculator runs in the browser.

## Who maintains it

${AUTHOR} — an AI and cloud-architecture practitioner working on generative AI, agents and automation, and a co-founder of several Israeli AI communities.

## How the content is produced

Content is authored as structured YAML/JSON in a public repository (${REPO_URL}) and rendered by a static site generator. No CMS, no database. The news digest is refreshed by a scheduled build; every other change is a commit, so the history is public. Corrections are welcome as issues or pull requests.

## Editorial stance

- No sponsored placements; nobody pays to be listed.
- No tracking, no analytics cookies, no account.
- Bilingual by default (English and Hebrew).
- Machine-readable by default: markdown twins, JSON-LD feeds and plain-text indexes.

---
Contact: ${BASE_URL}contact/ · Site index: ${BASE_URL}llms.txt
`,
  },
  {
    path: 'contact',
    title: 'Contact',
    description: `How to reach the maintainer of ${SITE_NAME}: report an error, suggest a tool, or ask a question.`,
    image: SITE_CARD,
    body: `<h1>Contact</h1>
    ${p(`${SITE_NAME} is maintained by ${AUTHOR}. There is no contact form and no mailing list — the site is static and stores nothing — so use one of the channels below.`)}
    <h2>Channels</h2>
    ${list([
      `Report an error, suggest a tool or request a concept: ${link(`${REPO_URL}/issues`, 'open an issue on GitHub')} — the fastest route, and it leaves a public record.`,
      `Propose an edit directly: ${link(REPO_URL, 'fork the repository and open a pull request')}. Content lives in client/data as YAML and JSON.`,
      `Professional enquiries and everything else: ${link('https://www.linkedin.com/in/leon-melamud', 'LinkedIn (linkedin.com/in/leon-melamud)')}.`,
    ])}
    <h2>What to expect</h2>
    ${p('This is a personal, non-commercial project maintained alongside a full-time job, so replies are best-effort rather than same-day. Factual corrections are prioritised over everything else — if something on the site is wrong, say which page and what is wrong, and it gets fixed.')}
    ${p('Privacy or legal questions about the site are answered through the same channels; see the privacy policy and terms of service for the written positions.')}
    ${list([link('/privacy-policy/', 'Privacy Policy'), link('/terms-of-service/', 'Terms of Service'), link('/about/', 'About this guide')])}`,
    markdown: `# Contact

> How to reach the maintainer of ${SITE_NAME}. Canonical page: ${BASE_URL}contact/

${SITE_NAME} is maintained by ${AUTHOR}. There is no contact form and no mailing list — the site is static and stores nothing.

## Channels

- Report an error, suggest a tool, request a concept: ${REPO_URL}/issues
- Propose an edit: fork ${REPO_URL} and open a pull request (content is YAML/JSON under client/data)
- Professional enquiries: https://www.linkedin.com/in/leon-melamud

## What to expect

A personal, non-commercial project maintained alongside a full-time job: replies are best-effort. Factual corrections are prioritised — name the page and what is wrong.

---
Privacy: ${BASE_URL}privacy-policy/ · Terms: ${BASE_URL}terms-of-service/ · Site index: ${BASE_URL}llms.txt
`,
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy',
    description: `Privacy policy of the ${SITE_NAME} knowledge base.`,
    image: SITE_CARD,
    body: `<h1>${escapeHtml(ui.privacyPolicyTitle)}</h1>
    ${p(ui.effectiveDate)}
    <h2>${escapeHtml(ui.privacyIntroTitle)}</h2>
    ${p(ui.privacyIntro)}
    <h2>${escapeHtml(ui.infoCollectTitle)}</h2>
    <h3>${escapeHtml(ui.infoProvidedTitle)}</h3>
    ${list(ui.infoProvidedList.map(escapeHtml))}
    <h3>${escapeHtml(ui.infoAutoTitle)}</h3>
    ${list(ui.infoAutoList.map(escapeHtml))}
    <h2>${escapeHtml(ui.howWeUseTitle)}</h2>
    ${list(ui.howWeUseList.map(escapeHtml))}
    <h2>${escapeHtml(ui.contactUsTitle)}</h2>
    ${p(ui.contactUsText)}
    ${list([link('/contact/', 'Contact page'), link('https://www.linkedin.com/in/leon-melamud', 'LinkedIn')])}`,
    markdown: `# ${ui.privacyPolicyTitle}

> ${ui.effectiveDate} · Canonical page: ${BASE_URL}privacy-policy/

## ${ui.privacyIntroTitle}

${ui.privacyIntro}

## ${ui.infoCollectTitle}

### ${ui.infoProvidedTitle}

${ui.infoProvidedList.map((i) => `- ${i}`).join('\n')}

### ${ui.infoAutoTitle}

${ui.infoAutoList.map((i) => `- ${i}`).join('\n')}

## ${ui.howWeUseTitle}

${ui.howWeUseList.map((i) => `- ${i}`).join('\n')}

## ${ui.contactUsTitle}

${ui.contactUsText} ${BASE_URL}contact/ or https://www.linkedin.com/in/leon-melamud

---
Site index: ${BASE_URL}llms.txt
`,
  },
  {
    path: 'terms-of-service',
    title: 'Terms of Service',
    description: `Terms of service of the ${SITE_NAME} knowledge base.`,
    image: SITE_CARD,
    body: `<h1>${escapeHtml(ui.termsOfServiceTitle ?? 'Terms of Service')}</h1>
    <h2>${escapeHtml(ui.tosAcceptanceTitle)}</h2>
    ${p(ui.tosAcceptanceText)}
    <h2>${escapeHtml(ui.tosPermittedTitle)}</h2>
    ${p(ui.tosPermittedText)}
    ${list(ui.tosPermittedList.map(escapeHtml))}
    <h2>${escapeHtml(ui.tosProhibitedTitle)}</h2>
    ${p(ui.tosProhibitedText)}
    ${list(ui.tosProhibitedList.map(escapeHtml))}
    <h2>${escapeHtml(ui.tosContactTitle)}</h2>
    ${p(ui.tosContactText)}
    ${list([link('/contact/', 'Contact page'), link('https://www.linkedin.com/in/leon-melamud', 'LinkedIn')])}`,
    markdown: `# ${ui.termsOfServiceTitle ?? 'Terms of Service'}

> Canonical page: ${BASE_URL}terms-of-service/

## ${ui.tosAcceptanceTitle}

${ui.tosAcceptanceText}

## ${ui.tosPermittedTitle}

${ui.tosPermittedText}

${ui.tosPermittedList.map((i) => `- ${i}`).join('\n')}

## ${ui.tosProhibitedTitle}

${ui.tosProhibitedText}

${ui.tosProhibitedList.map((i) => `- ${i}`).join('\n')}

## ${ui.tosContactTitle}

${ui.tosContactText} ${BASE_URL}contact/

---
Site index: ${BASE_URL}llms.txt
`,
  },
]

// The homepage is a route like any other: without this, dist/index.html keeps
// the empty shell and the site's most-fetched URL stays contentless.
export const home = {
  path: '',
  title: `${SITE_NAME} - The AI Knowledge Base`,
  titleIsFull: true,
  description:
    'A comprehensive bilingual guide to artificial intelligence: AI concepts, tools, hot news, token calculator and more. מדריך מקיף לבינה מלאכותית.',
  image: SITE_CARD,
  kind: 'home',
  body: homeBody(),
  markdown: homeMarkdown(),
}

export const routes = [
  ...concepts.map((s) => ({
    path: s.id,
    title: s.title,
    description: `${s.title} — AI concepts explained: ${names(s.items, 5)}.`,
    image: heroPath(s.id),
    kind: 'concepts',
    section: s,
    body: conceptBody(s),
    markdown: conceptMarkdown(s),
  })),
  ...tools.map((s) => ({
    path: s.id,
    title: s.title,
    description: `${s.title} — curated AI tools and resources: ${names(s.items, 6)}.`,
    image: heroPath(s.id),
    kind: 'tools',
    section: s,
    body: toolBody(s),
    markdown: toolMarkdown(s),
  })),
  ...staticPages().map((page) => ({ ...page, kind: 'page' })),
]

export const allRoutes = [home, ...routes]

// ---------------------------------------------------------------------------
// JSON-LD. Every block describes something that is actually on the page: the
// FAQ entries below are the same strings the body renders.
// ---------------------------------------------------------------------------

const breadcrumb = (route) => ({
  '@type': 'BreadcrumbList',
  '@id': `${BASE_URL}${route.path ? `${route.path}/` : ''}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE_NAME, item: BASE_URL },
    ...(route.path
      ? [{ '@type': 'ListItem', position: 2, name: route.title, item: `${BASE_URL}${route.path}/` }]
      : []),
  ],
})

const faqPage = (route, qs) => ({
  '@type': 'FAQPage',
  '@id': `${BASE_URL}${route.path ? `${route.path}/` : ''}#faq`,
  mainEntity: qs.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: { '@type': 'Answer', text: q.answer },
  })),
})

export function jsonLdFor(route) {
  const url = `${BASE_URL}${route.path ? `${route.path}/` : ''}`
  const graph = [
    {
      '@type': route.kind === 'page' || route.kind === 'home' ? 'WebPage' : 'CollectionPage',
      '@id': `${url}#webpage`,
      url,
      name: route.titleIsFull ? route.title : `${route.title} | ${SITE_NAME}`,
      description: route.description,
      inLanguage: 'en',
      isPartOf: { '@id': `${BASE_URL}#website` },
      about: { '@id': `${BASE_URL}#organization` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      primaryImageOfPage: `${BASE_URL}${route.image}`,
      encoding: {
        '@type': 'MediaObject',
        encodingFormat: 'text/markdown',
        contentUrl: `${BASE_URL}${route.path ? `${route.path}.md` : 'index.md'}`,
      },
    },
    breadcrumb(route),
  ]

  if (route.kind === 'home') {
    graph.push(faqPage(route, SITE_FAQ))
    // The feeds really are datasets, and the homepage is where an agent that
    // reads one page learns they exist.
    graph.push(
      {
        '@type': 'Dataset',
        '@id': `${BASE_URL}#concepts-dataset`,
        name: `${SITE_NAME} — AI concepts`,
        description: `${stats.concepts} artificial-intelligence concepts with plain-language definitions, as schema.org DefinedTerm records.`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        creator: { '@id': `${BASE_URL}#organization` },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/x-ndjson', contentUrl: `${BASE_URL}feeds/concepts.jsonl` },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${BASE_URL}feeds/concepts.json` },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${BASE_URL}#tools-dataset`,
        name: `${SITE_NAME} — curated AI tools`,
        description: `${stats.tools} curated AI tools and resources with vendor and purpose, as schema.org SoftwareApplication records.`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        creator: { '@id': `${BASE_URL}#organization` },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/x-ndjson', contentUrl: `${BASE_URL}feeds/tools.jsonl` },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${BASE_URL}feeds/tools.json` },
        ],
      },
    )
  }

  // What the organisation actually offers, priced honestly at zero. Terms and
  // the free-of-charge offer are the two things an agent most often needs to
  // establish before using content.
  if (route.kind === 'home') {
    graph.push({
      '@type': 'Service',
      '@id': `${BASE_URL}#service`,
      name: `${SITE_NAME} — AI knowledge base`,
      serviceType: 'Free AI knowledge base and reference',
      description: `Explanations of ${stats.concepts} artificial-intelligence concepts, a curated directory of ${stats.tools} AI tools, a daily AI news digest and a browser-side LLM token calculator. Bilingual (English and Hebrew), no account, no tracking.`,
      provider: { '@id': `${BASE_URL}#organization` },
      areaServed: 'Worldwide',
      availableLanguage: ['en', 'he'],
      isAccessibleForFree: true,
      termsOfService: `${BASE_URL}terms-of-service/`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        description: 'Free to read, quote and crawl. No account, no paid tier, no rate limit.',
        url: `${BASE_URL}pricing.md`,
      },
    })
  }

  // The calculator is a real application: free, browser-side, no upload.
  if (route.path === 'calculator') {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: 'Token Calculator',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any browser',
      url,
      description:
        'Counts the LLM tokens in any text using the js-tiktoken GPT-2 encoding. Runs entirely in the browser; the text is never uploaded.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: ['Token count for arbitrary text', 'Runs in the browser with no upload', 'WebMCP tool: count_tokens'],
      publisher: { '@id': `${BASE_URL}#organization` },
    })
  }

  if (route.kind === 'concepts') {
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${url}#terms`,
      name: route.title,
      description: route.description,
      inLanguage: 'en',
      hasDefinedTerm: route.section.items.map((item) => ({
        '@type': 'DefinedTerm',
        name: item.name,
        description: truncate(mdToText(item.shortDescription || item.fullDescription || ''), 300),
        inDefinedTermSet: { '@id': `${url}#terms` },
      })),
    })
    const qs = questionsOf(route.section)
    if (qs.length) graph.push(faqPage(route, qs))
  }

  if (route.kind === 'tools') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${url}#tools`,
      name: route.title,
      numberOfItems: route.section.items.length,
      itemListElement: route.section.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: item.name,
          applicationCategory: 'AI tool',
          description: truncate(mdToText(item.description || ''), 300),
          ...(item.url ? { url: item.url } : {}),
          ...(item.company ? { publisher: { '@type': 'Organization', name: item.company } } : {}),
        },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export const stats = {
  conceptSections: concepts.length,
  concepts: concepts.reduce((n, s) => n + s.items.length, 0),
  toolSections: tools.length,
  tools: tools.reduce((n, s) => n + s.items.length, 0),
}

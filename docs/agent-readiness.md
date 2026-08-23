# Agent readiness

What the site publishes for machines, why it is shaped that way, and what is
left. Written 2026-08-23, after the work that took ai-know.org from **35/100
(grade D) to 68/100 (grade C)** on the [orank](https://ora.ai) agent-readiness
scan. For how to *work* on the pipeline, see [AGENTS.md](../AGENTS.md).

## The problem that scored 35

The shipped HTML had **35 characters of body text and no `<h1>`**. The site
rendered entirely client-side, so anything that does not run JavaScript — an
AI agent fetching a URL, a crawler, a social scraper — got an empty shell with
good meta tags. Every content check failed for one reason.

The fix is prerendering (`scripts/prerender.mjs`), plus a second, explicitly
machine-shaped copy of the same content (`scripts/agent-surface.mjs`). Both are
generated from one route model, `scripts/lib/content.mjs`, derived from the YAML
in `client/data/` — a page and its markdown twin cannot drift because neither is
written by hand.

## What is published for agents

| Surface | Where | Purpose |
| --- | --- | --- |
| Prerendered HTML, per route | `dist/<route>/index.html` | Real content, one `<h1>`, `header`/`nav`/`main`/`footer` landmarks, per-route JSON-LD |
| Markdown twin of every page | `/<page>.md`, `/<page>/index.md`, `/<page>/llms.txt` | Same content without markup, YAML frontmatter (title, description, canonical, last-updated) |
| Site index for LLMs | `/llms.txt`, `/llms-full.txt` | Curated index (hand-written, in `public/`) and the whole knowledge base as one document |
| Scoped indexes | `/docs/llms.txt`, `/api/llms.txt` | Content half and programmatic half separately |
| Structured feeds | `/feeds/{concepts,tools,pages}.{json,jsonl}` | schema.org `DefinedTerm` / `SoftwareApplication` records — cheaper than crawling pages |
| Capability catalog | `/.well-known/ai-catalog.json` | AI Catalog (ARD) 1.0: `did:web:ai-know.org` host identity, `urn:air:` entry identifiers, per-entry trust manifest carrying the sha256 of the file that actually shipped |
| Identity | `/.well-known/did.json` | The did:web document the catalog's host identifier resolves to |
| Skill | `/skills/ai-know-lookup/SKILL.md`, `/.well-known/agent-skills/index.json` | Installable lookup skill, with a digest matching the file |
| API description | `/openapi.json`, `/.well-known/api-catalog` | The static GET surface described as an API (RFC 9727 linkset) |
| Access and cost | `/auth.md`, `/pricing.md` | Honest answers: no authentication exists, nothing costs anything |
| Instructions | `/agent-instructions.md` | One page telling an agent how to use the site |
| Crawl policy | `public/robots.txt` | 25 user-agent groups, all `Allow: /`, each with a `Content-Signal` line; `Sitemap:` and `schemamap:` |
| Schema feed map | `/schemamap.xml` | NLWeb-style feed discovery |
| In-page tools | `src/lib/webmcp.ts` | Four WebMCP tools (`count_tokens`, `search_ai_knowledge`, `list_ai_know_sections`, `get_ai_know_page`) registered on `navigator.modelContext` when a host provides it |

Trust pages exist for the same reason: `/about` and `/contact` are real routes,
and the privacy policy and terms are reachable from the footer of every page.

## Verifying a change

```bash
cd client
npm run build          # includes both postbuild generators
npm run verify:agents   # checks dist/ the way a scanner does
```

`scripts/verify-agent-surface.mjs` fails on the things that actually cost
points: a page under 500 characters of text, a missing `<h1>`, JSON-LD that
does not parse, a missing markdown twin or frontmatter key, a catalog entry
whose digest no longer matches its file, WebMCP registration lost from the
bundle. Run it before pushing anything that touches content or the pipeline.

To rescan the live site:

```bash
curl -s -X POST https://ora.ai/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"ai-know.org","force":true}'
```

**`force:true` matters.** Without it the API silently returns a cached result
(the response carries `servedFromCache` and `resultAgeSeconds`). The first
rescan after the first deploy reported no improvement purely because of a
48-minute-old cache entry.

## Score history

| Scan | Score | Discovery | Access | Usability | Payments |
| --- | --- | --- | --- | --- | --- |
| Before | 35 (D) | 0/13 | 26/59 | 4/49 | 0/0 |
| Prerender + machine surface | 51 | — | — | — | — |
| Spec conformance (ARD, frontmatter) | 65 | — | — | — | — |
| Pricing, when-to-use, service schema | 68 (C) | 8/35 | 50/84 | 19/158 | 0/16 |

Layer subtotals are as the scan reports them; the denominators grow as passing
one gate makes further checks applicable, so the fractions are not comparable
across rows.

## Deliberately not done

These would raise the score by claiming things that are not true. Do not add
them unless the capability actually ships:

- **A2A agent card** — there is no agent endpoint.
- **OAuth protected-resource / authorization-server metadata, `WWW-Authenticate`
  challenges** — nothing on the site is protected. `/auth.md` says so in the
  structure the spec asks for, which is the honest way to score the check.
- **MCP server card** — no MCP server exists yet (see below).
- **NLWeb `/ask`** — no query endpoint.
- **web-bot-auth signing directory** — no signed requests are issued.
- **A content licence** — the repository has no `LICENSE` file, so no licence is
  asserted anywhere. Adding one is a decision, not a fix.

## Not possible on GitHub Pages

Pages serves static files and cannot set response headers, so these checks are
unreachable without moving the hosting:

- `Accept`-negotiated markdown with a `Vary` header
- `Link` headers advertising alternates or the api-catalog
- Serving markdown to bot user agents, or a `?mode=agent` variant
- A correct `application/linkset+json` content type on `/.well-known/api-catalog`

Pages does serve `.md` as `text/markdown`, 301s `/path` to `/path/`, and returns
a real 404 status for unknown paths — the markdown-twin approach was chosen
because it works within those constraints.

## Next steps

Ranked by what they are worth, highest first.

1. **An MCP server for the site (~29 points).** The single biggest remaining
   lever, spread across the Usability layer. It needs a runtime host, which
   Pages is not — a Cloudflare Worker (or similar) at `mcp.ai-know.org`
   wrapping the existing `/feeds/*.json` would do it, then get advertised in
   `/.well-known/ai-catalog.json` and `/auth.md`. New surface plus DNS, so it is
   a deliberate decision, not a build change.
2. **A Wikipedia article and Wikidata entity (4 points)** for entity linking.
   External publishing; nothing to change here beyond adding `sameAs` links to
   the `Organization` block in `client/index.html` once they exist.
3. **Brand-search presence (3, plus 6 in a beta check).** "Guide to AI" is too
   generic to win its own search. This is a naming/marketing decision.
4. **Publish the lookup skill to skills.sh (3 points).** The skill and its
   digest index already ship; the listing is the missing half.
5. **A ChatGPT app directory listing (2 points).**
6. **Decide the training-crawler policy (1 point).** The last robots point
   requires blocking `CCBot` and `ByteSpider`. Doing so drops the site out of
   Common Crawl and contradicts what `/about` and the FAQ say about reuse — so
   it is a policy call, not an oversight. Currently everything is allowed.
7. **Add a `LICENSE` file** if the content is meant to be reusable, then state
   it in `openapi.json`, the skills index and `/pricing.md`.
8. **Sitemap `lastmod` churn.** `prerender.mjs` stamps every URL with the build
   date and the daily rebuild makes all of them claim daily changes. Deriving
   `lastmod` from content mtime would be more truthful — and now touches the
   markdown twins' `last-updated` frontmatter too, which is stamped the same way.

## Incidental finding worth remembering

The published privacy policy and terms advertised `privacy@` and `legal@` at
`ai-knowledge-guide.com` — a domain with no A record and no MX, so both
addresses had been dead since publication. They now point at `/contact`. If a
real mailbox is wanted, `ai-know.org` does have MX records.

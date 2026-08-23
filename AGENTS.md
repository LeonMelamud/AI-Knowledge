# AGENTS.md — working in this repository

Static bilingual (English/Hebrew) AI knowledge base published at
**https://ai-know.org** (GitHub Pages). React 19 + TypeScript + Vite 8 +
Tailwind 4 + react-router 7. Content is data, not components: it lives as YAML
and JSON under `client/data/`.

## Commands

Everything runs from `client/` — there is no root `package.json`.

```bash
cd client
npm ci
npm run dev      # vite dev server
npm run lint     # oxlint
npm run build    # tsc -b && vite build && postbuild (prerender + agent surface)
npm run preview  # serve dist/ exactly as GitHub Pages will
```

There is no test suite. `npm run build` is the gate: it type-checks, bundles,
and then regenerates every derived file. Run it before proposing a change.

## Layout

```
client/data/            content — edit here, not in components
  concepts_{en,he}.yaml   explained AI concepts (sections → items)
  links_{en,he}.yaml      curated tool directory (sections → items)
  news_{en,he}.yaml       AI news digest (regenerated daily)
  ui_translations_{en,he}.json   every UI string, both languages
client/src/             app: pages/, components/, lib/ (data.ts, i18n.tsx, webmcp.ts)
client/public/          served verbatim: robots.txt, llms.txt, skills/, images/
client/scripts/         build pipeline (see below)
.github/workflows/      static.yml deploys on push to main + daily
```

## The build pipeline

`npm run build` ends with two postbuild scripts, both fed by
`client/scripts/lib/content.mjs` — the single route model derived from the YAML:

- `prerender.mjs` writes real HTML for every route: per-route title/description/
  OG/canonical, per-route JSON-LD, and the page's content inside `#root`.
  Without it the shipped HTML has ~35 characters of body text, because the app
  renders client-side; crawlers and AI agents see the prerendered copy and
  browsers replace it on load.
- `agent-surface.mjs` writes the machine-readable half: markdown twin of every
  page (`/<page>.md`), `llms-full.txt`, JSONL schema.org feeds, `schemamap.xml`,
  `/.well-known/ai-catalog.json`, the agent-skills index, `/.well-known/api-catalog`
  and `openapi.json`.

**If you add or rename a route, change it in three places**: `client/src/App.tsx`
(the SPA route), `client/scripts/lib/content.mjs` (title, description, body and
markdown), and `client/public/llms.txt` (the curated index). The sitemap, feeds
and catalogs follow automatically.

## Conventions

- **Content in data files.** New concepts and tools are YAML entries. Both the
  `_en` and `_he` file get the entry — `scripts/check-content-parity.py` checks
  the two languages line up.
- **UI strings go through i18n.** `t('key')` / `tList('key')` from
  `src/lib/i18n.tsx`, with the key added to both `ui_translations_*.json`. Never
  hardcode user-visible English in a component.
- **RTL is real.** Hebrew is the default language and sets `dir="rtl"` on
  `<html>`. Use logical Tailwind utilities (`ps-`/`pe-`, `ms-`/`me-`), not
  `pl-`/`pr-`.
- **No runtime data fetching** beyond `public/data/*.json`. YAML is imported at
  build time via `@rollup/plugin-yaml` and typed in `src/lib/data.ts`.
- **Markdown content is rendered through `components/Markdown.tsx`** (escapes
  HTML). Never introduce `dangerouslySetInnerHTML`.
- **External links** carry `target="_blank" rel="noreferrer"`.
- Comments explain constraints, not mechanics. Match the surrounding density.

## Things that will bite you

- The prerendered body lives inside `#root` and is replaced by
  `createRoot().render()`, not hydrated. Do not add `hydrateRoot` — the
  prerendered markup is deliberately not a React tree.
- `client/public/` files are copied verbatim: a change to `robots.txt` or
  `llms.txt` ships to production as written.
- Pushing to `main` deploys. `.github/workflows/static.yml` also rebuilds daily,
  so an unmerged local fix does not stop yesterday's content from redeploying.
- The site is served from a custom domain at the root (`vite.config.ts` sets
  `base: '/'`); relative asset paths break on GitHub's `*.github.io/repo` URL by
  design.
- Content is agent-facing on purpose. When you change a page's meaning, the
  markdown twin and feeds regenerate automatically — but the hand-curated
  `llms.txt` summary does not.

## Definition of done

`npm run lint` clean, `npm run build` green, and — for anything touching content
or the pipeline — a spot check of `dist/`: the page has an `<h1>` and real body
text, its `.md` twin exists, and every `<script type="application/ld+json">`
block parses.

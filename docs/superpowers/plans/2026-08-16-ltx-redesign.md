# LTX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ai-know.org's visual system in the ltx.io idiom — cool-grey/ink tokens, two-axis navigation, generated per-route imagery, and a non-blocking video motion layer — without touching content or the deploy topology.

**Architecture:** The site stays a static Vite/React 19 SPA prerendered to GitHub Pages. Work proceeds foundation-up: tokens and fonts first (everything downstream depends on them), then navigation, then the page-level sweep, then generated media, then verification. Media generation is deliberately late so no credits are spent until the layout that consumes them is proven.

**Tech Stack:** Vite 8, React 19, React Router 7, Tailwind 4 (CSS-first `@theme`), TypeScript, oxlint, Magnific MCP (imagery), HyperFrames (video), Playwright (verification).

**Spec:** `docs/superpowers/specs/2026-08-16-ltx-redesign-design.md`

## Global Constraints

- Canvas `#E7E8EB`, surface `#DFE1E5`, ink `#0B0B0B`, ink-muted `#4A4D52`, ink-faint `#6E7178`, hairline `#C9CBD0`. **No accent colour.**
- `border-radius: 0` everywhere.
- `--ink-faint` never carries body copy — text ≥18.66px, or ≥14px bold, only.
- **RTL:** no `text-transform: uppercase` and no negative `letter-spacing` under `[dir="rtl"]`. All directional CSS uses logical properties (`inline-start`/`inline-end`/`padding-inline`/`margin-block`).
- All content in `client/data/*.yaml` is **untouched**.
- The `schema.org` JSON-LD block in `client/index.html` survives **verbatim**; the regenerated `og-image.png` keeps that filename and 1200×630.
- No generated image contains text of any kind.
- Every animation is guarded by `prefers-reduced-motion: reduce`.
- Video stings are decorative overlays that **never** gate navigation.
- Magnific spend ceiling: **5,000 credits**.
- Push to `main` is production. No push without explicit user approval.

---

### Task 1: Design tokens and self-hosted fonts

**Files:**
- Create: `client/public/fonts/` (woff2 assets)
- Modify: `client/src/index.css` (full rewrite of theme block)
- Modify: `client/index.html:6-12` (remove Google Fonts link, fix `theme-color`)

**Interfaces:**
- Produces: CSS custom properties `--canvas`, `--surface`, `--surface-raised`, `--ink`, `--ink-muted`, `--ink-faint`, `--hairline`, `--announce`; Tailwind theme keys `bg-canvas`, `text-ink`, `border-hairline`; utility classes `.display-xl`, `.display-l`, `.label`.

- [ ] **Step 1: Download fonts and verify Hebrew coverage**

General Sans (Latin) must NOT contain Hebrew; Assistant must. Verify the cmap rather than assuming:

```bash
cd client && mkdir -p public/fonts
# Assistant (Hebrew + Latin) from Google Fonts
curl -sL "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&display=swap" \
  -H "User-Agent: Mozilla/5.0 Chrome/120" -o /tmp/assistant.css
grep -o 'https://[^)]*\.woff2' /tmp/assistant.css | sort -u
```

Then assert coverage with fontkit or a Python check. Expected: Assistant covers `U+05D0` (א); General Sans does not.

- [ ] **Step 2: Write the token block**

Replace the `@theme` block in `client/src/index.css`:

```css
@import 'tailwindcss';

@theme {
  --color-canvas: #E7E8EB;
  --color-surface: #DFE1E5;
  --color-surface-raised: #F2F3F5;
  --color-ink: #0B0B0B;
  --color-ink-muted: #4A4D52;
  --color-ink-faint: #6E7178;
  --color-hairline: #C9CBD0;
  --color-announce: #111214;
  --font-sans: 'General Sans', 'Assistant', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --radius-none: 0;
}
```

- [ ] **Step 3: Add type utilities and RTL guards**

```css
.display-xl { font-size: clamp(2.75rem, 7vw, 4.5rem); font-weight: 600;
              letter-spacing: -0.033em; line-height: 1.0; }
.display-l  { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 600;
              letter-spacing: -0.028em; line-height: 1.05; }
.label      { font-size: 0.75rem; font-weight: 500; letter-spacing: 0.12em;
              text-transform: uppercase; line-height: 1; }

[dir="rtl"] .label { text-transform: none; letter-spacing: 0.04em; }
[dir="rtl"] .display-xl, [dir="rtl"] .display-l { letter-spacing: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Delete `.paper-backdrop` and restyle markdown**

Remove the `.paper-backdrop` rules entirely (warm-paper artifact). Convert `.markdown` rules from `--color-stone-*` / `--color-orange-*` to the new tokens.

- [ ] **Step 5: Verify build**

Run: `cd client && npm run build`
Expected: exits 0, no TS errors, no unresolved Tailwind classes.

- [ ] **Step 6: Commit**

```bash
git add client/src/index.css client/index.html client/public/fonts
git commit -m "feat(design): LTX grey/ink token system and self-hosted fonts"
```

---

### Task 2: MegaNav — horizontal bar + vertical panel + mobile overlay

**Files:**
- Create: `client/src/components/MegaNav.tsx`
- Modify: `client/src/components/Layout.tsx` (replace inline nav)

**Interfaces:**
- Consumes: `getConcepts(lang)`, `getTools(lang)` from `../lib/data`; `useI18n()` from `../lib/i18n`.
- Produces: `export default function MegaNav(): JSX.Element`.

- [ ] **Step 1: Build the horizontal bar**

Sticky header, `bg-canvas/85 backdrop-blur-md`, bottom hairline. Wordmark at `inline-start`; category buttons `KNOWLEDGE`/`TOOLS` (panel triggers) and `NEWS`/`CALCULATOR` (direct routes) using `.label`; language toggle at `inline-end`.

- [ ] **Step 2: Build the vertical panel**

Full-bleed, `bg-surface`, bottom hairline, no shadow, no radius. Inner grid constrained to `max-w-[1280px]`, two columns of vertically stacked links under `.label` group headings. Animate with `grid-template-rows: 0fr → 1fr`.

- [ ] **Step 3: Wire accessibility**

`aria-expanded` + `aria-controls` on triggers; `role="group"` + `aria-labelledby` on the panel; `Escape` closes and restores focus to the trigger; backdrop click closes; chevron rotates 180°. Open on **click**, never hover.

- [ ] **Step 4: Build the mobile overlay**

Below `1024px`, collapse to a menu button opening a full-screen `bg-canvas` overlay with every group stacked vertically. Lock body scroll while open.

- [ ] **Step 5: Verify**

Run `npm run dev`; confirm panel opens/closes by click, Escape, and backdrop; confirm the panel sits on the correct side in both `dir` values; confirm no horizontal scroll at 390px.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/MegaNav.tsx client/src/components/Layout.tsx
git commit -m "feat(nav): two-axis MegaNav with vertical mega-panel and mobile overlay"
```

---

### Task 3: SectionRail — vertical numbered index

**Files:**
- Create: `client/src/components/SectionRail.tsx`
- Modify: `client/src/pages/SectionPage.tsx` (mount the rail)

**Interfaces:**
- Consumes: `ConceptItem[]` / `ToolItem[]` from `../lib/data` — note these carry `name` but **no `id`**, so the rail derives anchor ids itself.
- Produces: `export default function SectionRail({ items }: { items: RailItem[] }): JSX.Element | null`; `export interface RailItem { id: string; name: string }`; `export function slugify(name: string): string`.

`slugify` must produce the same id the section body uses for its anchor targets,
and must handle Hebrew (which survives `encodeURIComponent` but not an
ASCII-only regex). Use:

```ts
export const slugify = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '')
```

The `\p{L}` unicode property escape keeps Hebrew letters; an ASCII `[^a-z0-9-]`
class would erase every Hebrew heading id and silently break the rail in the
default language.

- [ ] **Step 1: Render the numbered list**

Sticky at `top: 96px`, positioned `inline-end`. Numbers zero-padded (`01`, `02`) in `--font-mono` / `text-ink-faint`; labels `text-ink-muted`. Entries are `<a href="#id">` so it degrades to a plain TOC without JS.

- [ ] **Step 2: Add scroll-spy**

`IntersectionObserver` with `rootMargin: '-96px 0px -60% 0px'`. Active entry goes `text-ink` and gains a 1px `inline-start` marker rule.

- [ ] **Step 3: Hide below 1280px**

`hidden xl:block`. The rail is progressive enhancement — never the only path to content.

- [ ] **Step 4: Verify**

Confirm the rail renders right in RTL and left in LTR, that the active entry tracks scroll, and that it disappears below 1280px.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/SectionRail.tsx client/src/pages/SectionPage.tsx
git commit -m "feat(nav): vertical numbered section rail with scroll-spy"
```

---

### Task 4: Token sweep across all pages and components

**Files:**
- Modify: `client/src/pages/SectionPage.tsx`, `client/src/pages/HotNews.tsx`, `client/src/pages/Calculator.tsx`, `client/src/pages/Legal.tsx`
- Modify: `client/src/components/QAList.tsx`, `client/src/components/RSSFeed.tsx`, `client/src/components/Markdown.tsx`

- [ ] **Step 1: Enumerate every legacy token**

```bash
cd client && grep -rnoE '(stone|orange|amber)-[0-9]{2,3}' src/ | sort | uniq -c | sort -rn
```

This is the authoritative to-do list. Every hit must be gone at the end.

- [ ] **Step 2: Convert each file**

Mapping: `stone-900`/`stone-950` → `ink`; `stone-700`/`stone-600` → `ink-muted`; `stone-400`/`stone-500` → `ink-faint`; `stone-200`/`stone-300` → `hairline`; `stone-50`/`stone-100`/white → `surface-raised`; every `orange-*` → `ink` (no accent colour). Strip every `rounded-*` class.

- [ ] **Step 3: Verify zero leftovers**

Run the Step 1 grep again. Expected: **no output**.

- [ ] **Step 4: Build and commit**

```bash
cd client && npm run build && npm run lint
git add client/src && git commit -m "refactor(design): sweep stone/orange tokens to grey/ink system"
```

---

### Task 5: Metadata, JSON-LD preservation, and per-route og:image

**Files:**
- Modify: `client/index.html`
- Modify: `client/scripts/prerender.mjs:40-55`

- [ ] **Step 1: Update head metadata**

`theme-color` `#9A3412` → `#E7E8EB`. Remove the Google Fonts `<link>` pair (fonts are self-hosted now). **Leave the `application/ld+json` block byte-for-byte unchanged.**

- [ ] **Step 2: Add per-route og:image to the prerenderer**

Extend each route object with `image`, then inject:

```js
.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${BASE_URL}${route.image}$2`)
.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${BASE_URL}${route.image}$2`)
```

- [ ] **Step 3: Verify**

```bash
cd client && npm run build
grep -o 'og:image[^>]*' dist/ai-basics/index.html
grep -c 'application/ld+json' dist/index.html   # expect 1
```

- [ ] **Step 4: Commit**

```bash
git add client/index.html client/scripts/prerender.mjs
git commit -m "feat(seo): per-route og:image, LTX theme-color, JSON-LD preserved"
```

---

### Task 6: Generate the 16-image style family

**Files:**
- Create: `client/src/lib/heroes.ts`
- Create: `client/public/images/heroes/` (generated assets)

**Interfaces:**
- Produces: `export const HEROES: Record<string, { src: string; alt: string }>` keyed by route id.

**Budget ceiling: 5,000 credits. Nothing here runs before Tasks 1–5 are green.**

- [ ] **Step 1: Generate two style anchors**

Model `seedream-5-pro`, 16:9, 2k, 100cr each. Prompt encodes the family: abstract macro photography of physical structure, soft directional studio light, shallow depth of field, muted palette, background value near `#E7E8EB`, **no text, no people, no robots, no circuit boards**. Pick one.

- [ ] **Step 2: Draft all 16 against the anchor**

Model `recraft-v4-1` (60cr), 2 variants per route = 32 generations ≈ 1,920cr. Pass the chosen anchor as a `style` reference so the set reads as one family. Subjects and hues per spec §6.3.

- [ ] **Step 3: Finalise 16**

Model `seedream-5-pro` @2k (100cr) × 16 ≈ 1,600cr, using the approved draft composition plus the style anchor.

- [ ] **Step 4: Regenerate the social card**

One 1200×630 image → `client/public/og-image.png`. **Same filename and dimensions** so the JSON-LD stays valid.

- [ ] **Step 5: Encode to AVIF/WebP**

Widths 640/1280/1920, AVIF primary + WebP fallback. Target ≤1.6MB total.

- [ ] **Step 6: Report actual spend**

Call `account_balance` before and after; report credits actually consumed against the 5,000 ceiling.

- [ ] **Step 7: Commit**

```bash
git add client/public/images/heroes client/public/og-image.png client/src/lib/heroes.ts
git commit -m "feat(media): 16-route hero image family and regenerated social card"
```

---

### Task 7: SectionHero — full-bleed imagery

**Files:**
- Create: `client/src/components/SectionHero.tsx`
- Modify: `client/src/pages/SectionPage.tsx`, `client/src/pages/HotNews.tsx`, `client/src/pages/Calculator.tsx`

**Interfaces:**
- Consumes: `HEROES` from `../lib/heroes`.
- Produces: `export default function SectionHero({ routeId, title }: { routeId: string; title: string }): JSX.Element`.

- [ ] **Step 1: Build the component**

`<picture>` with AVIF + WebP sources, `srcset` at 640/1280/1920, explicit `width`/`height` to reserve layout space, `loading="lazy" decoding="async"` for anything below the fold. Display title overlaid using `.display-xl`.

- [ ] **Step 2: Verify CLS**

Confirm no layout shift on load — every image has intrinsic dimensions.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/SectionHero.tsx client/src/pages
git commit -m "feat(design): full-bleed section heroes"
```

---

### Task 8: Motion layer — hero loop, stings, non-blocking overlay

**Files:**
- Create: `client/src/components/TransitionSting.tsx`
- Create: `client/public/video/`
- Modify: `client/src/components/Layout.tsx`

**Interfaces:**
- Produces: `export default function TransitionSting(): JSX.Element | null` — mounted once in `Layout`, listens to `useLocation()`.

- [ ] **Step 0: Add the View Transitions route crossfade** (spec §5.1)

Feature-detect; never assume support. In `Layout.tsx`:

```ts
// React Router does not wrap navigation in a view transition on its own.
const navigate = useNavigate()
const go = (to: string) => {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigate(to); return
  }
  document.startViewTransition(() => flushSync(() => navigate(to)))
}
```

Paired CSS:

```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 180ms; }
```

Browsers without `startViewTransition` (Firefox, older Safari) fall through to a
plain navigate — no polyfill, no error.

- [ ] **Step 1: Render the HyperFrames assets**

Hero loop: 1920×1080, ~6s seamless, poster = first frame. Stings: 16 × ≤700ms, ≤1280×720. Encode with `-g 1 -keyint_min 1` so seeking is exact. WebM/VP9 primary + MP4/H.264 fallback. Budget: hero ≤1.5MB, stings ≤2MB combined.

- [ ] **Step 2: Implement the non-blocking contract**

`position: fixed`, `pointer-events: none`, rendered **above** already-mounted content. Route content mounts and is interactive immediately. Any load/decode failure is swallowed — navigation never waits.

- [ ] **Step 3: Implement the skip conditions**

Skip entirely when `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, or `effectiveType` is `2g`/`slow-2g`. Never play on first load — navigation only. Fetch at idle via `requestIdleCallback`.

- [ ] **Step 4: Verify with video blocked**

Block video requests in DevTools and navigate every route. Expected: navigation completely unaffected, no console errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TransitionSting.tsx client/public/video client/src/components/Layout.tsx
git commit -m "feat(motion): hero loop and non-blocking per-section transition stings"
```

---

### Task 9: Full verification pass

- [ ] **Step 1: Build clean**

```bash
cd client && npm run build && npm run lint
```
Expected: both exit 0.

- [ ] **Step 2: Playwright matrix**

Against `npm run preview`, assert for **both** languages:
- Mega-panel opens, closes on Escape, closes on backdrop, `aria-expanded` tracks state
- Rail renders `inline-end` (right in RTL, left in LTR)
- Mobile overlay works at 390px
- No horizontal body scroll at 390 / 768 / 1440

- [ ] **Step 3: Screenshot all 16 routes × 2 languages**

Review each for surviving stone/orange and for broken Hebrew glyphs (the font-fallback failure mode).

- [ ] **Step 4: Console check**

Zero errors on every route.

- [ ] **Step 5: Lighthouse**

Performance ≥90 and Accessibility ≥90 on the built preview.

- [ ] **Step 6: Structured data**

Validate the JSON-LD still parses and still declares `og-image.png` at 1200×630.

- [ ] **Step 7: Commit any fixes**

---

### Task 10: Deploy gate

- [ ] **Step 1: Report results**

Present Task 9's findings — including anything that failed — plus actual credit spend.

- [ ] **Step 2: Ask for approval**

`static.yml` deploys on push to `main`; **there is no staging**. Pushing publishes. Ask explicitly. Do not push as a side effect of finishing.

- [ ] **Step 3: On approval, push and watch**

```bash
git push origin main
gh run watch
```

- [ ] **Step 4: Verify production**

Load `https://ai-know.org/ai-basics` and confirm the redesign is live in both languages.

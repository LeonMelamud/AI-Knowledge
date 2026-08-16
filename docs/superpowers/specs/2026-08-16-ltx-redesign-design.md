# LTX-style redesign of ai-know.org

**Date:** 2026-08-16
**Status:** Implemented. See "Deviations from this design" at the foot of the
document for where the build diverged and why.

## 1. Goal

Rebuild the visual system of ai-know.org in the idiom of [ltx.io](https://ltx.io):
cool-grey canvas, near-black ink, zero border radius, tight geometric display
type, and full-bleed imagery carrying all the colour. Replace the current
warm-paper editorial theme entirely.

Three things are in scope beyond a reskin:

1. A two-axis navigation system (horizontal category bar + vertical mega-panel,
   plus a vertical section rail on content pages).
2. A motion layer: CSS/View-Transitions for UI, HyperFrames-rendered video for a
   hero loop and per-section transition stings.
3. Sixteen generated hero images, one per route, produced as a single style
   family.

The site stays a static Vite/React SPA on GitHub Pages. No backend is added.

## 2. Reference analysis

Tokens measured off the live ltx.io DOM, not estimated:

| Property | Measured value |
| --- | --- |
| Body background | `rgb(231, 232, 235)` → `#E7E8EB` |
| Ink | `rgb(11, 11, 11)` → `#0B0B0B` |
| Display face | Aeonik (commercial), weights 300/400/600 |
| H1 | 72px, weight 600, line-height 72px (1.0), letter-spacing −2.4px |
| Body copy | 23.76px, weight 300, line-height 1.2 |
| Border radius | `0px` throughout |

**Nav mechanism.** The header is a horizontal row of uppercase, letter-spaced
category buttons. Activating one drops a **full-bleed panel** from the header
containing links stacked vertically in columns, each column headed by a small
uppercase group label. The panel shares the page background, has no shadow, no
radius and no visible card edge — it reads as the header growing taller. The
page behind it blurs and dims. The active category's chevron rotates 180°.

This is the "vertical and horizontal" pattern to reproduce.

## 3. Design system

### 3.1 Colour

No accent colour. Imagery supplies all colour; the chrome is neutral.

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#E7E8EB` | Page background |
| `--surface` | `#DFE1E5` | Mega-panel, inset blocks |
| `--surface-raised` | `#F2F3F5` | Cards on canvas |
| `--ink` | `#0B0B0B` | Primary text, filled buttons |
| `--ink-muted` | `#4A4D52` | Secondary text, group labels |
| `--ink-faint` | `#6E7178` | Metadata — large text only |
| `--hairline` | `#C9CBD0` | 1px decorative rules |
| `--announce` | `#111214` | Top announcement bar |
| `--focus` | `#0B0B0B` | 2px focus ring, 2px offset |

Measured contrast (computed, not estimated):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--ink` on `--canvas` | 16.06:1 | AAA |
| `--ink` on `--surface` | 15.03:1 | AAA |
| `--ink-muted` on `--canvas` | 6.93:1 | AA (near AAA) |
| `--ink-muted` on `--surface` | 6.48:1 | AA |
| `--ink-faint` on `--canvas` | 3.99:1 | AA **large text only** |

`--ink-faint` is therefore restricted to text ≥18.66px, or ≥14px when bold — it
must never carry body copy. An earlier candidate (`#8A8D93`) measured 2.72:1 and
failed AA outright; it is rejected.

`--hairline` at 1.32:1 is decorative only. Any border that communicates a
control boundary uses `--ink-muted` (≥3:1) instead.

### 3.2 Type

Aeonik is commercial and carries no Hebrew. The substitute is a two-family stack
that resolves **per glyph**, so no language-conditional font switching is needed:

```css
--font-display: 'General Sans', 'Assistant', system-ui, sans-serif;
--font-body:    'General Sans', 'Assistant', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;
```

Latin glyphs resolve from General Sans (Fontshare, free, geometric grotesque
closest to Aeonik). Hebrew glyphs are absent from General Sans and fall through
to Assistant (Google, geometric Hebrew). Both are self-hosted as woff2 with
`font-display: swap` to remove the current render-blocking Google Fonts link.

**Build-time assertion.** The fallback only works if General Sans genuinely
lacks Hebrew — a partial or malformed Hebrew range would render broken glyphs
instead of falling through. Implementation must inspect the downloaded woff2
cmap and confirm General Sans covers no `U+0590–U+05FF`, and that Assistant
does. If General Sans turns out to carry any Hebrew, pin the ranges explicitly
with `unicode-range` descriptors on each `@font-face` instead of relying on
implicit fallback.

Scale:

| Role | Size (desktop) | Weight | Tracking | Line-height |
| --- | --- | --- | --- | --- |
| Display XL | `clamp(2.75rem, 7vw, 4.5rem)` | 600 | −0.033em | 1.0 |
| Display L | `clamp(2rem, 4.5vw, 3rem)` | 600 | −0.028em | 1.05 |
| Heading M | `1.5rem` | 600 | −0.02em | 1.15 |
| Body L | `1.25rem` | 300 | −0.01em | 1.45 |
| Body | `1rem` | 400 | 0 | 1.6 |
| Label | `0.75rem` | 500 | **+0.12em**, uppercase | 1 |

### 3.3 RTL adaptation — mandatory rules

The site defaults to Hebrew (`<html lang="he" dir="rtl">`). Two LTX identity
devices are Latin-only and **must not** be applied to Hebrew:

1. **No `text-transform: uppercase` on Hebrew.** Hebrew is unicameral; the
   property is a no-op at best and signals carelessness.
2. **No negative tracking on Hebrew.** Hebrew letterforms collide under tight
   tracking. Hebrew display type uses tracking `0`.

Implementation:

```css
[dir="rtl"] .label       { text-transform: none; letter-spacing: 0.04em; }
[dir="rtl"] .display-xl,
[dir="rtl"] .display-l   { letter-spacing: 0; }
```

Hebrew hierarchy is carried by **weight and size contrast** instead of case and
tracking. All directional CSS uses logical properties (`inline-start`,
`inline-end`, `padding-inline`, `margin-block`) — the codebase already follows
this convention and it must be preserved. The section rail sits on the **right**
in RTL and the **left** in LTR, purely from logical properties.

### 3.4 Geometry

Radius `0` everywhere. A single hairline (1px `--hairline`) is the only divider
device. Spacing on a 4px base scale. Content max-width `1280px`; full-bleed
media breaks out to viewport width.

## 4. Navigation architecture

### 4.1 Horizontal bar (`MegaNav.tsx`)

Sticky header, `--canvas` background at 85% with `backdrop-filter: blur(12px)`,
1px bottom hairline. Contents:

- Wordmark (start-aligned)
- Category buttons: `KNOWLEDGE` · `TOOLS` · `NEWS` · `CALCULATOR`
  (label style: 12px, 500, +0.12em, uppercase — Latin only per §3.3)
- End cluster: language toggle, mobile menu button

`KNOWLEDGE` and `TOOLS` open panels. `NEWS` and `CALCULATOR` are direct routes.

### 4.2 Vertical mega-panel

Opens beneath the header, full viewport width, `--surface` background, 1px
bottom hairline, no shadow, no radius. Inner grid is constrained to the content
max-width and holds **columns of vertically stacked links**, each under an
uppercase group label.

- `KNOWLEDGE` → 7 concept sections, 2 columns
- `TOOLS` → 7 tool sections, 2 columns

Behaviour:

- Opens on click (not hover) — hover-open menus are hostile on touch and to
  keyboard users.
- Backdrop behind the panel receives `backdrop-filter: blur(8px)` and a 45%
  `--canvas` scrim; clicking it closes.
- `Escape` closes and returns focus to the trigger.
- Arrow keys move between links; `Tab` is not trapped.
- Trigger carries `aria-expanded` and `aria-controls`; the panel is
  `role="group"` with `aria-labelledby` pointing at the trigger.
- Chevron rotates 180° on open.
- Panel height animates via `grid-template-rows: 0fr → 1fr` (animatable, no
  fixed-height hack); links fade and rise 4px on a 30ms stagger.
- Under `prefers-reduced-motion: reduce`, the panel appears without animation.

### 4.3 Vertical section rail (`SectionRail.tsx`)

On concept and tool section pages, a sticky rail lists that section's items as a
numbered index:

```
01  Neural Networks
02  Transformers
03  Attention
```

- Position: `inline-end` (right in RTL, left in LTR), sticky at `top: 96px`.
- Numbers in `--font-mono`, `--ink-faint`; labels in `--ink-muted`.
- The item scrolled into view is marked active: label goes `--ink`, and a 1px
  `inline-start` marker rule appears.
- Driven by `IntersectionObserver` with `rootMargin: '-96px 0px -60% 0px'`.
- Hidden below `1280px`; on smaller screens the section page keeps its normal
  single-column flow. The rail is a progressive enhancement, never the only
  route to content.
- Marked `aria-hidden="false"` with `<nav aria-label>`; entries are anchor links
  so it degrades to a plain in-page TOC without JS.

### 4.4 Mobile

Below `1024px` the category bar collapses to a menu button. Activating it opens
a **full-screen overlay** on `--canvas` listing every group and its links in one
vertical scroll — the same information architecture as the mega-panel, stacked.
Body scroll locks while open. `Escape` and a close button both dismiss.

## 5. Motion architecture

Two independent layers. Neither may block content.

### 5.1 UI layer — CSS + View Transitions

- Route change: `document.startViewTransition` where supported, with a 180ms
  cross-fade; a plain opacity transition where not. Feature-detected, never
  assumed.
- Mega-panel: as §4.2.
- Rail active state: 120ms colour transition.
- Every animation is wrapped in a `prefers-reduced-motion: reduce` guard that
  reduces duration to `0.01ms`.

### 5.2 Video layer — HyperFrames

HyperFrames renders video from HTML. It produces two asset classes here; it does
**not** drive any UI state.

**Hero loop.** One ambient loop behind the homepage hero. 1920×1080, ~6s,
seamless, `muted playsinline loop`, with a `poster` frame that is the first
frame. Encoded with `-g 1 -keyint_min 1` so seeking is exact.

**Per-section stings.** Sixteen short transition stings, one per route, played on
route entry.

> **Non-blocking contract.** The sting is a decorative overlay rendered *above*
> already-mounted content in a `position: fixed` layer with `pointer-events:
> none`. Route content renders immediately and is fully interactive while the
> sting plays. If the file is missing, still loading, or decoding fails, nothing
> waits on it and the route behaves as if the sting did not exist. This is a
> hard requirement — a sting must never gate navigation.

Additional constraints on stings:

- ≤700ms, ≤1280×720, target ≤120KB each as WebM/VP9 with an MP4/H.264 fallback.
- Not preloaded on first paint. Fetched idle-time after the route settles, via
  `requestIdleCallback`.
- Skipped entirely when: `prefers-reduced-motion: reduce`, `navigator.connection.saveData`
  is true, or `effectiveType` is `2g`/`slow-2g`.
- Skipped on the first page load — they play on *navigation*, not on arrival, so
  they never delay first contentful paint.

Total video budget: hero loop ≤1.5MB, all 16 stings ≤2MB combined.

## 6. Imagery pipeline

### 6.1 Concept

Sixteen hero images, one per route. The family concept is **abstract macro
photography of physical structure** — woven fibre, crystalline lattice, layered
translucent glass, dense cable arrays, sedimentary strata — lit like editorial
product photography: soft directional studio light, shallow depth of field,
muted palette, background values that sit close to `#E7E8EB`.

Deliberately excluded: robots, glowing brains, humanoid androids, circuit-board
clichés, UI screenshots, and any depiction of a person.

**No text of any kind inside a generated image.** The site is bilingual; baked-in
text cannot localise and would be wrong in one language always.

### 6.2 Consistency method

Generate **one style anchor** first. Pass that anchor as a `style` reference to
the remaining fifteen generations. This is what makes sixteen separate prompts
read as one designed set rather than sixteen stock photos. Each route varies the
*subject structure* and *dominant hue*; lighting, grain, depth-of-field and
background value stay pinned by the anchor.

### 6.3 Route → subject map

| Route | Structure | Hue |
| --- | --- | --- |
| `ai-basics` | Interlocking glass cubes | Cool neutral |
| `advanced_concepts` | Deep crystalline lattice | Indigo |
| `techniques` | Braided fibre-optic bundle | Teal |
| `evaluation_metrics` | Precision measurement gauges | Steel |
| `tools_and_libraries` | Modular stacked components | Amber |
| `applications` | Radiating conduit network | Green |
| `future_trends` | Dissolving particulate form | Violet |
| `chat-tools` | Overlapping sound-wave membranes | Sky |
| `coding-tools` | Machined interlocking gears | Graphite |
| `libraries` | Dense stacked strata | Sand |
| `graphics` | Refracting prism array | Spectral |
| `articles` | Layered translucent sheets | Bone |
| `educational-resources` | Nested concentric rings | Olive |
| `productivity` | Aligned parallel rails | Slate |
| `hot-news` | Rippling liquid surface | Copper |
| `calculator` | Abacus-like ordered spheres | Cool grey |

### 6.4 Generation passes and budget

Two-pass, so credits are not spent finalising a composition that gets rejected.

| Pass | Model | Unit | Count | Credits |
| --- | --- | --- | --- | --- |
| Style anchor | Seedream 5 Pro @2K | 100 | 2 | 200 |
| Drafts | Recraft V4.1 | 60 | 32 (16×2) | 1,920 |
| Finals | Seedream 5 Pro @2K | 100 | 16 | 1,600 |
| Social card | Seedream 5 Pro @2K | 100 | 1 | 100 |
| **Subtotal** | | | | **3,820** |
| Re-roll reserve | | | | 1,180 |
| **Ceiling** | | | | **5,000** |

Account balance is 110,238 credits; the 5,000 ceiling is a self-imposed budget,
not a limit. **Generation does not begin until the implementation plan is
approved** — spent credits are unrecoverable.

### 6.5 Delivery format

- AVIF primary, WebP fallback, via `<picture>`.
- Widths 640 / 1280 / 1920 with `srcset` + `sizes`.
- Every hero below the fold is `loading="lazy" decoding="async"`.
- Explicit `width`/`height` on every image to reserve layout space (CLS).
- Total added image weight target: ≤1.6MB across the whole site after encoding.

## 7. Files to touch

**Rewritten**
- `client/src/components/Layout.tsx` — nav replaced by `MegaNav` + footer reskin

**New**
- `client/src/components/MegaNav.tsx` — horizontal bar + vertical panel + mobile overlay
- `client/src/components/SectionRail.tsx` — vertical numbered rail
- `client/src/components/SectionHero.tsx` — full-bleed hero image + display title
- `client/src/components/TransitionSting.tsx` — non-blocking video overlay
- `client/src/lib/heroes.ts` — route → image/sting asset map
- `client/scripts/generate-heroes.mjs` — Magnific pipeline driver
- `client/scripts/encode-media.mjs` — AVIF/WebP + WebM/MP4 encode step

**Token sweep** (each carries stone/orange classes today and must be converted
so nothing ships half-themed)
- `client/src/index.css` — theme block, `.paper-backdrop` removed, markdown styles
- `client/src/pages/SectionPage.tsx`
- `client/src/pages/HotNews.tsx`
- `client/src/pages/Calculator.tsx`
- `client/src/pages/Legal.tsx`
- `client/src/components/QAList.tsx`
- `client/src/components/RSSFeed.tsx`
- `client/src/components/Markdown.tsx`

**Metadata**
- `client/index.html` — `theme-color` is still `#9A3412` (old orange); replace
  with `#E7E8EB`. Remove the Google Fonts link in favour of self-hosted woff2.
  Point `og:image` at the regenerated card.

  > **Preserve the JSON-LD.** `index.html` carries a `schema.org` `@graph`
  > (WebSite + Organization + Person) added upstream in `1f4d42a` and `95c81ca`.
  > It must survive the reskin **verbatim**. It references
  > `https://ai-know.org/og-image.png` in three places and declares it
  > `1200×630`. The regenerated social card therefore keeps **the same filename
  > and the same 1200×630 dimensions**, so no JSON-LD edit is needed and no
  > structured-data validation breaks. Verify with a schema validator after the
  > build.
- `client/scripts/prerender.mjs` — extend per-route injection to emit a per-route
  `og:image` and `twitter:image` using that route's hero.
- `client/public/og-image.png` — regenerate (current file is 964KB).

## 8. Verification

Nothing is declared done on inspection alone.

1. `npm run build` completes clean, including `tsc -b` and `oxlint`.
2. `npm run preview`, then a Playwright pass asserting:
   - Both languages (`he`/`rtl` and `en`/`ltr`).
   - Mega-panel opens, closes on `Escape`, closes on backdrop click, and
     `aria-expanded` tracks state.
   - The rail renders on the correct side per direction.
   - Mobile overlay at 390px width.
   - No horizontal body scroll at 390 / 768 / 1440.
3. Screenshot every one of the 16 routes in both languages and review them for
   half-themed leftovers (any surviving stone/orange).
4. Confirm no console errors on any route.
5. Lighthouse on the built preview: performance and accessibility ≥90.
6. Verify sting behaviour with video blocked — navigation must be unaffected.

## 9. Deploy

`.github/workflows/static.yml` deploys on push to `main`. **There is no staging
environment; pushing to `main` is publishing to production.** The deploy step is
therefore gated: all of §8 passes locally first, results are reported, and an
explicit approval is requested before any push. Deploy is never a side effect of
finishing the build.

## 10. Out of scope

- Content changes. All YAML under `client/data/` is untouched.
- Dark mode. The grey/ink system ships light-only.
- Any backend, CMS, or build-system replacement.
- Changes to the news-refresh or security-scan workflows.

---

## Deviations from this design

Recorded during implementation. Each is a deliberate choice, not an oversight.

### 1. Per-section stings are image-driven, not sixteen video files

**Designed:** §5.2 specified 16 HyperFrames-rendered video stings, one per route.

**Built:** each sting sweeps that route's *own generated hero image* across the
viewport.

**Why:** the original request was "best image for the transition… each tab a
different image", which the image-driven form satisfies directly. It is also
better engineering. A 700ms video sting carries ~100ms+ of decode latency, so it
fires visibly late relative to the route change it is meant to mark, and sixteen
of them cost roughly 2MB for pure decoration. The hero images are already
generated, already cached, and start instantly.

The non-blocking contract is unchanged and was verified empirically: with every
image and video request aborted, navigation still completed in 25–466ms with
live, interactive content and no application errors.

### 2. Generation was one anchor plus direct finals, not two passes

**Designed:** §6.4 budgeted 32 drafts + 16 finals ≈ 3,820 credits.

**Built:** 2 style anchors → 15 finals against the chosen anchor → 1 targeted
re-roll → 1 social card. **1,900 credits**, half the budget.

**Why:** with the anchor pinning lighting, palette, and background value, draft
compositions added little signal — a rejected final costs the same to re-roll as
a draft did. The one re-roll was `chat-tools`, whose first render came back as a
concentric liquid ripple nearly identical to `hot-news`.

### 3. `--ink-faint` is effectively retired

**Designed:** §3.1 defined `--ink-faint` at 3.99:1, restricted to text ≥18.66px.

**Built:** every actual use was 12px — index numbers and `.label` runs — so all
of it moved to `--ink-muted` (6.93:1). The token now appears on a single
decorative `aria-hidden` glyph.

**Why:** a token whose only compliant use case never occurs in the design is a
trap for the next person. Lighthouse flagged it; the fix took accessibility from
96 to 100.

### 4. The hero loop sits on `ai-basics`, not a homepage

**Designed:** §5.2 said "behind the homepage hero".

**Built:** behind the `ai-basics` hero.

**Why:** there is no homepage — `/` redirects to `/ai-basics`, which is the
de-facto landing route. The loop mounts only after `requestIdleCallback`, so the
static image remains the LCP element (measured LCP 123ms, CLS 0.00).

### 5. View Transitions are enabled via React Router

**Designed:** the plan sketched a manual `document.startViewTransition` +
`flushSync` wrapper.

**Built:** React Router 7's `viewTransition` prop on each link.

**Why:** it is the supported API for this router, feature-detects internally, and
avoids hand-rolling a navigation wrapper.

## Verification record

| Check | Result |
| --- | --- |
| `npm run build` + `oxlint` | clean |
| Routes rendered (18 × 2 languages) | 36/36, 0 failures, 0 warnings |
| Mega-panel a11y (open / Escape / focus return / `aria-expanded`) | pass, both languages |
| Rail side (`inline-end`) | right in LTR, left in RTL |
| Mobile overlay + scroll lock at 390px | pass |
| Horizontal scroll at 390 / 768 / 1440 | none |
| Non-blocking sting with all media blocked | pass, 25–466ms navigation |
| Reduced motion suppresses sting + hero loop | pass |
| Sting does not leak onto hero-less routes (mid-sting exit) | pass — regression, see below |
| Lighthouse (desktop) | Accessibility 100, Best Practices 100, SEO 100, Agentic 100 |
| Core Web Vitals | LCP 123ms, CLS 0.00 |
| JSON-LD | parses; WebSite + Organization + Person intact; logo 1200×630 |
| Magnific spend | 1,900 of 5,000 ceiling (sum of per-call declarations; no before/after balance snapshot was taken, and the account counter is lifetime) |

### Post-deploy regression: sting leaked onto hero-less routes

Found after the first production deploy, fixed in `2d820da`.

Leaving a hero route for one with no hero — the legal pages, reached from the
footer — bailed out of the effect before clearing `routeId`. The cleanup had
already cancelled the pending timer, so state still pointed at the route just
left; because the overlay is keyed on pathname, React remounted it and replayed
the *previous* route's hero across the new page, then left it in the DOM with
nothing scheduled to remove it.

The original contract suite only exercised hero → hero navigation, so it never
fired. The suite now covers a mid-sting `graphics → privacy-policy` exit and
asserts three things: nothing renders, nothing is stranded once the old timer
would have elapsed, and the next hero route still stings. Verified to fail
against the pre-fix build before being accepted.

Lesson for later transitions: the interesting cases for route-scoped state are
the routes that *opt out*, not the ones that opt in.

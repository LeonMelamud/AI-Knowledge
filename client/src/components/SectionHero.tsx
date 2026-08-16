import { heroFor, heroSrc } from '../lib/heroes'

/**
 * Full-bleed section hero.
 *
 * The typographic block is the hero; the image is a layer behind it. When a
 * route has no generated image yet, the type stands alone rather than leaving a
 * hole — so the layout is complete and reviewable before generation runs.
 */
export default function SectionHero({
  routeId,
  title,
  count,
}: {
  routeId: string
  title: string
  count?: number
}) {
  const hero = heroFor(routeId)
  const hasImage = Boolean(hero?.available)

  return (
    <header className="relative isolate overflow-hidden border-b border-hairline bg-surface">
      {hasImage && (
        <picture>
          <source
            type="image/avif"
            srcSet={`${heroSrc(routeId, 640, 'avif')} 640w, ${heroSrc(routeId, 1280, 'avif')} 1280w, ${heroSrc(routeId, 1920, 'avif')} 1920w`}
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet={`${heroSrc(routeId, 640, 'webp')} 640w, ${heroSrc(routeId, 1280, 'webp')} 1280w, ${heroSrc(routeId, 1920, 'webp')} 1920w`}
            sizes="100vw"
          />
          <img
            src={heroSrc(routeId, 1280, 'webp')}
            alt=""
            width={1920}
            height={1080}
            /* Above the fold on every section page — must not be lazy. */
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        </picture>
      )}

      {/* Scrim keeps the display type at full contrast over any image. */}
      {hasImage && <div aria-hidden className="absolute inset-0 -z-10 bg-canvas/70" />}

      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:py-28">
        <h1 className="display-xl max-w-4xl">{title}</h1>
        {count !== undefined && (
          <p className="label mt-6 text-ink-faint">
            <span className="font-mono">{String(count).padStart(2, '0')}</span>
          </p>
        )}
      </div>
    </header>
  )
}

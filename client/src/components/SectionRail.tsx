import { useEffect, useState } from 'react'

export interface RailItem {
  id: string
  name: string
}

/**
 * Anchor id for a section item.
 *
 * The `\p{L}` unicode property escape is load-bearing: the site defaults to
 * Hebrew, and an ASCII-only `[^a-z0-9-]` class would erase every Hebrew heading
 * id, silently breaking the rail in the primary language.
 */
export const slugify = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')

/**
 * Vertical numbered index of the current section's items.
 *
 * Progressive enhancement only — it is hidden below 1280px and its entries are
 * plain anchors, so the content is always reachable without it. Sits at
 * `inline-end`, which resolves to the right in RTL and the left in LTR.
 */
export default function SectionRail({ items }: { items: RailItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    )

    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((n): n is HTMLElement => n !== null)
    nodes.forEach((n) => observer.observe(n))

    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  return (
    <nav
      aria-label="Section contents"
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto xl:block"
    >
      <ol>
        {items.map((item, i) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                title={item.name}
                className={`flex items-baseline gap-3 border-s py-1.5 ps-3 text-sm transition-colors duration-150 ${
                  active
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <span className="font-mono text-xs text-ink-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/* Single-line: Hebrew labels containing parenthesised Latin
                    ("למידת מכונה (Machine Learning)") strand their brackets on
                    the wrong side when they wrap. Truncating avoids the bidi
                    artifact; the full string stays available via `title`. */}
                <span className="truncate leading-snug">{item.name}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

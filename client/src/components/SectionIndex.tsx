import { useI18n } from '../lib/i18n'
import type { RailItem } from './SectionRail'

/**
 * The section rail's job below 1280px, where the rail is hidden: a collapsed,
 * numbered list of everything on the page, so a reader can scan the whole set
 * before committing to scroll through it.
 */
export default function SectionIndex({ items }: { items: RailItem[] }) {
  const { t } = useI18n()
  if (items.length < 2) return null

  return (
    <details className="group border-b border-hairline xl:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="label text-ink">
          {t('sectionContents')} <span className="font-mono tabular-nums text-ink-muted">({items.length})</span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="h-3 w-3 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4.5L6 8.5L10 4.5" />
        </svg>
      </summary>
      <ol className="grid gap-x-8 pb-6 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="flex items-baseline gap-3 py-2 text-sm text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              <span className="font-mono text-xs tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0 truncate">{item.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </details>
  )
}

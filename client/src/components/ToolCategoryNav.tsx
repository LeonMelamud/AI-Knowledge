import { NavLink } from 'react-router-dom'
import { getTools } from '../lib/data'
import { useI18n } from '../lib/i18n'

/**
 * Every tool category, one tap away, with its size. The directory is split by
 * route, so this row is its filter: a visitor narrows to one kind of tool
 * before reading any entry.
 */
export default function ToolCategoryNav() {
  const { lang, t } = useI18n()
  const sections = getTools(lang)

  return (
    <div className="border-b border-hairline">
      <div className="mx-auto max-w-[1280px] px-4">
        <nav aria-label={t('toolCategories')} className="-mx-4 overflow-x-auto px-4">
          <ul className="flex min-w-max gap-2 py-4">
            {sections.map((s) => (
              <li key={s.id}>
                <NavLink
                  to={`/${s.id}`}
                  viewTransition
                  className={({ isActive }) =>
                    `flex items-baseline gap-2 border px-3 py-2 text-sm transition-colors duration-200 ${
                      isActive
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-hairline text-ink-muted hover:border-ink hover:text-ink'
                    }`
                  }
                >
                  {s.title}
                  <span className="font-mono text-xs tabular-nums opacity-70">{s.items.length}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="pb-4 text-sm text-ink-muted">{t('toolsStance')}</p>
      </div>
    </div>
  )
}

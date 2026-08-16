import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getConcepts, getNews, getTools } from '../lib/data'

type MenuId = 'knowledge' | 'tools'

interface NavEntry {
  id: string
  title: string
  count: number
}

/** Zero-padded index — the LTX numbering device. Latin digits in both languages. */
const pad = (n: number) => String(n + 1).padStart(2, '0')

/**
 * Two-axis navigation.
 *
 * Horizontal: a bar of uppercase category labels.
 * Vertical:   activating a category drops a full-bleed panel whose links are
 *             stacked vertically in columns.
 *
 * The panel shares the page background and carries no shadow or radius, so it
 * reads as the header growing rather than as a floating card.
 */
export default function MegaNav() {
  const { lang, setLang, t } = useI18n()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const concepts = getConcepts(lang)
  const tools = getTools(lang)

  const groups: Record<MenuId, { label: string; entries: NavEntry[] }> = {
    knowledge: {
      label: t('knowledge'),
      entries: concepts.map((s) => ({ id: s.id, title: s.title, count: s.items.length })),
    },
    tools: {
      label: t('links'),
      entries: tools.map((s) => ({ id: s.id, title: s.title, count: s.items.length })),
    },
  }

  // Newest dated news headline, used by the announcement bar.
  const latest = [...getNews(lang)]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0]
    ?.topics?.[0]?.title

  // Any navigation dismisses every menu.
  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [location.pathname])

  // Escape closes and returns focus to the control that opened the panel.
  useEffect(() => {
    if (!openMenu && !mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openMenu) triggerRefs.current[openMenu]?.focus()
      setOpenMenu(null)
      setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openMenu, mobileOpen])

  // Lock body scroll behind the mobile overlay.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const toggle = (id: MenuId) => setOpenMenu((cur) => (cur === id ? null : id))

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `label transition-colors duration-200 ${
      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
    }`

  return (
    <>
      {/* Announcement bar — carries the freshest headline rather than filler. */}
      {latest && (
        <Link
          to="/hot-news"
          className="block bg-announce text-canvas transition-opacity duration-200 hover:opacity-85"
        >
          <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-2.5">
            <span className="label opacity-60">{t('hotNews')}</span>
            <span className="truncate text-xs font-light">{latest}</span>
            <span aria-hidden className="text-xs rtl:rotate-180">
              →
            </span>
          </div>
        </Link>
      )}

      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-4 py-4">
          {/* No aria-label: the visible wordmark already names this link, and an
              aria-label that differs from visible text fails the
              label-content-name-mismatch check for voice-control users. */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-ink text-sm font-semibold tracking-tight text-canvas">
              ai
            </span>
            <span className="hidden text-base font-semibold tracking-tight sm:block">
              {t('heroTitle')}
            </span>
          </Link>

          {/* Horizontal axis */}
          <nav className="hidden flex-1 items-center gap-7 lg:flex" aria-label="Main">
            {(Object.keys(groups) as MenuId[]).map((id) => (
              <button
                key={id}
                id={`trigger-${id}`}
                ref={(el) => {
                  triggerRefs.current[id] = el
                }}
                onClick={() => toggle(id)}
                aria-expanded={openMenu === id}
                aria-controls={`panel-${id}`}
                className={`label flex cursor-pointer items-center gap-1.5 transition-colors duration-200 ${
                  openMenu === id ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {groups[id].label}
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={`h-2.5 w-2.5 transition-transform duration-200 ${
                    openMenu === id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 4.5L6 8.5L10 4.5" />
                </svg>
              </button>
            ))}
            <NavLink to="/hot-news" viewTransition className={linkClass}>
              {t('hotNews')}
            </NavLink>
            <NavLink to="/calculator" viewTransition className={linkClass}>
              {t('tokenCalculator')}
            </NavLink>
          </nav>

          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <button
              onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
              className="label cursor-pointer border border-hairline px-3 py-2 text-ink-muted transition-colors duration-200 hover:border-ink hover:text-ink"
              /* Accessible name must start with the visible text, or
                 voice-control users cannot say what they see. */
              aria-label={lang === 'he' ? 'EN — switch to English' : 'עב — החלף לעברית'}
            >
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="cursor-pointer p-2 text-ink lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Vertical axis — full-bleed panel, animated via grid-template-rows so
            it needs no measured height. */}
        {(Object.keys(groups) as MenuId[]).map((id) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="group"
            aria-labelledby={`trigger-${id}`}
            className={`hidden overflow-hidden border-hairline bg-surface transition-[grid-template-rows] duration-300 ease-out lg:grid ${
              openMenu === id ? 'grid-rows-[1fr] border-b' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="mx-auto max-w-[1280px] px-4 py-10">
                <p className="label mb-6 text-ink-muted">{groups[id].label}</p>
                <ul className="grid grid-cols-2 gap-x-12 gap-y-1 xl:grid-cols-3">
                  {groups[id].entries.map((entry, i) => (
                    <li key={entry.id}>
                      <NavLink
                        to={`/${entry.id}`}
                        viewTransition
                        className="group flex items-baseline gap-3 border-b border-transparent py-2.5 transition-colors duration-150 hover:border-hairline"
                      >
                        <span className="font-mono text-xs text-ink-muted">{pad(i)}</span>
                        <span className="min-w-0 truncate text-base text-ink-muted transition-colors duration-150 group-hover:text-ink">
                          {entry.title}
                        </span>
                        {/* Count sits directly beside the title — pushed to the
                            column edge it reads as an orphaned number. */}
                        <span className="font-mono text-xs text-ink-muted">({entry.count})</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </header>

      {/* Scrim. Sits under the header but over the page, so the panel stays legible. */}
      {openMenu && (
        <div
          className="fixed inset-0 z-30 hidden bg-canvas/45 backdrop-blur-[8px] lg:block"
          onClick={() => setOpenMenu(null)}
          aria-hidden
        />
      )}

      {/* Mobile: the same information architecture, stacked. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas lg:hidden">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-4">
            <span className="text-base font-semibold tracking-tight">{t('heroTitle')}</span>
            <button onClick={() => setMobileOpen(false)} className="cursor-pointer p-2" aria-label="Close menu">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="px-4 py-6" aria-label="Mobile">
            {(Object.keys(groups) as MenuId[]).map((id) => (
              <section key={id} className="mb-8">
                <p className="label mb-3 text-ink-muted">{groups[id].label}</p>
                <ul>
                  {groups[id].entries.map((entry, i) => (
                    <li key={entry.id}>
                      <NavLink
                        to={`/${entry.id}`}
                        viewTransition
                        className="flex items-baseline gap-3 border-b border-hairline py-3 text-ink-muted"
                      >
                        <span className="font-mono text-xs text-ink-muted">{pad(i)}</span>
                        <span className="flex-1">{entry.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <section>
              <p className="label mb-3 text-ink-muted">{t('specialSections')}</p>
              <ul>
                <li>
                  <NavLink to="/hot-news" className="block border-b border-hairline py-3 text-ink-muted">
                    {t('hotNews')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/calculator" className="block border-b border-hairline py-3 text-ink-muted">
                    {t('tokenCalculator')}
                  </NavLink>
                </li>
              </ul>
            </section>
          </nav>
        </div>
      )}
    </>
  )
}

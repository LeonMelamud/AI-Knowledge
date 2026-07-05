import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { getConcepts, getTools } from '../lib/data'

function Dropdown({
  label,
  items,
  open,
  onToggle,
}: {
  label: string
  items: { id: string; title: string }[]
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          open ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {label}
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { lang, setLang, t } = useI18n()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState<'knowledge' | 'links' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const concepts = getConcepts(lang)
  const tools = getTools(lang)

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const directLinks = [
    { to: '/hot-news', label: t('hotNews') },
    { to: '/calculator', label: t('tokenCalculator') },
    { to: '/text-generation', label: t('generateText') },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white">
              AI
            </span>
            <span className="hidden text-lg font-semibold text-slate-900 sm:block">{t('heroTitle')}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Dropdown
              label={t('knowledge')}
              items={concepts}
              open={openMenu === 'knowledge'}
              onToggle={() => setOpenMenu(openMenu === 'knowledge' ? null : 'knowledge')}
            />
            <Dropdown
              label={t('links')}
              items={tools}
              open={openMenu === 'links'}
              onToggle={() => setOpenMenu(openMenu === 'links' ? null : 'links')}
            />
            {directLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-label="Switch language"
            >
              {lang === 'he' ? '🇺🇸 English' : '🇮🇱 עברית'}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('knowledge')}</p>
            {concepts.map((s) => (
              <NavLink key={s.id} to={`/${s.id}`} className={navLinkClass + ' block'}>
                {s.title}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('links')}</p>
            {tools.map((s) => (
              <NavLink key={s.id} to={`/${s.id}`} className={navLinkClass + ' block'}>
                {s.title}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('specialSections')}</p>
            {directLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass + ' block'}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© 2026 {t('heroTitle')}</p>
          <nav className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-700">{t('privacyPolicy')}</Link>
            <Link to="/terms-of-service" className="hover:text-slate-700">{t('termsOfService')}</Link>
            <a href="https://www.linkedin.com/in/leon-melamud" target="_blank" rel="noreferrer" className="hover:text-slate-700">
              LinkedIn
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

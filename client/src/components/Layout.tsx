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
        className={`flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          open ? 'bg-orange-100 text-orange-950' : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-950'
        }`}
      >
        {label}
        <svg className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-300/40">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive ? 'bg-orange-50 font-medium text-orange-950' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
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
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive ? 'bg-orange-100 text-orange-950' : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-950'
    }`

  return (
    <div className="relative flex min-h-screen flex-col text-stone-900">
      <div aria-hidden className="paper-backdrop" />

      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf7f2]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 font-serif text-lg font-bold text-orange-50 transition-transform duration-200 group-hover:scale-105">
              AI
            </span>
            <span className="hidden font-serif text-xl font-bold text-stone-900 sm:block">{t('heroTitle')}</span>
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
              className="cursor-pointer rounded-full border border-stone-300 bg-white/70 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors duration-200 hover:border-stone-400 hover:bg-stone-100"
              aria-label="Switch language"
            >
              {lang === 'he' ? '🇺🇸 English' : '🇮🇱 עברית'}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="cursor-pointer rounded-full p-2 text-stone-700 transition-colors duration-200 hover:bg-stone-200/60 lg:hidden"
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
          <nav className="border-t border-stone-200 bg-[#faf7f2]/95 px-4 py-3 backdrop-blur lg:hidden">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{t('knowledge')}</p>
            {concepts.map((s) => (
              <NavLink key={s.id} to={`/${s.id}`} className={navLinkClass + ' block'}>
                {s.title}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">{t('links')}</p>
            {tools.map((s) => (
              <NavLink key={s.id} to={`/${s.id}`} className={navLinkClass + ' block'}>
                {s.title}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">{t('specialSections')}</p>
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

      <footer className="border-t border-stone-800 bg-stone-900 text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-sm sm:flex-row sm:justify-between">
          <p>© 2026 {t('heroTitle')}</p>
          <nav className="flex items-center gap-4">
            <Link to="/privacy-policy" className="transition-colors duration-200 hover:text-white">{t('privacyPolicy')}</Link>
            <Link to="/terms-of-service" className="transition-colors duration-200 hover:text-white">{t('termsOfService')}</Link>
            <a href="https://www.linkedin.com/in/leon-melamud" target="_blank" rel="noreferrer" className="transition-colors duration-200 hover:text-white">
              LinkedIn
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

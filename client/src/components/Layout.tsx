import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import MegaNav from './MegaNav'

export default function Layout() {
  const { t } = useI18n()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <MegaNav />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-hairline bg-announce text-canvas">
        <div className="mx-auto max-w-[1280px] px-4 py-14">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="flex h-8 w-8 items-center justify-center bg-canvas text-sm font-semibold tracking-tight text-ink">
                ai
              </span>
              <p className="mt-4 max-w-xs text-sm font-light opacity-70">{t('heroTitle')}</p>
            </div>

            <nav className="flex flex-col gap-3 text-sm" aria-label="Footer">
              <Link to="/about" className="opacity-70 transition-opacity duration-200 hover:opacity-100">
                {t('aboutTitle')}
              </Link>
              <Link to="/contact" className="opacity-70 transition-opacity duration-200 hover:opacity-100">
                {t('contactTitle')}
              </Link>
              <Link to="/privacy-policy" className="opacity-70 transition-opacity duration-200 hover:opacity-100">
                {t('privacyPolicy')}
              </Link>
              <Link to="/terms-of-service" className="opacity-70 transition-opacity duration-200 hover:opacity-100">
                {t('termsOfService')}
              </Link>
              <a
                href="https://www.linkedin.com/in/leon-melamud"
                target="_blank"
                rel="noreferrer"
                className="opacity-70 transition-opacity duration-200 hover:opacity-100"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/LeonMelamud/AI-Knowledge"
                target="_blank"
                rel="noreferrer"
                className="opacity-70 transition-opacity duration-200 hover:opacity-100"
              >
                GitHub
              </a>
            </nav>
          </div>

          <p className="mt-12 border-t border-white/10 pt-6 font-mono text-xs opacity-50">
            © {new Date().getFullYear()} {t('heroTitle')}
          </p>
        </div>
      </footer>
    </div>
  )
}

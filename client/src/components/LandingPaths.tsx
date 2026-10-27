import { Link } from 'react-router-dom'
import { getConcepts, getTools, latestNewsDate } from '../lib/data'
import { fill, formatDay } from '../lib/format'
import { useI18n } from '../lib/i18n'

interface Path {
  key: string
  title: string
  text: string
  meta?: string
  to: string
  /** In-page anchor rather than a route. */
  anchor?: boolean
}

/**
 * The three jobs a visitor arrives with, directly under the landing hero.
 *
 * Every figure is counted from the content files at render time, in the
 * visitor's language, so the strip cannot drift from what the site holds.
 */
export default function LandingPaths({ firstAnchor }: { firstAnchor: string }) {
  const { lang, t, tList } = useI18n()
  const concepts = getConcepts(lang)
  const tools = getTools(lang)
  const latest = latestNewsDate(lang)

  const count = (sections: { items: unknown[] }[]) => sections.reduce((n, s) => n + s.items.length, 0)

  const paths: Path[] = [
    {
      key: 'understand',
      title: t('jobUnderstandTitle'),
      text: t('jobUnderstandText'),
      meta: fill(t('jobUnderstandMeta'), { n: count(concepts), s: concepts.length }),
      to: `#${firstAnchor}`,
      anchor: true,
    },
    {
      key: 'tool',
      title: t('jobToolTitle'),
      text: t('jobToolText'),
      meta: fill(t('jobToolMeta'), { n: count(tools), s: tools.length }),
      to: `/${tools[0]?.id ?? ''}`,
    },
    {
      key: 'news',
      title: t('jobNewsTitle'),
      text: t('jobNewsText'),
      meta: latest ? fill(t('latestDigest'), { date: formatDay(latest, lang) }) : undefined,
      to: '/hot-news',
    },
  ]

  const block = 'group flex h-full flex-col gap-3 px-4 py-8 transition-colors duration-200 hover:bg-surface-raised md:px-8 md:py-10'

  const body = (p: Path) => (
    <>
      <h3 className="display-m flex items-baseline justify-between gap-4">
        {p.title}
        <span
          aria-hidden
          className="text-base text-ink-faint transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
        >
          →
        </span>
      </h3>
      <p className="max-w-sm text-base font-light leading-relaxed text-ink-muted">{p.text}</p>
      {p.meta && <p className="mt-auto pt-2 font-mono text-xs tabular-nums rtl:font-sans rtl:text-sm text-ink-muted">{p.meta}</p>}
    </>
  )

  return (
    <section aria-labelledby="landing-paths" className="border-b border-hairline bg-surface">
      <h2 id="landing-paths" className="sr-only">
        {t('landingPathsTitle')}
      </h2>
      <div className="mx-auto max-w-[1280px]">
        <ul className="grid divide-y divide-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
          {paths.map((p) => (
            <li key={p.key}>
              {p.anchor ? (
                <a href={p.to} className={block}>
                  {body(p)}
                </a>
              ) : (
                <Link to={p.to} viewTransition className={block}>
                  {body(p)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* The editorial stance, surfaced where the visitor decides whether to trust the page. */}
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4 text-sm text-ink-muted md:px-8">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {tList('trustList').map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-1 bg-ink" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/about"
            className="ms-auto text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            {t('trustMore')}
          </Link>
        </div>
      </div>
    </section>
  )
}

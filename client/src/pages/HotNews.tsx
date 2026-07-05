import { getNewsWithFallback, type NewsSection } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import Markdown from '../components/Markdown'
import QAList from '../components/QAList'
import RSSFeed from '../components/RSSFeed'

// Category banner: news screenshots go stale with the 6-month retention,
// so each section gets an evergreen gradient banner matched by title keywords.
const CATEGORIES: { match: RegExp; gradient: string; icon: string }[] = [
  {
    match: /frontier|llm|language model|מודלי שפה|בחזית/i,
    gradient: 'from-violet-600 to-fuchsia-500',
    icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z',
  },
  {
    match: /open.?source|open.?weight|קוד פתוח/i,
    gradient: 'from-emerald-500 to-cyan-500',
    icon: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  },
  {
    match: /agent|mcp|סוכנ/i,
    gradient: 'from-cyan-500 to-blue-600',
    icon: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z',
  },
  {
    match: /vision|image|video|graphic|ראייה|תמונ|וידאו/i,
    gradient: 'from-amber-500 to-rose-500',
    icon: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z',
  },
  {
    match: /compan|industry|business|חברות|תעשי|עסק/i,
    gradient: 'from-blue-600 to-violet-600',
    icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  },
]

const DEFAULT_CATEGORY = {
  gradient: 'from-violet-600 to-cyan-500',
  icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5',
}

function SectionBanner({ section, locale }: { section: NewsSection; locale: string }) {
  const category = CATEGORIES.find((c) => c.match.test(section.section)) ?? DEFAULT_CATEGORY
  const date =
    section.date &&
    new Date(section.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className={`flex items-center gap-4 rounded-2xl bg-gradient-to-br ${category.gradient} p-5 text-white shadow-lg shadow-violet-200/60`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={category.icon} />
        </svg>
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-bold leading-tight">{section.section}</h2>
        {date && <p className="mt-0.5 text-sm font-medium text-white/80">{date}</p>}
      </div>
    </div>
  )
}

function NewsSectionBlock({ section, locale }: { section: NewsSection; locale: string }) {
  return (
    <section>
      <SectionBanner section={section} locale={locale} />
      <div className="mt-4 space-y-4">
        {section.topics.map((topic) => (
          <article
            key={topic.title}
            className="rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:shadow-violet-100/70"
          >
            <h3 className="text-lg font-semibold text-slate-900">{topic.title}</h3>
            {topic.description && (
              <div className="mt-2">
                <Markdown>{topic.description}</Markdown>
              </div>
            )}
            {topic.images?.map((img) => (
              <img
                key={img}
                src={`${import.meta.env.BASE_URL}images/${img}`}
                alt={topic.title}
                loading="lazy"
                className="mt-4 max-w-full rounded-lg border border-violet-100"
              />
            ))}
            {topic.links && topic.links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {topic.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 transition-colors duration-200 hover:bg-violet-100"
                    >
                      {link.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {topic.questions && <QAList items={topic.questions} />}
          </article>
        ))}
      </div>
    </section>
  )
}

export default function HotNews() {
  const { lang, t } = useI18n()
  const { sections, extraEnglish } = getNewsWithFallback(lang)
  const locale = lang === 'he' ? 'he-IL' : 'en-US'

  usePageMeta(t('hotNewsTitle'), t('hotNewsDescription'))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="bg-gradient-to-r from-violet-700 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
          {t('hotNewsTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t('hotNewsDescription')}</p>
        <p className="mt-1 text-xs text-slate-400">{t('hotNewsDisclaimer')}</p>
      </div>

      <RSSFeed />

      {sections.map((section, i) => (
        <NewsSectionBlock key={`${section.section}-${i}`} section={section} locale={locale} />
      ))}

      {extraEnglish.length > 0 && (
        <div dir="ltr" className="space-y-10 border-t border-violet-100 pt-8 text-start">
          <p className="text-sm font-medium text-slate-500">More news (English)</p>
          {extraEnglish.map((section, i) => (
            <NewsSectionBlock key={`en-${section.section}-${i}`} section={section} locale="en-US" />
          ))}
        </div>
      )}
    </div>
  )
}

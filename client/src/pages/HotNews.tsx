import { getNewsWithFallback, type NewsSection } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import Markdown from '../components/Markdown'
import QAList from '../components/QAList'
import RSSFeed from '../components/RSSFeed'

function NewsSectionBlock({ section }: { section: NewsSection }) {
  return (
    <section>
      <h2 className="mb-3 border-s-4 border-indigo-500 ps-3 text-xl font-semibold text-slate-900">
        {section.section}
      </h2>
      <div className="space-y-4">
        {section.topics.map((topic) => (
          <article key={topic.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                className="mt-4 max-w-full rounded-lg border border-slate-200"
              />
            ))}
            {topic.links && topic.links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3">
                {topic.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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

  usePageMeta(t('hotNewsTitle'), t('hotNewsDescription'))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('hotNewsTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('hotNewsDescription')}</p>
        <p className="mt-1 text-xs text-slate-400">{t('hotNewsDisclaimer')}</p>
      </div>

      <RSSFeed />

      {sections.map((section, i) => (
        <NewsSectionBlock key={`${section.section}-${i}`} section={section} />
      ))}

      {extraEnglish.length > 0 && (
        <div dir="ltr" className="space-y-10 border-t border-slate-200 pt-8 text-start">
          <p className="text-sm font-medium text-slate-500">More news (English)</p>
          {extraEnglish.map((section, i) => (
            <NewsSectionBlock key={`en-${section.section}-${i}`} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}

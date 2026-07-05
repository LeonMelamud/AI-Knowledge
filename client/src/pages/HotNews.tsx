import { useEffect, useState } from 'react'
import { getNewsWithFallback, type NewsSection, type NewsTopic } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import Markdown from '../components/Markdown'
import QAList from '../components/QAList'
import RSSFeed from '../components/RSSFeed'

/** link URL -> file in images/news-auto/, generated at build time by scripts/fetch-news-images.mjs */
type ImageManifest = Record<string, string>

// Per-topic screenshots die with the 6-month retention, so each section gets an
// evergreen photo header matched by title keywords (EN + HE).
// Photos: unsplash.com (Unsplash License — free use, no attribution required),
// stored locally in public/images/news/.
const CATEGORIES: { match: RegExp; img: string }[] = [
  { match: /frontier|llm|language model|מודלי שפה|בחזית/i, img: 'frontier.jpg' },
  { match: /open.?source|open.?weight|קוד פתוח/i, img: 'opensource.jpg' },
  { match: /agent|mcp|סוכנ/i, img: 'agents.jpg' },
  { match: /vision|image|video|graphic|ראייה|תמונ|וידאו/i, img: 'vision.jpg' },
  { match: /compan|industry|business|חברות|תעשי|עסק/i, img: 'industry.jpg' },
]

function SectionBanner({ section, locale }: { section: NewsSection; locale: string }) {
  const img = CATEGORIES.find((c) => c.match.test(section.section))?.img ?? 'default.jpg'
  const date =
    section.date &&
    new Date(section.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="relative h-40 overflow-hidden rounded-2xl shadow-md sm:h-44">
      <img
        src={`${import.meta.env.BASE_URL}images/news/${img}`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/35 to-stone-950/10" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="font-serif text-2xl font-bold leading-tight text-white">{section.section}</h2>
        {date && <p className="mt-0.5 text-sm font-medium text-stone-200">{date}</p>}
      </div>
    </div>
  )
}

// Story image straight from the news source (og:image, downloaded at build time).
// Manual YAML images: take precedence.
function storyImage(topic: NewsTopic, manifest: ImageManifest) {
  if (topic.images?.length) return null
  return topic.links?.map((l) => manifest[l.url]).find(Boolean) ?? null
}

function NewsSectionBlock({ section, locale, manifest }: { section: NewsSection; locale: string; manifest: ImageManifest }) {
  return (
    <section>
      <SectionBanner section={section} locale={locale} />
      <div className="mt-4 space-y-4">
        {section.topics.map((topic) => {
          const auto = storyImage(topic, manifest)
          return (
          <article
            key={topic.title}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <h3 className="text-xl font-bold text-stone-900">{topic.title}</h3>
            {auto && (
              <img
                src={`${import.meta.env.BASE_URL}images/news-auto/${auto}`}
                alt={topic.title}
                loading="lazy"
                className="mt-4 max-h-72 w-full rounded-xl border border-stone-200 object-cover"
              />
            )}
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
                className="mt-4 max-w-full rounded-lg border border-stone-200"
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
                      className="inline-block rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-900 transition-colors duration-200 hover:bg-orange-100"
                    >
                      {link.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {topic.questions && <QAList items={topic.questions} />}
          </article>
          )
        })}
      </div>
    </section>
  )
}

export default function HotNews() {
  const { lang, t } = useI18n()
  const { sections, extraEnglish } = getNewsWithFallback(lang)
  const locale = lang === 'he' ? 'he-IL' : 'en-US'
  const [manifest, setManifest] = useState<ImageManifest>({})

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/news-images.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: ImageManifest) => setManifest(data && typeof data === 'object' ? data : {}))
      .catch(() => {})
  }, [])

  usePageMeta(t('hotNewsTitle'), t('hotNewsDescription'))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-4xl font-black text-stone-900">{t('hotNewsTitle')}</h1>
        <div className="mt-2 h-1 w-16 rounded-full bg-orange-700" />
        <p className="mt-3 text-sm text-stone-600">{t('hotNewsDescription')}</p>
        <p className="mt-1 text-xs text-stone-400">{t('hotNewsDisclaimer')}</p>
      </div>

      <RSSFeed />

      {sections.map((section, i) => (
        <NewsSectionBlock key={`${section.section}-${i}`} section={section} locale={locale} manifest={manifest} />
      ))}

      {extraEnglish.length > 0 && (
        <div dir="ltr" className="space-y-10 border-t border-stone-200 pt-8 text-start">
          <p className="text-sm font-medium text-stone-500">More news (English)</p>
          {extraEnglish.map((section, i) => (
            <NewsSectionBlock key={`en-${section.section}-${i}`} section={section} locale="en-US" manifest={manifest} />
          ))}
        </div>
      )}
    </div>
  )
}

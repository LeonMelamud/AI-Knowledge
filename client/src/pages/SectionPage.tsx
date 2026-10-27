import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { findSection, type ConceptItem, type ToolItem } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import Markdown from '../components/Markdown'
import QAList from '../components/QAList'
import SectionRail, { slugify } from '../components/SectionRail'
import SectionHero from '../components/SectionHero'
import SectionIndex from '../components/SectionIndex'
import LandingPaths from '../components/LandingPaths'
import ToolCategoryNav from '../components/ToolCategoryNav'
import { LANDING_ROUTE } from '../lib/heroes'

function ConceptCard({ item, index }: { item: ConceptItem; index: number }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const hasMore = Boolean(item.fullDescription || item.codeExample || item.images?.length)

  return (
    <article id={slugify(item.name)} className="border-b border-hairline py-8 scroll-mt-24">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs text-ink-muted">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <h2 className="display-m">{item.name}</h2>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-ink-muted">
            {item.shortDescription}
          </p>

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="label mt-4 cursor-pointer border-b border-ink pb-1 text-ink transition-opacity duration-150 hover:opacity-60"
            >
              {expanded ? t('hideInfo') : t('moreInfo')}
            </button>
          )}

          {expanded && (
            <div className="mt-6 border-s border-hairline ps-5">
              {item.fullDescription && <Markdown>{item.fullDescription}</Markdown>}
              {item.codeExample && (
                <div className="mt-4">
                  <p className="label mb-2 text-ink-muted">{t('codeExample')}</p>
                  <pre
                    className="overflow-x-auto bg-ink p-4 font-mono text-xs leading-relaxed text-canvas"
                    dir="ltr"
                  >
                    <code>{item.codeExample}</code>
                  </pre>
                </div>
              )}
              {item.images?.map((img) => (
                <img
                  key={img}
                  src={`${import.meta.env.BASE_URL}images/${img}`}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="mt-4 max-w-full border border-hairline"
                />
              ))}
            </div>
          )}

          {item.commonQuestions && <QAList items={item.commonQuestions} />}
        </div>
      </div>
    </article>
  )
}

function ToolCard({ item, index }: { item: ToolItem; index: number }) {
  return (
    <article id={slugify(item.name)} className="border-b border-hairline py-8 scroll-mt-24">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs text-ink-muted">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display-m">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-opacity duration-150 hover:opacity-60"
                >
                  {item.name}{' '}
                  <span aria-hidden className="align-middle text-sm text-ink-faint">
                    ↗
                  </span>
                </a>
              ) : (
                item.name
              )}
            </h2>
            {item.company && <span className="font-mono text-xs text-ink-muted">{item.company}</span>}
          </div>
          {item.description && (
            <div className="mt-3 max-w-2xl">
              <Markdown>{item.description}</Markdown>
            </div>
          )}
          {item.recentUpdates && (
            <div className="mt-4 border-s border-ink bg-surface p-4">
              <Markdown>{item.recentUpdates}</Markdown>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function SectionPage() {
  const { sectionId = '' } = useParams()
  const { lang, t } = useI18n()
  const result = findSection(lang, sectionId)

  usePageMeta(result?.section.title ?? '')

  if (!result) return <Navigate to="/ai-basics" replace />

  const railItems = result.section.items.map((item) => ({
    id: slugify(item.name),
    name: item.name,
  }))

  const isLanding = sectionId === LANDING_ROUTE

  return (
    <>
      <SectionHero
        routeId={sectionId}
        title={result.section.title}
        count={result.section.items.length}
        countLabel={t(result.kind === 'concept' ? 'conceptsCount' : 'toolsCount')}
      >
        {isLanding && railItems[0] && (
          <div className="mt-8 max-w-2xl">
            <p className="body-l text-ink">{t('landingLead')}</p>
            <a
              href={`#${railItems[0].id}`}
              className="mt-8 inline-flex items-center gap-3 bg-ink px-6 py-3.5 text-sm font-medium text-canvas transition-colors duration-200 hover:bg-ink-muted"
            >
              {t('landingCta')}
              <span aria-hidden>↓</span>
            </a>
          </div>
        )}
      </SectionHero>

      {isLanding && railItems[0] && <LandingPaths firstAnchor={railItems[0].id} />}
      {result.kind === 'tool' && <ToolCategoryNav />}

      <div className="mx-auto flex max-w-[1280px] gap-16 px-4">
        <div className="min-w-0 flex-1">
          <SectionIndex items={railItems} />
          {result.kind === 'concept'
            ? result.section.items.map((item, i) => (
                <ConceptCard key={item.name} item={item} index={i} />
              ))
            : result.section.items.map((item, i) => <ToolCard key={item.name} item={item} index={i} />)}
        </div>
        <SectionRail items={railItems} />
      </div>
    </>
  )
}

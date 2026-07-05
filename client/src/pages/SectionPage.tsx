import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { findSection, type ConceptItem, type ToolItem } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import Markdown from '../components/Markdown'
import QAList from '../components/QAList'

function ConceptCard({ item }: { item: ConceptItem }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const hasMore = Boolean(item.fullDescription || item.codeExample || item.images?.length)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.shortDescription}</p>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {expanded ? t('hideInfo') : t('moreInfo')}
        </button>
      )}

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {item.fullDescription && <Markdown>{item.fullDescription}</Markdown>}
          {item.codeExample && (
            <div className="mt-4">
              <p className="mb-1 text-sm font-medium text-slate-800">{t('codeExample')}</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100" dir="ltr">
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
              className="mt-4 max-w-full rounded-lg border border-slate-200"
            />
          ))}
        </div>
      )}

      {item.commonQuestions && <QAList items={item.commonQuestions} />}
    </article>
  )
}

function ToolCard({ item }: { item: ToolItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-indigo-700">
              {item.name} <span aria-hidden className="text-sm text-indigo-400">↗</span>
            </a>
          ) : (
            item.name
          )}
        </h2>
        {item.company && <span className="text-sm text-slate-400">{item.company}</span>}
      </div>
      {item.description && (
        <div className="mt-2">
          <Markdown>{item.description}</Markdown>
        </div>
      )}
      {item.recentUpdates && (
        <div className="mt-3 rounded-lg bg-indigo-50 p-3">
          <Markdown>{item.recentUpdates}</Markdown>
        </div>
      )}
    </article>
  )
}

export default function SectionPage() {
  const { sectionId = '' } = useParams()
  const { lang } = useI18n()
  const result = findSection(lang, sectionId)

  usePageMeta(result?.section.title ?? '')

  if (!result) return <Navigate to="/ai-basics" replace />

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{result.section.title}</h1>
      <div className="space-y-4">
        {result.kind === 'concept'
          ? result.section.items.map((item) => <ConceptCard key={item.name} item={item} />)
          : result.section.items.map((item) => <ToolCard key={item.name} item={item} />)}
      </div>
    </div>
  )
}

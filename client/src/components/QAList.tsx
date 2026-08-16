import type { QA } from '../lib/data'

export default function QAList({ items }: { items: QA[] }) {
  if (!items.length) return null
  return (
    <div className="mt-4 space-y-2">
      {items.map((qa) => (
        <details key={qa.question} className="group border border-hairline bg-surface transition-colors duration-200 open:bg-surface/60">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:text-ink group-open:text-ink">
            {qa.question}
          </summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-ink-muted">{qa.answer}</p>
        </details>
      ))}
    </div>
  )
}

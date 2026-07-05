import type { QA } from '../lib/data'

export default function QAList({ items }: { items: QA[] }) {
  if (!items.length) return null
  return (
    <div className="mt-4 space-y-2">
      {items.map((qa) => (
        <details key={qa.question} className="group rounded-xl border border-stone-200 bg-stone-50 transition-colors duration-200 open:bg-orange-50/60">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-stone-800 transition-colors duration-150 hover:text-orange-900 group-open:text-orange-950">
            {qa.question}
          </summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-stone-600">{qa.answer}</p>
        </details>
      ))}
    </div>
  )
}

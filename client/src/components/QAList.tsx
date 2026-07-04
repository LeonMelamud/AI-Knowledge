import type { QA } from '../lib/data'

export default function QAList({ items }: { items: QA[] }) {
  if (!items.length) return null
  return (
    <div className="mt-4 space-y-2">
      {items.map((qa) => (
        <details key={qa.question} className="group rounded-lg border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-800 group-open:text-indigo-700">
            {qa.question}
          </summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{qa.answer}</p>
        </details>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'

// Encoder is lazy-loaded (rank table is large) and cached after first use.
let encodePromise: Promise<(text: string) => number> | null = null

function loadEncoder() {
  encodePromise ??= Promise.all([import('js-tiktoken/lite'), import('js-tiktoken/ranks/gpt2')]).then(
    ([{ Tiktoken }, ranks]) => {
      const encoding = new Tiktoken(ranks.default)
      return (text: string) => encoding.encode(text).length
    },
  )
  return encodePromise
}

export default function Calculator() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  usePageMeta(t('tokenCalculator'))

  const calculate = async () => {
    setBusy(true)
    try {
      const encode = await loadEncoder()
      setCount(encode(text))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="bg-gradient-to-r from-violet-700 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
        {t('tokenCalculator')}
      </h1>

      <div className="space-y-4 rounded-2xl border border-violet-100 bg-white/90 p-6 shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('enterText')}
          rows={6}
          className="w-full rounded-lg border border-violet-200 p-3 text-sm transition-colors duration-150 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={calculate}
          disabled={busy || !text}
          className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/25 transition-all duration-200 hover:from-violet-700 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('calculateTokens')}
        </button>
        {count !== null && (
          <p className="rounded-lg bg-violet-50 p-4 text-sm font-medium text-violet-800">
            {t('numberOfTokens')}: {count}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white/90 p-6 text-sm leading-relaxed text-slate-600 shadow-sm">
        {t('tokenExplanation')
          .split('\n\n')
          .map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
      </div>
    </div>
  )
}

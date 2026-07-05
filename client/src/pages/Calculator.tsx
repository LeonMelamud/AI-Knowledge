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
      <h1 className="font-serif text-4xl font-black text-stone-900">{t('tokenCalculator')}</h1>
      <div className="mt-2 h-1 w-16 rounded-full bg-orange-700" />

      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('enterText')}
          rows={6}
          className="w-full rounded-lg border border-stone-300 p-3 text-sm transition-colors duration-150 focus:border-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-700"
        />
        <button
          onClick={calculate}
          disabled={busy || !text}
          className="cursor-pointer rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('calculateTokens')}
        </button>
        {count !== null && (
          <p className="rounded-lg bg-orange-50 p-4 text-sm font-medium text-orange-950">
            {t('numberOfTokens')}: {count}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-relaxed text-stone-600 shadow-sm">
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

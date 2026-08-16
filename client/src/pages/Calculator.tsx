import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import SectionHero from '../components/SectionHero'

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
    <>
      <SectionHero routeId="calculator" title={t('tokenCalculator')} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">

      <div className="space-y-4 border border-hairline bg-surface-raised p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('enterText')}
          rows={6}
          className="w-full border border-hairline p-3 text-sm transition-colors duration-150 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <button
          onClick={calculate}
          disabled={busy || !text}
          className="cursor-pointer bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors duration-200 hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('calculateTokens')}
        </button>
        {count !== null && (
          <p className="bg-surface p-4 text-sm font-medium text-ink">
            {t('numberOfTokens')}: {count}
          </p>
        )}
      </div>

      <div className="border border-hairline bg-surface-raised p-6 text-sm leading-relaxed text-ink-muted">
        {t('tokenExplanation')
          .split('\n\n')
          .map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
      </div>
      </div>
    </>
  )
}

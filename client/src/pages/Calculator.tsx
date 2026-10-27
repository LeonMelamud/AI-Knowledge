import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'
import { loadEncoder } from '../lib/tokens'
import SectionHero from '../components/SectionHero'

export default function Calculator() {
  const { lang, t } = useI18n()
  const nf = new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US')
  const [text, setText] = useState('')
  const [count, setCount] = useState<number | null>(null)
  // Characters of the text that was counted, not of what is in the box now.
  const [chars, setChars] = useState(0)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  usePageMeta(t('tokenCalculator'))

  const calculate = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const encode = await loadEncoder()
      setCount(encode(text))
      setChars([...text].length)
    } catch {
      setCount(null)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SectionHero routeId="calculator" title={t('tokenCalculator')} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">

      {/* toolname/tooldescription annotate the form for WebMCP agents; the same
          capability is registered as the count_tokens tool in lib/webmcp.ts. */}
      <form
        toolname="count_tokens"
        tooldescription="Count the number of LLM tokens (js-tiktoken GPT-2 encoding) in a piece of text. Runs locally in the browser; the text is not uploaded."
        onSubmit={(event) => {
          event.preventDefault()
          calculate()
        }}
        className="space-y-4 border border-hairline bg-surface-raised p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <label htmlFor="token-text" className="text-sm font-medium text-ink">
            {t('calcLabel')}
          </label>
          <p id="token-privacy" className="text-xs text-ink-muted">
            {t('calcPrivacy')}
          </p>
        </div>
        <textarea
          id="token-text"
          aria-describedby="token-privacy"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('enterText')}
          rows={6}
          name="text"
          toolname="text"
          tooldescription="The text whose tokens should be counted"
          className="w-full border border-hairline bg-canvas p-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint transition-colors duration-150 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <button
          type="submit"
          disabled={busy || !text}
          aria-busy={busy}
          className="cursor-pointer bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors duration-200 hover:bg-ink-muted disabled:cursor-not-allowed disabled:bg-hairline disabled:text-ink-muted"
        >
          {t('calculateTokens')}
        </button>
        <div aria-live="polite">
          {count !== null && (
            <dl className="grid grid-cols-2 border-t border-hairline pt-5">
              <div>
                <dt className="label text-ink-muted">{t('numberOfTokens')}</dt>
                <dd className="display-l mt-3 font-mono tabular-nums">{nf.format(count)}</dd>
              </div>
              <div className="border-s border-hairline ps-5">
                <dt className="label text-ink-muted">{t('calcCharsUnit')}</dt>
                <dd className="display-l mt-3 font-mono tabular-nums text-ink-muted">{nf.format(chars)}</dd>
              </div>
            </dl>
          )}
        </div>
        {failed && (
          <p role="alert" className="bg-surface p-4 text-sm font-medium text-ink">
            {t('encoderLoadFailed')}
          </p>
        )}
      </form>

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

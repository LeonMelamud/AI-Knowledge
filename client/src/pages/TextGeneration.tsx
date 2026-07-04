import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'

interface Usage {
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
}

export default function TextGeneration() {
  const { t } = useI18n()
  // API key lives in component state only — sent straight to OpenAI, never stored or proxied.
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  usePageMeta(t('generateText'))

  const generate = async () => {
    if (!apiKey || !prompt) {
      setError(t('enterApiKeyAndPrompt'))
      return
    }
    setBusy(true)
    setError('')
    setResult('')
    setUsage(null)
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data.choices?.[0]?.message?.content ?? '')
      if (data.usage) setUsage(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('textGenerationError'))
    } finally {
      setBusy(false)
    }
  }

  const usageText =
    usage &&
    t('tokensUsed')
      .replace('{total}', String(usage.total_tokens))
      .replace('{prompt}', String(usage.prompt_tokens))
      .replace('{completion}', String(usage.completion_tokens))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('generateText')}</h1>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t('enterApiKey')}
          autoComplete="off"
          dir="ltr"
          className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('enterPrompt')}
          rows={5}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? '…' : t('generateText')}
        </button>

        {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {result && (
          <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {result}
          </div>
        )}
        {usageText && <p className="text-xs text-slate-500">{usageText}</p>}
      </div>
    </div>
  )
}

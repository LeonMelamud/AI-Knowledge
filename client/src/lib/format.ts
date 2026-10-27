import type { Lang } from './data'

/** Fill `{name}` placeholders in a translated string. */
export const fill = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))

export const localeOf = (lang: Lang) => (lang === 'he' ? 'he-IL' : 'en-US')

/**
 * Long-form date for a YYYY-MM-DD string. Parsed as UTC and formatted in UTC so
 * "2026-08-22" never renders as the 21st for a visitor west of Greenwich.
 */
export const formatDay = (isoDay: string, lang: Lang): string =>
  new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(localeOf(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

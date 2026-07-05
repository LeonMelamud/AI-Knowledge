// Retention housekeeping: physically removes news sections older than N months
// (default 6) from news_en.yaml and news_he.yaml. The app already hides expired
// sections at runtime (src/lib/data.ts); this keeps the files and JS bundle lean.
// Usage: node scripts/prune-news.mjs [months]
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { load, dump } from 'js-yaml'

const MONTHS = Number(process.argv[2] ?? 6)
const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')

const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() - MONTHS)

for (const lang of ['en', 'he']) {
  const file = path.join(DATA_DIR, `news_${lang}.yaml`)
  const data = load(readFileSync(file, 'utf8'))
  const before = data.hot_news.length

  for (const section of data.hot_news) {
    if (!section.date) console.warn(`prune-news [${lang}]: section "${section.section}" has no date — kept, please add one`)
  }
  data.hot_news = data.hot_news.filter((s) => !s.date || new Date(s.date) >= cutoff)

  const removed = before - data.hot_news.length
  if (removed > 0) {
    writeFileSync(file, dump(data, { lineWidth: 100 }))
    console.log(`prune-news [${lang}]: removed ${removed} of ${before} sections (older than ${MONTHS} months)`)
  } else {
    console.log(`prune-news [${lang}]: nothing to remove (${before} sections)`)
  }
}

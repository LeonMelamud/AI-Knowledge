import conceptsEnRaw from '../../data/concepts_en.yaml'
import conceptsHeRaw from '../../data/concepts_he.yaml'
import linksEnRaw from '../../data/links_en.yaml'
import linksHeRaw from '../../data/links_he.yaml'
import newsEnRaw from '../../data/news_en.yaml'
import newsHeRaw from '../../data/news_he.yaml'

export interface QA {
  question: string
  answer: string
}

export interface ConceptItem {
  name: string
  shortDescription: string
  fullDescription?: string
  codeExample?: string
  images?: string[]
  commonQuestions?: QA[]
  relatedConcepts?: string[]
}

export interface ConceptSection {
  id: string
  title: string
  items: ConceptItem[]
}

export interface ToolItem {
  name: string
  company?: string
  url?: string
  description?: string
  recentUpdates?: string
}

export interface ToolSection {
  id: string
  title: string
  items: ToolItem[]
}

export interface NewsTopic {
  title: string
  description?: string
  questions?: QA[]
  images?: string[]
  links?: { name: string; url: string }[]
}

export interface NewsSection {
  section: string
  /** YYYY-MM-DD; sections older than NEWS_MAX_AGE_MONTHS are hidden automatically */
  date?: string
  topics: NewsTopic[]
}

export const NEWS_MAX_AGE_MONTHS = 6

function isFresh(section: NewsSection): boolean {
  if (!section.date) return true // undated legacy sections stay visible; prune script flags them
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - NEWS_MAX_AGE_MONTHS)
  return new Date(section.date) >= cutoff
}

export type Lang = 'en' | 'he'

// YAML images come as strings or {url, alt} objects with legacy ./css/images/ paths;
// components render `${BASE_URL}images/<name>`, so reduce every shape to the file name.
function normalizeImages(item: { images?: unknown[] }) {
  if (!Array.isArray(item.images)) return
  item.images = item.images
    .map((img) => {
      const url = typeof img === 'string' ? img : (img as { url?: string })?.url ?? ''
      return url.split('/').pop() ?? ''
    })
    .filter(Boolean)
}

const conceptsByLang: Record<Lang, ConceptSection[]> = {
  en: (conceptsEnRaw as { concepts: ConceptSection[] }).concepts,
  he: (conceptsHeRaw as { concepts: ConceptSection[] }).concepts,
}
Object.values(conceptsByLang).forEach((sections) => sections.forEach((s) => s.items.forEach(normalizeImages)))

const toolsByLang: Record<Lang, ToolSection[]> = {
  en: (linksEnRaw as { tools: ToolSection[] }).tools,
  he: (linksHeRaw as { tools: ToolSection[] }).tools,
}

const newsByLang: Record<Lang, NewsSection[]> = {
  en: (newsEnRaw as { hot_news: NewsSection[] }).hot_news,
  he: (newsHeRaw as { hot_news: NewsSection[] }).hot_news,
}
Object.values(newsByLang).forEach((sections) => sections.forEach((s) => s.topics.forEach(normalizeImages)))

export function getConcepts(lang: Lang): ConceptSection[] {
  return conceptsByLang[lang] ?? conceptsByLang.en
}

export function getTools(lang: Lang): ToolSection[] {
  return toolsByLang[lang] ?? toolsByLang.en
}

export function getNews(lang: Lang): NewsSection[] {
  return (newsByLang[lang] ?? newsByLang.en).filter(isFresh)
}

/** Hebrew news lags behind English; append the untranslated English tail so both languages see all news. */
// ponytail: positional heuristic (sections aren't keyed across languages); key them if translations catch up
export function getNewsWithFallback(lang: Lang): { sections: NewsSection[]; extraEnglish: NewsSection[] } {
  const sections = getNews(lang)
  if (lang === 'en') return { sections, extraEnglish: [] }
  const en = getNews('en')
  return { sections, extraEnglish: en.length > sections.length ? en.slice(sections.length) : [] }
}

export function findSection(lang: Lang, id: string):
  | { kind: 'concept'; section: ConceptSection }
  | { kind: 'tool'; section: ToolSection }
  | null {
  const concept = getConcepts(lang).find((s) => s.id === id)
  if (concept) return { kind: 'concept', section: concept }
  const tool = getTools(lang).find((s) => s.id === id)
  if (tool) return { kind: 'tool', section: tool }
  return null
}

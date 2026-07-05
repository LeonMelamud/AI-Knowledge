import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import en from '../../../public/data/ui_translations_en.json'
import he from '../../../public/data/ui_translations_he.json'
import type { Lang } from './data'

type Translations = Record<string, string | string[]>

const translations: Record<Lang, Translations> = {
  en: en as Translations,
  he: he as Translations,
}

interface I18n {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (lang: Lang) => void
  t: (key: string) => string
  tList: (key: string) => string[]
}

const I18nContext = createContext<I18n | null>(null)

function initialLang(): Lang {
  const stored = localStorage.getItem('lang')
  if (stored === 'en' || stored === 'he') return stored
  return navigator.language.startsWith('he') ? 'he' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = (next: Lang) => {
    localStorage.setItem('lang', next)
    setLangState(next)
  }

  const t = (key: string) => {
    const value = translations[lang][key] ?? translations.en[key]
    return typeof value === 'string' ? value : key
  }

  const tList = (key: string) => {
    const value = translations[lang][key] ?? translations.en[key]
    return Array.isArray(value) ? value : []
  }

  return <I18nContext.Provider value={{ lang, dir, setLang, t, tList }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { formatMoney as formatMoneyValue } from '../utils/formatMoney'
import { translations } from './locales'
import { LANGUAGE_STORAGE_KEY, readStoredLanguage } from './active'
import type { Language, TranslationSchema } from './types'

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationSchema
  formatMoney: (value: number) => string
  formatDate: (iso: string) => string
  interpolate: (text: string, vars: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider(props: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    const { app } = translations[language]
    document.title = `${app.nameLine1} ${app.nameLine2}`
  }, [language])

  const interpolate = useCallback(
    (text: string, vars: Record<string, string | number>) => {
      return Object.entries(vars).reduce(
        (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
        text,
      )
    },
    [],
  )

  const locale = language === 'de' ? 'de-DE' : 'en-US'

  const formatMoney = useCallback((value: number) => formatMoneyValue(value), [])

  const formatDate = useCallback(
    (iso: string) => {
      const d = new Date(iso + 'T00:00:00')
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    },
    [locale],
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      formatMoney,
      formatDate,
      interpolate,
    }),
    [language, setLanguage, formatMoney, formatDate, interpolate],
  )

  return (
    <LanguageContext.Provider value={value}>
      {props.children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}

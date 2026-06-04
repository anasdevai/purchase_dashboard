import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translations } from './locales'
import type { Language, TranslationSchema } from './types'

const STORAGE_KEY = 'device-contract-app-language'

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationSchema
  formatMoney: (value: number) => string
  formatDate: (iso: string) => string
  interpolate: (text: string, vars: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'de' || stored === 'en') return stored
  } catch {
    // ignore
  }
  return 'de'
}

export function LanguageProvider(props: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }, [])

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

  const formatMoney = useCallback(
    (value: number) =>
      value.toLocaleString(locale, { style: 'currency', currency: 'USD' }),
    [locale],
  )

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

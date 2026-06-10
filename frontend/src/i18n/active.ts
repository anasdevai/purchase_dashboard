import { translations } from './locales'
import type { Language } from './types'

export const LANGUAGE_STORAGE_KEY = 'device-contract-app-language'

export function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'de' || stored === 'en') return stored
  } catch {
    // ignore
  }
  return 'de'
}

/**
 * Returns the translations for the currently selected language.
 * For use in non-React modules (API clients, services) that cannot
 * access the LanguageProvider context.
 */
export function getActiveTranslations() {
  return translations[readStoredLanguage()]
}

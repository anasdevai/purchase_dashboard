import { Globe } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { Language } from '../../i18n/types'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Globe className="hidden h-4 w-4 text-slate-500 sm:block" aria-hidden />
      <label className="sr-only" htmlFor="language-select">
        {t.language.label}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light sm:h-9 sm:px-2.5 sm:text-sm"
        aria-label={t.language.label}
      >
        <option value="de">{t.language.de}</option>
        <option value="en">{t.language.en}</option>
      </select>
    </div>
  )
}

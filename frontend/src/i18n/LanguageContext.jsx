import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'dk-site-language'

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'uk'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'uk'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = (value) => {
    const next = value === 'en' ? 'en' : 'uk'
    setLanguageState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'uk'
    document.body.dataset.language = language
  }, [language])

  const value = useMemo(() => ({
    language,
    isEnglish: language === 'en',
    locale: language === 'en' ? 'en-US' : 'uk-UA',
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'en' ? 'uk' : 'en'),
    pick: (ukValue, enValue) => language === 'en' ? enValue : ukValue,
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}

export function LanguageSwitcher({ compact = false, className = '' }) {
  const { language, setLanguage } = useLanguage()
  return (
    <div className={`language-switcher ${compact ? 'is-compact' : ''} ${className}`.trim()} role="group" aria-label={language === 'en' ? 'Website language' : 'Мова сайту'}>
      <button type="button" className={language === 'uk' ? 'is-active' : ''} onClick={() => setLanguage('uk')} aria-pressed={language === 'uk'}>UA</button>
      <span aria-hidden="true" />
      <button type="button" className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
    </div>
  )
}

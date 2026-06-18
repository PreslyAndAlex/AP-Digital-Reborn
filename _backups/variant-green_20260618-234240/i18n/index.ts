import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { bg } from './bg'

export const SUPPORTED = ['en', 'bg'] as const
export type Lang = (typeof SUPPORTED)[number]

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null
const initialLang: Lang = stored === 'bg' || stored === 'en' ? stored : 'bg'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // arrays/objects (faq items, stats, project types) are read whole via t()
  returnObjects: true,
})

const applyLang = (lng: string) => {
  document.documentElement.lang = lng
  // Keep the tab title and meta description in the visitor's language.
  // Crawlers index the static (Bulgarian) versions baked into index.html.
  document.title = i18n.t('meta.title')
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('meta.description'))
}

applyLang(i18n.language)
i18n.on('languageChanged', (lng) => {
  applyLang(lng)
  try {
    localStorage.setItem('lang', lng)
  } catch {
    /* storage may be unavailable; non-fatal */
  }
})

export default i18n

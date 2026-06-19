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

const setMeta = (selector: string, value: string) => {
  document.querySelector(selector)?.setAttribute('content', value)
}

type FaqItem = { q: string; a: string }

// Add/refresh a FAQPage rich-results schema from the translated FAQ content,
// so it stays in sync with the active language (single source of truth).
const injectFaqJsonLd = () => {
  const items = i18n.t('faq.items', { returnObjects: true }) as FaqItem[]
  if (!Array.isArray(items) || items.length === 0) return
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: i18n.language,
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
  let el = document.getElementById('faq-jsonld') as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = 'faq-jsonld'
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

const applyLang = (lng: string) => {
  document.documentElement.lang = lng
  const title = i18n.t('meta.title')
  const description = i18n.t('meta.description')
  // Tab title + meta description in the visitor's language. Crawlers index the
  // static (Bulgarian) copy baked into index.html.
  document.title = title
  setMeta('meta[name="description"]', description)
  // Keep the social cards (Open Graph + Twitter) in sync with the language.
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', description)
  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', description)
  setMeta('meta[property="og:locale"]', lng === 'bg' ? 'bg_BG' : 'en_US')
  injectFaqJsonLd()
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

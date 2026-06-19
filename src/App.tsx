import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Hero from './components/Hero'
import Bento from './components/Bento'
import Examples from './components/Examples'
import Scrub from './components/Scrub'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import FormModal from './components/FormModal'
import { gsap, ScrollTrigger, useGSAP, reduceMotion } from './lib/gsap'
import './App.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [formOpen, setFormOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  // Always open at the hero — don't restore a previous scroll position.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // Close the mobile menu on Escape and whenever we grow back to desktop width.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const mq = window.matchMedia('(min-width: 761px)')
    const onWide = () => mq.matches && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onWide)
    }
  }, [])

  // Page-level scroll choreography: the [data-reveal] lift batch + nav frosting.
  useGSAP(() => {
    if (!reduceMotion) {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 86%',
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: true,
          }),
      })
    }

    const nav = document.querySelector('.nav')
    if (nav) {
      ScrollTrigger.create({
        start: 60,
        end: 99999,
        onUpdate: (self) => nav.classList.toggle('is-solid', self.scroll() > 60),
      })
    }

    // The web font swaps in after first paint and shifts every trigger offset.
    if ('fonts' in document) document.fonts.ready.then(() => ScrollTrigger.refresh())
  })

  const openForm = () => setFormOpen(true)
  const year = new Date().getFullYear()

  return (
    <>
      <a className="skip-link" href="#work">
        {t('nav.skip')}
      </a>
      <div className="grain" aria-hidden="true" />

      <nav className="nav" aria-label="Primary">
        <a className="nav__brand" href="#top" onClick={closeMenu}>
          <b>A&amp;P</b>
          <span>DIGITAL</span>
        </a>

        <button
          type="button"
          className={`nav__burger${menuOpen ? ' is-open' : ''}`}
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav__right${menuOpen ? ' is-open' : ''}`} id="nav-menu">
          <div className="nav__links">
            <a href="#how" onClick={closeMenu}>
              {t('nav.process')}
            </a>
            <a href="#work" onClick={closeMenu}>
              {t('nav.work')}
            </a>
            <a href="#faq" onClick={closeMenu}>
              {t('nav.faq')}
            </a>
          </div>
          <div className="nav__lang" role="group" aria-label={t('nav.langLabel')}>
            <button
              type="button"
              className={`nav__lang-opt${lang === 'en' ? ' is-active' : ''}`}
              onClick={() => i18n.changeLanguage('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <span className="nav__lang-sep" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className={`nav__lang-opt${lang === 'bg' ? ' is-active' : ''}`}
              onClick={() => i18n.changeLanguage('bg')}
              aria-pressed={lang === 'bg'}
            >
              BG
            </button>
          </div>
          <button
            type="button"
            className="btn btn--accent btn--sm nav__cta"
            onClick={() => {
              closeMenu()
              openForm()
            }}
          >
            {t('nav.cta')}
          </button>
        </div>
      </nav>

      <main>
        <Hero onStart={openForm} />
        <Bento />
        <Examples />
        <Scrub />
        <FAQ />
        <Contact onStart={openForm} />
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer__big">{t('footer.big')}</p>

          <div className="footer__grid">
            <div className="footer__brand">
              <b>A&amp;P DIGITAL</b>
              <p>{t('footer.brandLine')}</p>
            </div>
            <div className="footer__col">
              <h4>{t('footer.studio')}</h4>
              <a href="#how">{t('nav.process')}</a>
              <a href="#work">{t('nav.work')}</a>
              <a href="#faq">{t('nav.faq')}</a>
            </div>
            <div className="footer__col">
              <h4>{t('footer.services')}</h4>
              <button type="button" className="footer__link" onClick={openForm}>
                {t('footer.svc.web')}
              </button>
              <button type="button" className="footer__link" onClick={openForm}>
                {t('footer.svc.apps')}
              </button>
              <button type="button" className="footer__link" onClick={openForm}>
                {t('footer.svc.shop')}
              </button>
              <button type="button" className="footer__link" onClick={openForm}>
                {t('footer.svc.ai')}
              </button>
            </div>
            <div className="footer__col">
              <h4>{t('footer.contact')}</h4>
              <a href="mailto:aandpdigitalservices@gmail.com">aandpdigitalservices@gmail.com</a>
              <a href="tel:+359899413431">089 941 3431</a>
              <button type="button" className="footer__link footer__link--accent" onClick={openForm}>
                {t('nav.cta')}
              </button>
            </div>
          </div>

          <div className="footer__base">
            <span className="footer__credit">{t('footer.rights', { year })}</span>
            <span className="footer__dot" aria-hidden="true" />
            <span>{t('footer.tagline')}</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>{formOpen && <FormModal onClose={() => setFormOpen(false)} />}</AnimatePresence>
    </>
  )
}

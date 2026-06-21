import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import './FormModal.css'
import './PrivacyModal.css'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  onClose: () => void
}

export default function PrivacyModal({ onClose }: Props) {
  const { t } = useTranslation()
  const collectItems = t('privacy.collectItems', { returnObjects: true }) as string[]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <motion.div
      className="fm-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className="fm-dialog pm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('privacy.title')}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.97 }}
        transition={{ duration: 0.3, ease }}
      >
        <button className="fm-close" onClick={onClose} aria-label={t('examples.close')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="pm-head">
          <h2 className="pm-title">{t('privacy.title')}</h2>
          <p className="pm-intro">{t('privacy.intro')}</p>
        </div>

        <div className="pm-body">
          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.collectTitle')}</h3>
            <ul className="pm-list">
              {collectItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.useTitle')}</h3>
            <p>{t('privacy.useBody')}</p>
          </section>

          <section className="pm-section pm-section--highlight">
            <h3 className="pm-section-title">{t('privacy.emailPhoneTitle')}</h3>
            <p>
              <strong>{t('privacy.emailPhoneHighlight')}</strong>{' '}
              {t('privacy.emailPhoneBody')}
            </p>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.spamTitle')}</h3>
            <p>{t('privacy.spamBody')}</p>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.turnstileTitle')}</h3>
            <p>
              {t('privacy.turnstileBody')}{' '}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="pm-link"
              >
                cloudflare.com/privacypolicy
              </a>
              .
            </p>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.cookiesTitle')}</h3>
            <p>{t('privacy.cookiesBody')}</p>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.gdprTitle')}</h3>
            <p>{t('privacy.gdprBody')}</p>
          </section>

          <section className="pm-section">
            <h3 className="pm-section-title">{t('privacy.contactTitle')}</h3>
            <p>
              {t('privacy.contactBody')}{' '}
              <a href="mailto:aandpdigitalservices@gmail.com" className="pm-link">
                aandpdigitalservices@gmail.com
              </a>
              .
            </p>
          </section>

          <p className="pm-updated">{t('privacy.updated')}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

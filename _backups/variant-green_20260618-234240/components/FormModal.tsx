import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ContactForm from './ContactForm'
import './FormModal.css'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  onClose: () => void
}

/**
 * The contact form in a popup — opened by the giant CTA button, the nav, and
 * the hero. Closes on backdrop click or Escape; locks background scroll while
 * open. Same modal grammar as the project preview.
 */
export default function FormModal({ onClose }: Props) {
  const { t } = useTranslation()

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
        className="fm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('contact.form.send')}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.97 }}
        transition={{ duration: 0.3, ease }}
      >
        <button className="fm-close" onClick={onClose} aria-label={t('examples.close')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="fm-head">
          <span className="eyebrow">{t('contact.eyebrow')}</span>
          <h2 className="h2">
            {t('contact.titlePre')}
            <span className="gradient-text">{t('contact.titleH1')}</span>
            {t('contact.titleMid')}
            <span className="gradient-text">{t('contact.titleH2')}</span>
          </h2>
          <p className="fm-lead">{t('contact.lead')}</p>
        </div>

        <ContactForm />
      </motion.div>
    </motion.div>
  )
}

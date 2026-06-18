import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Faq } from '../data/faqs'
import './FAQ.css'

const ease = [0.22, 1, 0.36, 1] as const

export default function FAQ() {
  const { t } = useTranslation()
  const faqs = t('faq.items', { returnObjects: true }) as Faq[]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="tile tile--dark faq" id="faq">
      <div className="container faq-grid">
        <motion.div
          className="faq-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease }}
        >
          <span className="eyebrow">{t('faq.eyebrow')}</span>
          <h2 className="h2">
            {t('faq.titlePrefix')}
            <span className="gradient-text">{t('faq.titleHighlight')}</span>
          </h2>
          <p className="lead muted">{t('faq.lead')}</p>
        </motion.div>

        <div className="faq-list">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div className={`faq-item ${isOpen ? 'is-open' : ''}`} key={item.q}>
                <button
                  className="faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer-wrap"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <p className="faq-answer">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

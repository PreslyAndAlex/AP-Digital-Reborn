import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Project } from '../data/examples'
import './ProjectModal.css'

type Props = {
  project: Project
  catLabel: (c: string) => string
  onClose: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

/**
 * A large, near-full-bleed preview of a project. Real hosted URLs are embedded
 * in an interactive <iframe>, unless the site sends frame-blocking headers
 * (`noEmbed`), in which case the screenshot is shown with an "Open Live" link.
 * Demo placeholders without a real URL show the card artwork with a "coming
 * soon" note instead.
 */
export default function ProjectModal({ project, catLabel, onClose }: Props) {
  const { t } = useTranslation()
  const isLive = /^https?:\/\//i.test(project.href)
  const canEmbed = isLive && !project.noEmbed

  // Close on Escape and lock background scroll while open.
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

  // Portal to <body>: every .tile section sets `isolation: isolate`, so rendered
  // in place the modal's z-index only ranks it inside #work and the next
  // section paints over it.
  return createPortal(
    <motion.div
      className="pm-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className="pm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.3, ease }}
      >
        <header className="pm-bar">
          <span className="pm-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="pm-url">{project.domain}</span>
          <div className="pm-meta">
            <span className="pm-title">{project.title}</span>
            <span className="pm-cat">{project.categories.map(catLabel).join(' · ')}</span>
          </div>
          <div className="pm-actions">
            {isLive && (
              <a className="pm-open" href={project.href} target="_blank" rel="noreferrer">
                {t('examples.openLive')}
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
            <button className="pm-close" onClick={onClose} aria-label={t('examples.close')}>
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
          </div>
        </header>

        <div className="pm-body">
          {canEmbed ? (
            <iframe
              className="pm-frame"
              src={project.href}
              title={project.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : isLive ? (
            <a
              className="pm-placeholder pm-placeholder--live"
              href={project.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} — ${t('examples.noEmbed')}`}
              style={
                project.image
                  ? { backgroundImage: `url(${project.image})` }
                  : { backgroundImage: project.gradient }
              }
            >
              <span className="pm-noembed">
                {t('examples.noEmbed')}
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          ) : (
            <div
              className="pm-placeholder"
              role="img"
              aria-label={project.title}
              style={
                project.image
                  ? { backgroundImage: `url(${project.image})` }
                  : { backgroundImage: project.gradient }
              }
            >
              <span className="pm-soon">{t('examples.demoSoon')}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

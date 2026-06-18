import { useMemo, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { categories, projects, type Project } from '../data/examples'
import ProjectModal from './ProjectModal'
import './Examples.css'

const ease = [0.22, 1, 0.36, 1] as const

// canonical category key -> translation key
const catKey: Record<string, string> = {
  All: 'all',
  'Web Apps': 'webApps',
  'Web Design': 'webDesign',
  'E-Commerce': 'ecommerce',
}

export default function Examples() {
  const { t } = useTranslation()
  const catLabel = (c: string) => t(`examples.categories.${catKey[c]}`)
  const [active, setActive] = useState<(typeof categories)[number]>('All')
  const [preview, setPreview] = useState<Project | null>(null)

  const shown = useMemo(
    () => (active === 'All' ? projects : projects.filter((p) => p.category === active)),
    [active],
  )

  // Left-click opens the in-page preview; modifier/middle clicks still open the
  // live site in a new tab via the underlying link.
  const openPreview = (e: MouseEvent, p: Project) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    setPreview(p)
  }

  return (
    <section className="tile tile--darker examples" id="work">
      <div className="container">
        <motion.div
          className="head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease }}
        >
          <span className="eyebrow">{t('examples.eyebrow')}</span>
          <h2 className="h2">{t('examples.title')}</h2>
          <p className="lead muted">{t('examples.lead')}</p>
        </motion.div>

        <div className="examples-filters" role="tablist" aria-label="Filter projects">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={active === cat}
              className={`filter-pill ${active === cat ? 'is-active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {catLabel(cat)}
            </button>
          ))}
        </div>

        <div className="examples-grid">
          {shown.map((p, i) => (
            <motion.a
              key={p.id}
              className="project-card"
              href={p.href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => openPreview(e, p)}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease, delay: (i % 2) * 0.07 }}
            >
              <div className="project-frame">
                <div className="project-chrome">
                  <span className="project-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="project-url">{p.domain}</span>
                </div>
                <div
                  className="project-shot"
                  role="img"
                  aria-label={`${p.title} — ${catLabel(p.category)}`}
                  style={
                    p.image
                      ? { backgroundImage: `url(${p.image})` }
                      : { backgroundImage: p.gradient }
                  }
                >
                  {!p.image && (
                    <div className="project-skeleton" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                </div>
              </div>

              <div className="project-meta">
                <div>
                  <h3 className="project-title">{p.title}</h3>
                  <span className="project-cat">{catLabel(p.category)}</span>
                </div>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <ProjectModal project={preview} catLabel={catLabel} onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}

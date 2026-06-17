import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap, useGSAP, reduceMotion, splitScrub } from '../lib/gsap'
import './Scrub.css'

/**
 * A headline whose words light up one by one as you scroll past it — the
 * Haldane "scrub" effect, here speaking to how we build sites. Accent words
 * (from i18n) glow blue. Re-splits when the language changes.
 */
export default function Scrub() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const text = t('scrub.text')
  const accent = t('scrub.accent')

  useGSAP(
    () => {
      const el = root.current!.querySelector<HTMLElement>('.scrub')!
      const words = splitScrub(el)
      if (reduceMotion) {
        gsap.set(words, { opacity: 1 })
        return
      }
      gsap.to(words, {
        opacity: 1,
        stagger: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 62%', scrub: 0.5 },
      })
    },
    { scope: root, dependencies: [text] },
  )

  return (
    <section className="tile tile--dark scrub-section" ref={root}>
      <div className="container container--text">
        <p className="scrub" data-accent={accent}>
          {text}
        </p>
      </div>
    </section>
  )
}

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import { gsap, useGSAP, reduceMotion } from '../lib/gsap'
import './Hero.css'

type Step = { n: string; title: string; body: string }

type HeroProps = {
  /** Opens the contact form modal (shared with the nav + CTA section). */
  onStart: () => void
}

/**
 * Pinned hero. The reveal video is a full-screen background (monitor sits on
 * the right; a black scrim keeps the left readable). The brand copy sits
 * top-left and fades out as the build-process boxes snap in one by one — each
 * new box stacking *under* the previous (they accumulate). The reveals track
 * scroll near-instantly (minimal scrub) so it feels snappy, not laggy.
 */
export default function Hero({ onStart }: HeroProps) {
  const { t } = useTranslation()
  const steps = t('hero.steps', { returnObjects: true }) as Step[]
  const root = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useGSAP(
    () => {
      const scope = root.current!
      const intro = scope.querySelector<HTMLElement>('.hero__intro')!
      const pin = scope.querySelector<HTMLElement>('.hero__pin')!
      const cue = scope.querySelector<HTMLElement>('.hero__cue')
      const stepsTitle = scope.querySelector<HTMLElement>('.hero__steps-eyebrow')
      const boxes = gsap.utils.toArray<HTMLElement>('.hstep', scope)

      // Play the reveal video once, with a slight delay after load.
      gsap.delayedCall(0.9, () => {
        videoRef.current?.play().catch(() => {})
      })

      if (reduceMotion) {
        gsap.set([stepsTitle, ...boxes], { autoAlpha: 1, y: 0 })
        return
      }

      const mm = gsap.matchMedia()

      // Desktop / tablet: pin; the intro gives way to an accumulating stack.
      mm.add('(min-width: 761px)', () => {
        const n = boxes.length
        gsap.set(boxes, { autoAlpha: 0, y: 22 })
        if (stepsTitle) gsap.set(stepsTitle, { autoAlpha: 0, y: 14 })
        gsap.set(intro, { autoAlpha: 1 })

        // one snap stop for the intro plus one per box
        const stops = Array.from({ length: n + 1 }, (_, i) => i / n)

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            // short pin — a single scroll tick covers most of a segment
            end: '+=' + (n * 42 + 20) + '%',
            pin: true,
            // tracks scroll almost 1:1 (no lag)
            scrub: 0.05,
            anticipatePin: 1,
            snap: {
              snapTo: stops,
              duration: { min: 0.05, max: 0.12 },
              ease: 'power2.out',
              delay: 0,
            },
          },
        })

        // intro recedes quickly; the stack heading fades in
        tl.to(intro, { autoAlpha: 0, y: -16, duration: 0.25, ease: 'power2.in' }, 0)
        if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.18 }, 0)
        if (stepsTitle) tl.to(stepsTitle, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.08)

        // each box starts revealing right at its segment start and finishes
        // within a tiny slice — so a single scroll input pops it in, fast
        boxes.forEach((b, i) => {
          tl.to(b, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(1.8)' }, i + 0.02)
        })
        tl.to({}, { duration: 0.001 }, n) // pad the timeline to a clean length
      })

      // Phones: no pin — show the intro and all boxes stacked normally.
      mm.add('(max-width: 760px)', () => {
        gsap.set([stepsTitle, ...boxes], { clearProps: 'opacity,visibility,transform' })
        gsap.set([stepsTitle, ...boxes], { autoAlpha: 1 })
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <header className="hero" id="top" ref={root}>
      <div className="hero__pin">
        {/* full-screen reveal video background — monitor on the right */}
        <div className="hero__media">
          <video
            ref={videoRef}
            className="hero__video"
            src="/website-reveal-bg-hero.mp4"
            muted
            playsInline
            preload="auto"
          />
        </div>
        {/* black scrim keeps the left side (text) readable over the video */}
        <div className="hero__scrim" aria-hidden="true" />

        {/* left: intro copy that gives way to the accumulating step stack */}
        <div className="hero__left">
          <div className="hero__intro">
            <div className="hero__logo">
              <Logo variant="transparent" size={160} />
            </div>
            <h1 className="hero__tagline">{t('hero.tagline')}</h1>
            <p className="hero__lead">{t('hero.lead')}</p>
            <div className="hero__cta">
              <button type="button" className="btn btn--accent" onClick={onStart}>
                {t('hero.ctaPrimary')}
              </button>
              <a className="btn btn--ghost" href="#work">
                {t('hero.ctaSecondary')}
              </a>
            </div>
          </div>

          <div className="hero__steps">
            <span className="hero__steps-eyebrow eyebrow">{t('hero.stepsTitle')}</span>
            {steps.map((s, i) => (
              <article className="hstep" key={i}>
                <span className="hstep__n">{s.n}</span>
                <div className="hstep__c">
                  <h2 className="hstep__title">{s.title}</h2>
                  <p className="hstep__body">{s.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="hero__cue" aria-hidden="true">
          <span>{t('hero.scroll')}</span>
          <span className="hero__cue-rail" />
        </div>
      </div>
    </header>
  )
}

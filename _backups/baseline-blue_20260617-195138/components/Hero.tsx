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

      // Desktop / tablet: pin the hero and reveal the build-process boxes one
      // at a time. A light scrub keeps the reveals tracking the scroll *as it
      // happens* (so nothing waits for the gesture to end — no lag), while snap
      // settles the scroll onto one discrete step per nudge. Within the first
      // segment the intro clears fully *before* box one drops in, so they never
      // overlap.
      mm.add('(min-width: 761px)', () => {
        const n = boxes.length
        gsap.set(boxes, { autoAlpha: 0, y: 22 })
        if (stepsTitle) gsap.set(stepsTitle, { autoAlpha: 0, y: 14 })
        gsap.set(intro, { autoAlpha: 1, y: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            // one short scroll segment per step — a single nudge advances one
            end: '+=' + n * 40 + '%',
            pin: true,
            anticipatePin: 1,
            // light scrub: reveals follow the scroll instantly, no waiting
            scrub: 0.25,
            snap: {
              snapTo: 1 / n, // one snap stop per step
              duration: { min: 0.1, max: 0.25 },
              ease: 'power2.out',
              delay: 0.02,
            },
          },
        })

        // timeline runs 0…n — one whole unit (= one snap step) per segment.
        // Segment 0: intro recedes, then box one drops in (no shared frame).
        tl.to(intro, { autoAlpha: 0, y: -16, duration: 0.45, ease: 'power2.in' }, 0)
        if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.35 }, 0)
        if (stepsTitle) tl.to(stepsTitle, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.4)
        tl.to(boxes[0], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }, 0.5)

        // each later segment drops in exactly one more box
        for (let i = 1; i < n; i++) {
          tl.to(boxes[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }, i + 0.1)
        }
        tl.to({}, { duration: 0.001 }, n) // pad to a clean segment length
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

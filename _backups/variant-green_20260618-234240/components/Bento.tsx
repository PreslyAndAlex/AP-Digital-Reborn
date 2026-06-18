import { useTranslation } from 'react-i18next'
import './Bento.css'

/**
 * The "how we work" bento — a gapless dense grid (ported from the Haldane
 * example) restyled dark + blue. Mixes a narrative "process" cell with the
 * site's headline numbers (turnaround, projects, satisfaction). Each cell
 * lifts in on scroll via the global [data-reveal] batch.
 */
export default function Bento() {
  const { t } = useTranslation()

  return (
    <section className="tile tile--dark bento-section" id="how">
      <div className="container">
        <div className="head">
          <span className="eyebrow" data-reveal>
            {t('bento.eyebrow')}
          </span>
          <h2 className="h2" data-reveal>
            {t('bento.title')}
          </h2>
          <p className="lead muted" data-reveal>
            {t('bento.lead')}
          </p>
        </div>

        <div className="bento">
          <article className="cell bento__a" data-reveal>
            <div className="cell__art" aria-hidden="true">
              <div className="buildfield">
                <svg viewBox="0 0 300 300" fill="none">
                  <g stroke="rgba(255,255,255,0.07)" strokeWidth="2">
                    <rect x="36" y="46" width="186" height="124" rx="14" />
                    <line x1="36" y1="78" x2="222" y2="78" />
                    <circle cx="54" cy="62" r="4" />
                    <circle cx="70" cy="62" r="4" />
                    <circle cx="86" cy="62" r="4" />
                    <rect x="150" y="158" width="116" height="84" rx="12" />
                    <circle cx="208" cy="120" r="42" />
                    <path d="M150 200h-44v-30" />
                  </g>
                </svg>
              </div>
            </div>
            <div>
              <span className="cell__k">{t('bento.process.k')}</span>
            </div>
            <div>
              <div className="cell__v">{t('bento.process.v')}</div>
              <p className="cell__p">{t('bento.process.p')}</p>
              <p className="cell__p cell__p--faint">{t('bento.process.sub')}</p>
            </div>
          </article>

          <article className="cell bento__b" data-reveal>
            <span className="cell__k">{t('bento.turnaround.k')}</span>
            <div className="cell__big">
              {t('bento.turnaround.big')}
              <sup>{t('bento.turnaround.unit')}</sup>
            </div>
          </article>

          <article className="cell cell--accent bento__c" data-reveal>
            <span className="cell__k">{t('bento.build.k')}</span>
            <div className="cell__v">{t('bento.build.v')}</div>
            <p className="cell__p">{t('bento.build.p')}</p>
          </article>

          <article className="cell bento__d" data-reveal>
            <span className="cell__k">{t('bento.delivered.k')}</span>
            <div className="cell__big">
              {t('bento.delivered.big')}
              <sup>{t('bento.delivered.unit')}</sup>
            </div>
          </article>

          <article className="cell cell--accent bento__e" data-reveal>
            <span className="cell__k">{t('bento.satisfaction.k')}</span>
            <div className="cell__big">
              {t('bento.satisfaction.big')}
              <sup>{t('bento.satisfaction.unit')}</sup>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

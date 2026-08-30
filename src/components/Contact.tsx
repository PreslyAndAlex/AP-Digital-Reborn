import { useTranslation } from 'react-i18next'
import './Contact.css'

type ContactProps = {
  /** Opens the contact form modal. */
  onStart: () => void
}

const socials = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    path: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 2A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5ZM17.5 6a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    path: 'M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.6-1.5H16V5c-.3 0-1.2-.1-2.3-.1C11.3 4.9 10 6.3 10 8.7V11H7.5v3H10v8h3Z',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    path: 'M16 3c.3 2.2 1.6 3.7 3.8 3.9v2.5c-1.3.1-2.5-.3-3.8-1v5.9c0 3.4-2.6 5.7-5.7 5.7A5.6 5.6 0 0 1 5 14.4c0-3.3 3-5.9 6.5-5.2v2.7a3 3 0 0 0-1.2-.2 2.9 2.9 0 1 0 2.9 2.9V3H16Z',
  },
]

/**
 * The closing call-to-action tile. Instead of an inline form, a single giant
 * button opens the contact form in a popup (see FormModal). Brief contact
 * details + socials sit beneath.
 */
export default function Contact({ onStart }: ContactProps) {
  const { t } = useTranslation()

  return (
    <section className="tile tile--void contact" id="contact">
      <div className="container contact-cta">
        <span className="eyebrow" data-reveal>
          {t('contact.eyebrow')}
        </span>
        <h2 className="display" data-reveal>
          {t('contact.ctaTitle')}
        </h2>
        <p className="contact-sub" data-reveal>
          {t('contact.lead')}
        </p>

        <div className="contact-actions" data-reveal>
          <button type="button" className="btn btn--accent btn--lg" onClick={onStart}>
            {t('contact.ctaButton')}
          </button>
        </div>

        <ul className="contact-details" data-reveal>
          <li>
            <span className="contact-details-k">{t('contact.details.emailLabel')}</span>
            <a href="mailto:aandpdigitalservices@gmail.com">aandpdigitalservices@gmail.com</a>
          </li>
          <li>
            <span className="contact-details-k">{t('contact.details.turnaroundLabel')}</span>
            <span>{t('contact.details.turnaroundValue')}</span>
          </li>
          <li>
            <span className="contact-details-k">{t('contact.details.phoneLabel')}</span>
            <a href="tel:+359899413431">089 941 3431</a>
            <a href="tel:+359888358112">088 835 8112</a>
          </li>
        </ul>

        <div className="contact-socials" data-reveal>
          {socials.map((s) => (
            <a
              key={s.name}
              className="social"
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.name}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d={s.path} fill="currentColor" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

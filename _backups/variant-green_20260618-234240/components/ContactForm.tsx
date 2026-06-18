import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Select from './Select'
import './ContactForm.css'

type Errors = Partial<Record<'name' | 'email' | 'message', string>>

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The contact form — fields, client validation, honeypot and the POST to
 * /api/contact. Unchanged behaviour from the original site; only the wrapper
 * (now a modal) and styling differ. On success it shows a confirmation in
 * place of the fields.
 */
export default function ContactForm() {
  const { t, i18n } = useTranslation()
  const projectTypes = t('contact.projectTypes', { returnObjects: true }) as string[]
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  // track the selection by index so it survives a language switch
  const [typeIndex, setTypeIndex] = useState(0)
  const projectType = projectTypes[typeIndex] ?? projectTypes[0]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    // honeypot — humans never see this field; bots fill it and get dropped
    const website = String(data.get('website') ?? '')

    const next: Errors = {}
    if (!name) next.name = t('contact.errors.name')
    if (!email) next.email = t('contact.errors.email')
    else if (!emailRe.test(email)) next.email = t('contact.errors.emailBad')
    if (!message) next.message = t('contact.errors.message')

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setFailed(false)
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          projectType,
          message,
          website,
          lang: i18n.language,
        }),
      })
      if (!res.ok) throw new Error('request_failed')
      setSent(true)
      form.reset()
      setTypeIndex(0)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <p className="cform-success" role="status">
        {t('contact.form.success')}
      </p>
    )
  }

  return (
    <form className="cform" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — visually removed; real visitors never interact with it */}
      <div className="cform-field hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="cform-row">
        <div className="cform-field">
          <label htmlFor="name">{t('contact.form.name')}</label>
          <input id="name" name="name" type="text" placeholder={t('contact.form.namePh')} />
          {errors.name && <span className="cform-error">{errors.name}</span>}
        </div>

        <div className="cform-field">
          <label htmlFor="email">{t('contact.form.email')}</label>
          <input id="email" name="email" type="email" placeholder={t('contact.form.emailPh')} />
          {errors.email && <span className="cform-error">{errors.email}</span>}
        </div>
      </div>

      <div className="cform-row">
        <div className="cform-field">
          <label htmlFor="phone">{t('contact.form.phone')}</label>
          <input id="phone" name="phone" type="tel" placeholder={t('contact.form.phonePh')} />
        </div>

        <div className="cform-field">
          <span className="cform-label" id="type-label">
            {t('contact.form.type')}
          </span>
          <Select
            name="type"
            options={projectTypes}
            value={projectType}
            onChange={(opt) => setTypeIndex(Math.max(0, projectTypes.indexOf(opt)))}
            labelId="type-label"
          />
        </div>
      </div>

      <div className="cform-field">
        <label htmlFor="message">{t('contact.form.details')}</label>
        <textarea id="message" name="message" rows={4} placeholder={t('contact.form.detailsPh')} />
        {errors.message && <span className="cform-error">{errors.message}</span>}
      </div>

      <button className="btn btn--accent cform-submit" type="submit" disabled={sending}>
        {sending ? t('contact.form.sending') : t('contact.form.send')}
      </button>

      {failed && (
        <p className="cform-fail" role="alert">
          {t('contact.form.error')}
        </p>
      )}
    </form>
  )
}

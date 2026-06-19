import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Select from './Select'
import './ContactForm.css'

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Bulgarian phone: national 0 + 9 digits (e.g. 0888 123 456) or international
// +359 + 9 significant digits (also allows 8 for shorter landlines). Any
// spaces / dashes / brackets are stripped before testing.
const bgPhoneRe = /^(?:\+359|0)[1-9]\d{7,8}$/
const NAME_MAX = 30
const MESSAGE_MAX = 5000

const normalizePhone = (p: string) => p.replace(/[\s\-().]/g, '')

// Popular providers used to catch obvious email typos (incl. BG webmail).
const POPULAR_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'yandex.com',
  'abv.bg',
  'mail.bg',
  'dir.bg',
]

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

// If the email's domain is a close miss of a popular one, suggest the fix.
function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 1) return null
  const local = email.slice(0, at)
  const domain = email.slice(at + 1).toLowerCase()
  if (!domain || POPULAR_DOMAINS.includes(domain)) return null
  let best: string | null = null
  let bestDist = Infinity
  for (const d of POPULAR_DOMAINS) {
    const dist = levenshtein(domain, d)
    if (dist < bestDist) {
      bestDist = dist
      best = d
    }
  }
  // only a 1–2 character miss — avoids flagging unrelated domains
  return best && bestDist >= 1 && bestDist <= 2 ? `${local}@${best}` : null
}

export default function ContactForm() {
  const { t, i18n } = useTranslation()
  const projectTypes = t('contact.projectTypes', { returnObjects: true }) as string[]
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  // remembers an email we already warned about (typo) so a re-submit goes through
  const [typoWarnedEmail, setTypoWarnedEmail] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  // track the selection by index so it survives a language switch
  const [typeIndex, setTypeIndex] = useState(0)
  const projectType = projectTypes[typeIndex] ?? projectTypes[0]

  // Turn the server's error codes into the matching localized messages. The
  // server is the source of truth for checks the client can't do (e.g. whether
  // the email domain can actually receive mail).
  const mapServerErrors = (e: Record<string, string>): FieldErrors => {
    const out: FieldErrors = {}
    if (e.name) out.name = e.name === 'too_long' ? t('contact.errors.nameLong') : t('contact.errors.name')
    if (e.email)
      out.email =
        e.email === 'domain'
          ? t('contact.errors.emailDomain')
          : e.email === 'disposable'
            ? t('contact.errors.emailDisposable')
            : e.email === 'invalid'
              ? t('contact.errors.emailBad')
              : t('contact.errors.email')
    if (e.phone) out.phone = t('contact.errors.phone')
    if (e.message)
      out.message =
        e.message === 'too_long' ? t('contact.errors.messageLong') : t('contact.errors.message')
    return out
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    // honeypot — humans never see this field; bots fill it and get dropped
    const website = String(data.get('website') ?? '')

    // client-side checks — each with its own message
    const next: FieldErrors = {}
    if (!name) next.name = t('contact.errors.name')
    else if (name.length > NAME_MAX) next.name = t('contact.errors.nameLong')

    if (!email) next.email = t('contact.errors.email')
    else if (!emailRe.test(email)) next.email = t('contact.errors.emailBad')
    else {
      // soft typo warning — shows once; submitting the same email again proceeds
      const suggestion = suggestEmail(email)
      if (suggestion && typoWarnedEmail !== email) {
        next.email = t('contact.errors.emailTypo', { suggestion })
        setTypoWarnedEmail(email)
      }
    }

    // phone is optional, but if given it must be a valid Bulgarian number
    if (phone && !bgPhoneRe.test(normalizePhone(phone))) next.phone = t('contact.errors.phone')

    // message is optional — only flag it if it runs over the limit
    if (message.length > MESSAGE_MAX) next.message = t('contact.errors.messageLong')

    setErrors(next)
    if (Object.keys(next).length > 0) return

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

      // rate limited
      if (res.status === 429) {
        setFormError(t('contact.errors.rate'))
        return
      }

      const body = await res.json().catch(() => null)

      if (res.ok && body?.ok) {
        setSent(true)
        form.reset()
        setTypeIndex(0)
        return
      }

      // server rejected specific fields (incl. checks the client can't do,
      // like the email-domain deliverability check)
      if (res.status === 400 && body?.errors) {
        setErrors(mapServerErrors(body.errors))
        return
      }

      setFormError(t('contact.form.error'))
    } catch {
      setFormError(t('contact.form.error'))
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
          {errors.phone && <span className="cform-error">{errors.phone}</span>}
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

      {formError && (
        <p className="cform-fail" role="alert">
          {formError}
        </p>
      )}
    </form>
  )
}

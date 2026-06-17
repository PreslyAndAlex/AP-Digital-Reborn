import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const PORT = process.env.PORT || 3002
const isProd = process.env.NODE_ENV === 'production'

// ---------------------------------------------------------------------------
// Mail transport
// ---------------------------------------------------------------------------
// Real SMTP is used when credentials are present in the environment. Until then
// we fall back to a no-network "json" transport so the whole flow is testable
// locally — the composed message is logged to the console instead of sent.
const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
      secure: String(process.env.SMTP_SECURE ?? (Number(process.env.SMTP_PORT) === 465)) === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true })

if (!hasSmtp) {
  console.warn(
    '[mail] SMTP not configured — running in DEV mode. Submissions will be ' +
      'logged to the console, not emailed. Set SMTP_* vars in .env to send for real.',
  )
}

// Where submissions are delivered. Falls back to the SMTP user if unset.
const CONTACT_TO = process.env.CONTACT_TO || process.env.SMTP_USER || 'hello@apdigital.com'
const CONTACT_FROM = process.env.CONTACT_FROM || process.env.SMTP_USER || 'no-reply@apdigital.com'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Trim + cap length to keep payloads sane.
const clean = (v, max = 5000) => String(v ?? '').trim().slice(0, max)

// For fields that end up in email headers (subject, reply-to): also collapse
// CR/LF so crafted input can never smuggle extra headers into the message.
const cleanLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ')

// Very small in-memory rate limiter (per IP). Good enough for a single-node
// deploy; swap for a shared store if you scale horizontally.
const HITS = new Map()
const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 5
function rateLimited(ip) {
  const now = Date.now()
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  HITS.set(ip, arr)
  return arr.length > MAX_HITS
}

// Sweep expired entries so the map can't grow without bound under a bot that
// rotates IPs for days.
setInterval(() => {
  const now = Date.now()
  for (const [ip, arr] of HITS) {
    const live = arr.filter((t) => now - t < WINDOW_MS)
    if (live.length) HITS.set(ip, live)
    else HITS.delete(ip)
  }
}, WINDOW_MS).unref()

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express()

// Behind a reverse proxy (Render/Railway/most hosts) trust the first hop so
// req.ip is the real client address, not the proxy's. Locally there is no
// proxy, so the X-Forwarded-For header stays untrusted and can't be spoofed
// to dodge the rate limit. Override with TRUST_PROXY if your setup differs
// (e.g. TRUST_PROXY=0 when exposing the server directly in production).
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (isProd ? 1 : 0)))

// Security headers. The CSP allows exactly what the site uses: self-hosted
// scripts, inline styles (React/framer-motion), Google Fonts, and https
// iframes for the live project previews.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ['https:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
)

app.use(express.json({ limit: '32kb' }))

// CORS: in production the SPA is served by this same server, so cross-origin
// API access is simply not allowed (no CORS headers at all) unless an extra
// origin is whitelisted via ALLOWED_ORIGIN. In dev, stay permissive for
// convenience (Vite proxies /api anyway).
if (!isProd) app.use(cors())
else if (process.env.ALLOWED_ORIGIN) app.use(cors({ origin: process.env.ALLOWED_ORIGIN }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mail: hasSmtp ? 'smtp' : 'dev-json' })
})

app.post('/api/contact', async (req, res) => {
  // req.ip honours the trust-proxy setting above: the real client IP behind a
  // configured proxy, the socket address otherwise. Never the raw header.
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: 'too_many_requests' })
  }

  // Honeypot: the "website" field is invisible to humans (hidden in CSS) but
  // dumb bots autofill it. Pretend success so they don't adapt; send nothing.
  if (clean(req.body?.website, 200)) {
    return res.json({ ok: true })
  }

  const name = cleanLine(req.body?.name, 200)
  const email = cleanLine(req.body?.email, 320)
  const phone = cleanLine(req.body?.phone, 60)
  const projectType = cleanLine(req.body?.projectType, 120)
  const message = clean(req.body?.message, 5000)
  const lang = cleanLine(req.body?.lang, 8) || 'en'

  // Server-side validation (mirrors the client).
  const errors = {}
  if (!name) errors.name = 'required'
  if (!email) errors.email = 'required'
  else if (!emailRe.test(email)) errors.email = 'invalid'
  if (!message) errors.message = 'required'
  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors })
  }

  const subject = `New project enquiry — ${name}`
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    projectType ? `Project type: ${projectType}` : null,
    `Language: ${lang}`,
    '',
    'Message:',
    message,
  ].filter((l) => l !== null)
  const text = lines.join('\n')

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#0c1020;line-height:1.6">
      <h2 style="margin:0 0 12px">New project enquiry</h2>
      <table style="border-collapse:collapse">
        <tr><td style="padding:2px 12px 2px 0;color:#667"><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#667"><b>Email</b></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:2px 12px 2px 0;color:#667"><b>Phone</b></td><td>${escapeHtml(phone)}</td></tr>` : ''}
        ${projectType ? `<tr><td style="padding:2px 12px 2px 0;color:#667"><b>Project type</b></td><td>${escapeHtml(projectType)}</td></tr>` : ''}
        <tr><td style="padding:2px 12px 2px 0;color:#667"><b>Language</b></td><td>${escapeHtml(lang)}</td></tr>
      </table>
      <p style="margin:16px 0 4px;color:#667"><b>Message</b></p>
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
    </div>`

  try {
    const info = await transporter.sendMail({
      from: `"A&P Digital — Website" <${CONTACT_FROM}>`,
      to: CONTACT_TO,
      replyTo: `"${name}" <${email}>`,
      subject,
      text,
      html,
    })

    if (!hasSmtp) {
      // Dev fallback: show exactly what would have been emailed.
      console.log('\n[mail:dev] Contact submission (not sent — SMTP unset):')
      console.log(text, '\n')
    } else {
      console.log(`[mail] sent ${info.messageId} -> ${CONTACT_TO}`)
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('[mail] send failed:', err)
    return res.status(500).json({ ok: false, error: 'send_failed' })
  }
})

// ---------------------------------------------------------------------------
// Static frontend (production) — serve the built SPA from the same server.
// ---------------------------------------------------------------------------
if (isProd) {
  const dist = path.join(ROOT, 'dist')
  app.use(express.static(dist))
  // SPA fallback for any non-API route.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} (${isProd ? 'production' : 'dev'})`)
})

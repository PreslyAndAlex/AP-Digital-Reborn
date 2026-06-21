import dotenv from 'dotenv'
import path from 'node:path'

// In dev, let .env win over any ambient vars the launcher injects. Some dev
// tools set PORT (e.g. to the frontend's port), which would otherwise hijack
// the API port and collide with Vite. In production the host's env is
// authoritative (there's normally no .env on the server).
dotenv.config({ override: process.env.NODE_ENV !== 'production' })
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import nodemailer from 'nodemailer'
import { promises as dnsp } from 'node:dns'
import { createRequire } from 'node:module'

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
      // Hard timeouts so a slow/hung mail server can't pin a request worker open.
      connectionTimeout: 10_000, // TCP connect
      greetingTimeout: 10_000, // wait for the SMTP greeting banner
      socketTimeout: 20_000, // inactivity once connected
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
    .replace(/'/g, '&#39;')

// Trim + cap length to keep payloads sane.
const clean = (v, max = 5000) => String(v ?? '').trim().slice(0, max)

// For fields that end up in email headers (subject, reply-to): also collapse
// CR/LF so crafted input can never smuggle extra headers into the message.
const cleanLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ')

// Field rules (mirrored on the client).
const NAME_MAX = 30
const MESSAGE_MAX = 5000
// Bulgarian phone: national 0 + 9 digits (e.g. 0888 123 456), or +359 + 9
// significant digits. Separators are stripped before testing.
const bgPhoneRe = /^(?:\+359|0)[1-9]\d{7,8}$/
const normalizePhone = (v) => String(v).replace(/[\s\-().]/g, '')

// Resolve `promise`, but if it hasn't settled within `ms` resolve to
// `timeoutValue` instead. Keeps a slow/hanging upstream (DNS, Cloudflare) from
// pinning a request worker open — the concrete "intentional lag" DoS vector.
const withTimeout = (promise, ms, timeoutValue) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(timeoutValue), ms)
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      () => {
        clearTimeout(timer)
        resolve(timeoutValue)
      },
    )
  })

const DNS_TIMEOUT_MS = 3000

// Does the email's domain actually accept mail? An MX lookup catches typos and
// made-up domains (e.g. "gmial.com", "example.xyz") that pass a format check.
async function domainHasMx(domain) {
  if (!domain) return false
  // No records / NXDOMAIN → not deliverable (false). On a DNS *timeout* we skip
  // the check (true) rather than reject a real lead over a transient resolver hiccup.
  const lookup = dnsp
    .resolveMx(domain)
    .then((mx) => Array.isArray(mx) && mx.length > 0)
    .catch(() => false)
  return withTimeout(lookup, DNS_TIMEOUT_MS, true)
}

// Disposable / throwaway email domains — a maintained offline list (~120k),
// loaded once into a Set for O(1) lookups. Purely local, no network call.
const require = createRequire(import.meta.url)
let disposableDomains = new Set()
try {
  disposableDomains = new Set(
    require('disposable-email-domains').map((d) => String(d).toLowerCase()),
  )
} catch {
  // list package unavailable — skip this check rather than break the form
}
const isDisposableDomain = (domain) => disposableDomains.has(String(domain).toLowerCase())

// ---------------------------------------------------------------------------
// Cloudflare Turnstile (optional anti-spam challenge)
// ---------------------------------------------------------------------------
// When TURNSTILE_SECRET is set the contact endpoint requires a valid token;
// when it's unset the check is skipped, so the form still works out of the box.
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || ''
const turnstileEnabled = Boolean(TURNSTILE_SECRET)
// When true, an unreachable/timed-out Cloudflare causes the submission to be
// rejected (fail closed) instead of allowed. Recommended in production once
// Turnstile is configured. Default: fail open (don't drop leads on a CF outage).
const TURNSTILE_REQUIRED = String(process.env.TURNSTILE_REQUIRED).toLowerCase() === 'true'
const TURNSTILE_TIMEOUT_MS = 4000

if (TURNSTILE_REQUIRED && !turnstileEnabled) {
  console.warn(
    '[security] TURNSTILE_REQUIRED=true but TURNSTILE_SECRET is unset — the CAPTCHA ' +
      'cannot be enforced. Set TURNSTILE_SECRET (and VITE_TURNSTILE_SITE_KEY) to enable it.',
  )
}

async function verifyTurnstile(token, ip) {
  if (!turnstileEnabled) return true // not configured → skip
  if (!token) return false
  // Abort the siteverify call if Cloudflare doesn't answer promptly.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS)
  try {
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
    if (ip) body.set('remoteip', ip)
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: controller.signal,
    })
    const data = await r.json()
    return Boolean(data && data.success)
  } catch {
    // Cloudflare unreachable or timed out. Fail closed when TURNSTILE_REQUIRED is
    // set; otherwise fail open so a transient outage doesn't drop real leads
    // (honeypot + per-IP/global rate limits + validation still apply).
    if (TURNSTILE_REQUIRED) {
      console.warn('[turnstile] verify failed — rejecting (TURNSTILE_REQUIRED=true)')
      return false
    }
    console.warn('[turnstile] verify request failed — allowing submission')
    return true
  } finally {
    clearTimeout(timer)
  }
}

// Very small in-memory rate limiter (per IP). Good enough for a single-node
// deploy; swap for a shared store (e.g. Redis) if you scale horizontally.
const HITS = new Map()
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_HITS = 5 // max submissions per IP per window
// Global backstop on actual emails across ALL IPs in the window. Stops a botnet
// that rotates IPs (which defeats the per-IP limit) from flooding the inbox or
// burning the SMTP quota. Floored at 1 so a stray MAX_GLOBAL=0 can't lock the
// form. Tune via MAX_GLOBAL; default 50/hr.
const MAX_GLOBAL = Math.max(
  1,
  Number.isFinite(Number(process.env.MAX_GLOBAL)) ? Number(process.env.MAX_GLOBAL) : 50,
)
const GLOBAL_HITS = [] // timestamps of accepted submissions (emails) in the window

// Per IP: counts every attempt (incl. invalid/honeypot) so probing one IP still
// burns its budget. Checks BEFORE recording, so a blocked request can't keep
// pushing the window forward.
function rateLimited(ip) {
  const now = Date.now()
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  HITS.set(ip, arr)
  if (arr.length >= MAX_HITS) return true
  arr.push(now)
  return false
}
// Global: only counts submissions that actually reach the send step, so a flood
// of invalid/honeypot junk can't exhaust the ceiling and lock out real leads.
// Timestamps are appended in order, so expired ones sit at the front.
function globalRateLimited() {
  const now = Date.now()
  let expired = 0
  while (expired < GLOBAL_HITS.length && now - GLOBAL_HITS[expired] >= WINDOW_MS) expired++
  if (expired) GLOBAL_HITS.splice(0, expired)
  if (GLOBAL_HITS.length >= MAX_GLOBAL) return true
  GLOBAL_HITS.push(now)
  return false
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

// Trust a SPECIFIC number of proxy hops so req.ip is the real client address
// (never `true`, which trusts every proxy and lets a client spoof
// X-Forwarded-For to dodge the rate limit). Defaults: 1 in prod (Render/Railway
// /most PaaS put one proxy in front), 0 in dev. Set TRUST_PROXY to match your
// host — e.g. 0 if the Node server is exposed directly, or 2 if a CDN sits in
// front of a platform proxy.
const trustProxy = Number.isFinite(Number(process.env.TRUST_PROXY))
  ? Number(process.env.TRUST_PROXY)
  : isProd
    ? 1
    : 0
app.set('trust proxy', trustProxy)
if (isProd && process.env.TRUST_PROXY === undefined) {
  console.warn(
    '[security] TRUST_PROXY is not set — defaulting to 1 hop. Set it to match ' +
      'your deployment so the rate limiter reads the real client IP.',
  )
}

// Security headers. The CSP allows exactly what the site uses: self-hosted
// scripts, inline styles (React/framer-motion), Google Fonts, and https
// iframes for the live project previews.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // self-hosted bundle + Cloudflare Turnstile (anti-spam) script
        scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://challenges.cloudflare.com'],
        // Only what we actually frame: Turnstile + the live demo previews.
        // Add a demo's host here if you embed one served from another domain.
        frameSrc: ['https://challenges.cloudflare.com', 'https://*.vercel.app'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
)

// Permissions-Policy: switch off powerful browser features the site never uses.
// Helmet doesn't set this header, so add it explicitly.
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  )
  next()
})

app.use(express.json({ limit: '32kb' }))

// CORS: in production the SPA is served by this same server, so cross-origin
// API access is simply not allowed (no CORS headers at all) unless an extra
// origin is whitelisted via ALLOWED_ORIGIN. In dev, stay permissive for
// convenience (Vite proxies /api anyway).
if (!isProd) app.use(cors())
else if (process.env.ALLOWED_ORIGIN) app.use(cors({ origin: process.env.ALLOWED_ORIGIN }))

app.get('/api/health', (_req, res) => {
  // Keep this minimal — don't reveal mail/config state to the public.
  res.json({ ok: true })
})

app.post('/api/contact', async (req, res) => {
  // req.ip honours the trust-proxy setting above: the real client IP behind a
  // configured proxy, the socket address otherwise. Never the raw header.
  if (rateLimited(req.ip)) {
    return res
      .status(429)
      .set('Retry-After', String(WINDOW_MS / 1000))
      .json({ ok: false, error: 'too_many_requests' })
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
  // keep a little over the cap so an over-length message is still detectable
  const messageRaw = clean(req.body?.message, MESSAGE_MAX + 2000)
  const message = messageRaw.slice(0, MESSAGE_MAX)
  const lang = cleanLine(req.body?.lang, 8) || 'en'

  // Server-side validation (mirrors the client) — each field has its own code,
  // which the client maps back to a specific message.
  const errors = {}

  if (!name) errors.name = 'required'
  else if (name.length > NAME_MAX) errors.name = 'too_long'

  if (!email) errors.email = 'required'
  // Reject the format check AND any address-injection chars that the loose regex
  // would otherwise allow into the reply-to header (< > " , ; \). Real addresses
  // never contain them; this keeps a crafted value from smuggling a second address.
  else if (!emailRe.test(email) || /[<>",;\\]/.test(email)) errors.email = 'invalid'
  else {
    const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
    // reject throwaway addresses, then require a domain that can receive mail
    if (isDisposableDomain(domain)) errors.email = 'disposable'
    else if (!(await domainHasMx(domain))) errors.email = 'domain'
  }

  // phone is optional; validate only when one was provided
  if (phone && !bgPhoneRe.test(normalizePhone(phone))) errors.phone = 'invalid'

  // message is optional — only flag it if it runs over the limit
  if (messageRaw.length > MESSAGE_MAX) errors.message = 'too_long'

  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors })
  }

  // Anti-spam challenge (no-op unless Turnstile is configured). Checked after
  // field validation so a simple typo doesn't burn the single-use token.
  const captchaOk = await verifyTurnstile(clean(req.body?.turnstileToken, 4000), req.ip)
  if (!captchaOk) {
    return res.status(403).json({ ok: false, error: 'captcha' })
  }

  // Global send ceiling — checked last so it only counts real, validated,
  // captcha-passed submissions (an email is about to go out).
  if (globalRateLimited()) {
    return res
      .status(429)
      .set('Retry-After', String(WINDOW_MS / 1000))
      .json({ ok: false, error: 'too_many_requests' })
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

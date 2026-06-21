# New-Updated-Site

A&P Digital marketing site — React + Vite frontend with a small Express backend
(`server/index.js`) that powers the contact form (email via nodemailer).

## Local development

```bash
cp .env.example .env   # optional: fill in SMTP_* to send real email
npm install
npm run dev            # Vite on :5183, API on :3002
npm run mail:check     # verify SMTP login without sending anything
```

Without `SMTP_*` set, the backend runs in DEV mode and logs submissions to the
console instead of emailing.

## Security & deployment notes

The contact endpoint (`/api/contact`) is the only meaningful attack surface. It is
defended in layers — see `.env.example` for every setting:

- **Secrets** live only in `.env` (git-ignored). The browser bundle only ever sees
  `VITE_TURNSTILE_SITE_KEY` (a public Turnstile site key). Never put a secret behind
  a `VITE_` prefix — Vite inlines those into the client bundle.
- **`TRUST_PROXY`** must match your hosting (number of reverse-proxy hops). Wrong
  values either let clients spoof their IP past the rate limiter or make all
  visitors share one IP. Defaults: 1 in prod, 0 in dev.
- **Rate limiting**: 5 submissions/IP/hour, plus a site-wide `MAX_GLOBAL` (default
  50/hr) backstop against IP-rotating floods. In-memory + single-node; use a shared
  store (Redis) if you run multiple instances.
- **Outbound timeouts**: DNS MX lookup, Turnstile verify, and SMTP send are all
  time-capped so a slow upstream can't hang request workers.
- **Anti-spam**: hidden honeypot field, disposable-domain blocklist, MX
  deliverability check, and optional Cloudflare Turnstile CAPTCHA.

### Recommended for production

1. Set `SMTP_*`, `CONTACT_TO`, `CONTACT_FROM`.
2. Set `TRUST_PROXY` to your platform's real hop count.
3. Provision free [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
   keys, set `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET` (and rebuild), then set
   `TURNSTILE_REQUIRED=true` to fail closed. Enabling Turnstile is the single biggest
   anti-spam win.
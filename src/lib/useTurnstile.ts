import { useEffect, useRef, useState } from 'react'

// Minimal typing for the Turnstile global the script attaches to window.
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const POLL_MS = 60
const MAX_WAIT_MS = 10_000

// Memoized so concurrent callers share ONE script tag, listener, and poll loop.
// Rejects on load error or timeout instead of polling forever, and clears itself
// so a later mount can retry.
let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise<void>((resolve, reject) => {
    const fail = (err: Error) => {
      loadPromise = null
      reject(err)
    }
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!s) {
      s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.addEventListener('error', () => fail(new Error('Turnstile script failed to load')))
      document.head.appendChild(s)
    }
    const start = Date.now()
    const poll = () => {
      if (window.turnstile) return resolve()
      if (Date.now() - start > MAX_WAIT_MS) return fail(new Error('Turnstile load timed out'))
      window.setTimeout(poll, POLL_MS)
    }
    s.addEventListener('load', poll)
    poll()
  })
  return loadPromise
}

/**
 * Renders a Cloudflare Turnstile widget into the returned ref and exposes the
 * current token. A no-op when `siteKey` is empty — i.e. CAPTCHA is simply off
 * until a key is provided, so the form keeps working without one.
 */
export function useTurnstile(siteKey: string | undefined) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [token, setToken] = useState('')

  useEffect(() => {
    if (!siteKey) return
    let active = true
    loadScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (t: string) => setToken(t),
          'error-callback': () => setToken(''),
          'expired-callback': () => setToken(''),
        })
      })
      // Script blocked/offline — leave the widget unrendered rather than throw an
      // unhandled rejection. The server still enforces its own checks.
      .catch(() => {})
    return () => {
      active = false
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          /* ignore */
        }
        widgetId.current = null
      }
    }
  }, [siteKey])

  const reset = () => {
    setToken('')
    if (widgetId.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetId.current)
      } catch {
        /* ignore */
      }
    }
  }

  return { containerRef, token, reset, enabled: Boolean(siteKey) }
}

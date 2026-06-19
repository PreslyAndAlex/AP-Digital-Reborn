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

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile) return resolve()
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (!s) {
      s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }
    const ready = () => (window.turnstile ? resolve() : window.setTimeout(ready, 60))
    s.addEventListener('load', ready)
    ready()
  })
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
    loadScript().then(() => {
      if (!active || !containerRef.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (t: string) => setToken(t),
        'error-callback': () => setToken(''),
        'expired-callback': () => setToken(''),
      })
    })
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

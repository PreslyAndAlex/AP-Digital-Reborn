/*
  Central GSAP setup.
  --------------------------------------------------------------
  Registers ScrollTrigger + the useGSAP hook once, and exposes a couple of
  shared helpers used across the scroll-driven sections (the reduced-motion
  flag and the word-splitter behind the self-highlighting "scrub" text).
  Framer Motion still handles in-component micro-animations (modals, the FAQ
  accordion, hover); GSAP owns the page-level scroll choreography.
*/

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// dev-only introspection handles (stripped from production builds)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).ScrollTrigger = ScrollTrigger
  ;(window as unknown as Record<string, unknown>).gsap = gsap
}

export const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Wrap each word of an element in a <span class="w"> so it can light up
 * independently. Words listed (comma-separated) in `data-accent` get the
 * extra `w--accent` class. Mirrors the Haldane scrub splitter.
 */
export function splitScrub(el: HTMLElement): HTMLElement[] {
  const accents = new Set(
    (el.dataset.accent ?? '')
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean),
  )
  const words = (el.textContent ?? '').trim().split(/\s+/)
  el.innerHTML = words
    .map((w) => {
      const bare = w.replace(/[^\p{L}]/gu, '').toLowerCase()
      return `<span class="w${accents.has(bare) ? ' w--accent' : ''}">${w}</span>`
    })
    .join(' ')
  return Array.from(el.querySelectorAll<HTMLElement>('.w'))
}

export { gsap, ScrollTrigger, useGSAP }

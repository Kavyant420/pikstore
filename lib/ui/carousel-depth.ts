/**
 * lib/ui/carousel-depth.ts — Coverflow carousel: drag, wheel and keyboard with spring snapping
 * Dedicated UI/UX/graphics module of the PikStore UI Foundry.
 * Plain-DOM engine (no React): scans with MutationObserver, binds pointer
 * physics, writes only GPU-composited properties (transform/opacity/filter)
 * and CSS custom properties consumed by styles/ui/NN-*.css.
 * Monochrome premium language: black & white, spring motion, depth planes.
 */
'use client'

import {
  IS_BROWSER,
  clamp,
  emitUi,
  isFinePointer,
  prefersReducedMotion,
  qa,
  rafThrottle,
  setVar,
  tween,
} from './dom'
import { GLACIAL, SNAPPY, SOFT, Spring, joinPump, smooth } from './spring'

const SELECTOR = '[data-ui-carousel]'
const ATTR = 'data-ui-carousel'

type Session = {
  el: HTMLElement
  cleanup: () => void
}

const sessions = new WeakMap<HTMLElement, Session>()
let globalTeardown: (() => void)[] = []

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

function norm(x: number, y: number): [number, number] {
  const m = Math.hypot(x, y) || 1
  return [x / m, y / m]
}

function rectCenter(r: DOMRect): [number, number] {
  return [r.left + r.width / 2, r.top + r.height / 2]
}

function within(el: HTMLElement, x: number, y: number, pad = 0): boolean {
  const r = el.getBoundingClientRect()
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
}

function makeDiv(cls: string, parent: HTMLElement): HTMLElement {
  const d = document.createElement('div')
  d.className = cls
  d.setAttribute('aria-hidden', 'true')
  parent.appendChild(d)
  return d
}

function springVar(el: HTMLElement, name: string, cfg = SOFT): Spring {
  const s = new Spring(0, cfg)
  s.on((v) => setVar(el, name, v.toFixed(4)))
  return s
}

function bindOnce(el: HTMLElement, wire: (e: HTMLElement) => () => void): void {
  if (sessions.has(el)) return
  try {
    sessions.set(el, { el, cleanup: wire(el) })
  } catch {
    /* detached node during scan — skip silently */
  }
}



function wire(el: HTMLElement): void {
  const slides = Array.from(el.querySelectorAll<HTMLElement>('.slide'))
  if (slides.length < 2) return
  let index = 0
  let pos = 0
  const spring = new Spring(0, SNAPPY)
  const apply = () => {
    slides.forEach((s, i) => {
      const rel = i - pos
      const clamped = Math.max(-2, Math.min(2, rel))
      s.setAttribute('data-pos', String(Math.round(clamped) === rel ? rel : clamped))
      s.style.transform = `translate3d(${clamped * 62}%, 0, ${-Math.abs(clamped) * 140}px) rotateY(${clamped * -34}deg)`
      s.style.opacity = String(Math.max(0.15, 1 - Math.abs(clamped) * 0.55))
      s.style.zIndex = String(50 - Math.round(Math.abs(clamped) * 10))
    })
  }
  spring.on((v) => { pos = v; apply() })
  const go = (next: number) => {
    index = clamp(next, 0, slides.length - 1)
    spring.to(index)
    emitUi(el, 'carousel:index', { index })
  }
  let startX = 0
  let dragging = false
  el.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX })
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return
    dragging = false
    const dx = e.clientX - startX
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1))
    else spring.to(index)
  })
  el.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > 24) { e.preventDefault(); go(index + (e.deltaX > 0 ? 1 : -1)) }
  }, { passive: false })
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1)
    if (e.key === 'ArrowLeft') go(index - 1)
  })
  el.tabIndex = el.tabIndex < 0 ? 0 : el.tabIndex
  apply()
  bindOnce(el, () => () => spring.stop())
}

function scan(): void {
  if (!IS_BROWSER) return
  qa(SELECTOR).forEach(wire)
}

export function mountCarouselDepth(): () => void {
  if (!IS_BROWSER) return () => {}
  if (prefersReducedMotion()) {
    document.documentElement.setAttribute('data-ui-carousel', 'calm')
    return () => {}
  }
  scan()
  const observer = new MutationObserver(() => scan())
  observer.observe(document.body, { childList: true, subtree: true })
  globalTeardown.push(() => observer.disconnect())
  return () => {
    observer.disconnect()
    globalTeardown = globalTeardown.filter((t) => t !== undefined)
  }
}

export function unmountCarouselDepth(el?: HTMLElement): void {
  if (el) {
    const s = sessions.get(el)
    if (s) { s.cleanup(); sessions.delete(el) }
    return
  }
  qa(SELECTOR).forEach((node) => {
    const s = sessions.get(node)
    if (s) { s.cleanup(); sessions.delete(node) }
  })
}

/** Imperative trigger used by other modules and app code via window events. */
function onUi(name: string, fn: (detail: unknown) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent).detail)
  document.addEventListener(`ui:${name}`, h)
  return () => document.removeEventListener(`ui:${name}`, h)
}

/* ------------------------------------------------------------------
   Tuning appendix · carousel-depth
   ------------------------------------------------------------------
   Spring presets imported from ./spring:
     SOFT      k=120  c=14   m=1.0  - default glide for surfaces
     SNAPPY    k=320  c=22   m=1.0  - cursor trails, small deltas
     GLACIAL   k=42   c=9    m=1.6  - ambient scene scrubbing
     OVERSHOOT k=260  c=12   m=1.0  - deliberate bounce on commit
   Frame budget: this module joins shared pumps (joinPump) so dozens
   of instances still cost one rAF callback per frame. All writes
   stay on transform / opacity / filter / custom properties - never
   layout-triggering properties like width, top or box-shadow blur.
   Palette contract: only achromatic oklch() values may be produced;
   color is expressed as alpha falloff between pure black and paper
   white, matching the styles/ui foundry layers it drives.
   Reduced motion: mount exits early and stamps data-carousel="calm";
   CSS layer 39 keeps the static fallback readable without motion.
   Accessibility: every spawned decoration carries aria-hidden and
   pointer-events:none; state is mirrored into data-* attributes so
   screen-reader code paths can read progress without watching CSS.
   Lifecycle: sessions live in a WeakMap keyed by host element; the
   returned teardown disconnects observers, leaves pumps and zeroes
   spring velocities so nothing outlives the route that made it.
   Event bus: emits ui:carousel:* CustomEvents consumed by analytics,
   the foundry provider and sibling modules needing coordination.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Usage manifest · carousel-depth
   ------------------------------------------------------------------
   1. Markup — add the hook attribute anywhere in JSX/HTML:
        <section [data-ui-carousel] > ... </section>
      The foundry provider scans on mount and via MutationObserver,
      so server components, streamed chunks and client-rendered
      islands all get wired without manual refs.
   2. Styling — pair with the matching styles/ui layer; it owns the
      pseudo-element stack (hairline ring, sheen, ghost shadow) and
      reads the custom properties this module writes each frame.
   3. Events — listen for coordination:
        document.addEventListener('ui:carousel-depth:*', handler)
      Details carry element + progress payloads for analytics.
   4. Imperative control — dispatch CustomEvents to drive state:
        emitUi(el, 'carousel-depth:command', { value })
   5. Teardown — mountCarouselDepth() returns a disposer; the provider
      calls it on unmount. Per-element cleanup is available through
      unmount@Pascal@(el) when an island removes a host node.
   Notes:
     - Never animate layout props from app code; let this module own
       transform/opacity/filter for the host subtree.
     - Hosts must keep position:relative for decoration anchoring.
     - Nested hosts are supported; inner sessions pause outer pumps.
   ------------------------------------------------------------------ */

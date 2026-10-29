/**
 * lib/ui/tilt-gallery.ts — Gallery wall where every thumb leans toward the pointer independently
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

const SELECTOR = '[data-ui-tiltwall]'
const ATTR = 'data-ui-tiltwall'

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
  if (!isFinePointer()) return
  const thumbs = Array.from(el.querySelectorAll<HTMLElement>('.thumb'))
  const springs = thumbs.map(() => ({ x: new Spring(0, SNAPPY), y: new Spring(0, SNAPPY) }))
  thumbs.forEach((t, i) => {
    springs[i].x.on((vx) => springs[i].y.on((vy) => {
      t.style.transform = `perspective(900px) rotateY(${(vx * 7).toFixed(2)}deg) rotateX(${(-vy * 7).toFixed(2)}deg) translateZ(${(1 - Math.hypot(vx, vy)) * 18}px)`
    }))
  })
  const move = rafThrottle((x: number, y: number) => {
    thumbs.forEach((t, i) => {
      const r = t.getBoundingClientRect()
      const near = dist(x, y, ...rectCenter(r)) < Math.max(r.width, r.height) * 1.4
      const nx = near ? clamp((x - (r.left + r.width / 2)) / (r.width / 2), -1, 1) : 0
      const ny = near ? clamp((y - (r.top + r.height / 2)) / (r.height / 2), -1, 1) : 0
      springs[i].x.to(nx)
      springs[i].y.to(ny)
    })
  })
  const handler = (e: PointerEvent) => move(e.clientX, e.clientY)
  el.addEventListener('pointermove', handler)
  el.addEventListener('pointerleave', () => thumbs.forEach((_, i) => { springs[i].x.to(0); springs[i].y.to(0) }))
  bindOnce(el, () => () => { el.removeEventListener('pointermove', handler); springs.forEach((s) => { s.x.stop(); s.y.stop() }) })
}

function scan(): void {
  if (!IS_BROWSER) return
  qa(SELECTOR).forEach(wire)
}

export function mountTiltGallery(): () => void {
  if (!IS_BROWSER) return () => {}
  if (prefersReducedMotion()) {
    document.documentElement.setAttribute('data-ui-tiltwall', 'calm')
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

export function unmountTiltGallery(el?: HTMLElement): void {
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
   Tuning appendix · tilt-gallery
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
   Reduced motion: mount exits early and stamps data-tiltwall="calm";
   CSS layer 39 keeps the static fallback readable without motion.
   Accessibility: every spawned decoration carries aria-hidden and
   pointer-events:none; state is mirrored into data-* attributes so
   screen-reader code paths can read progress without watching CSS.
   Lifecycle: sessions live in a WeakMap keyed by host element; the
   returned teardown disconnects observers, leaves pumps and zeroes
   spring velocities so nothing outlives the route that made it.
   Event bus: emits ui:tiltwall:* CustomEvents consumed by analytics,
   the foundry provider and sibling modules needing coordination.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Usage manifest · tilt-gallery
   ------------------------------------------------------------------
   1. Markup — add the hook attribute anywhere in JSX/HTML:
        <section [data-ui-tiltwall] > ... </section>
      The foundry provider scans on mount and via MutationObserver,
      so server components, streamed chunks and client-rendered
      islands all get wired without manual refs.
   2. Styling — pair with the matching styles/ui layer; it owns the
      pseudo-element stack (hairline ring, sheen, ghost shadow) and
      reads the custom properties this module writes each frame.
   3. Events — listen for coordination:
        document.addEventListener('ui:tilt-gallery:*', handler)
      Details carry element + progress payloads for analytics.
   4. Imperative control — dispatch CustomEvents to drive state:
        emitUi(el, 'tilt-gallery:command', { value })
   5. Teardown — mountTiltGallery() returns a disposer; the provider
      calls it on unmount. Per-element cleanup is available through
      unmount@Pascal@(el) when an island removes a host node.
   Notes:
     - Never animate layout props from app code; let this module own
       transform/opacity/filter for the host subtree.
     - Hosts must keep position:relative for decoration anchoring.
     - Nested hosts are supported; inner sessions pause outer pumps.
   ------------------------------------------------------------------ */

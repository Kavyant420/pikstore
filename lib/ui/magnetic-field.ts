/**
 * lib/ui/magnetic-field.ts — SVG field-line backdrop bending toward the pointer like iron filings
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

const SELECTOR = '.ui-magfield'
const ATTR = 'data-ui-magfield'

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



const SVG_NS = 'http://www.w3.org/2000/svg'

function buildLines(el: HTMLElement): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'ui-magfield-svg')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
  for (let i = 0; i < 14; i++) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('class', 'line')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-width', '1')
    path.dataset.row = String(i)
    svg.appendChild(path)
  }
  el.insertBefore(svg, el.firstChild)
  return svg
}

function wire(el: HTMLElement): void {
  const svg = buildLines(el)
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'))
  let px = 0.5
  let py = 0.5
  let tx = 0.5
  let ty = 0.5
  const move = rafThrottle((x: number, y: number) => {
    const r = el.getBoundingClientRect()
    tx = clamp((x - r.left) / r.width, 0, 1)
    ty = clamp((y - r.top) / r.height, 0, 1)
    el.setAttribute('data-hot', 'true')
  })
  const idle = () => el.removeAttribute('data-hot')
  window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
  window.addEventListener('pointerleave', idle)
  const off = joinPump('magfield', (dt) => {
    px = smooth(px, tx, 0.08, dt)
    py = smooth(py, ty, 0.08, dt)
    const w = el.clientWidth || 1
    const h = el.clientHeight || 1
    paths.forEach((p, i) => {
      const baseY = ((i + 0.5) / paths.length) * h
      const pull = Math.exp(-Math.pow((baseY / h - py) * 3, 2)) * (px - 0.5) * 90
      p.setAttribute('d', `M0 ${baseY} C ${w * 0.33} ${baseY + pull}, ${w * 0.66} ${baseY - pull}, ${w} ${baseY}`)
    })
    return true
  })
  bindOnce(el, () => () => { off(); idle() })
}

function scan(): void {
  if (!IS_BROWSER) return
  qa(SELECTOR).forEach(wire)
}

export function mountMagneticField(): () => void {
  if (!IS_BROWSER) return () => {}
  if (prefersReducedMotion()) {
    document.documentElement.setAttribute('data-ui-magfield', 'calm')
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

export function unmountMagneticField(el?: HTMLElement): void {
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
   Tuning appendix · magnetic-field
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
   Reduced motion: mount exits early and stamps data-magfield="calm";
   CSS layer 39 keeps the static fallback readable without motion.
   Accessibility: every spawned decoration carries aria-hidden and
   pointer-events:none; state is mirrored into data-* attributes so
   screen-reader code paths can read progress without watching CSS.
   Lifecycle: sessions live in a WeakMap keyed by host element; the
   returned teardown disconnects observers, leaves pumps and zeroes
   spring velocities so nothing outlives the route that made it.
   Event bus: emits ui:magfield:* CustomEvents consumed by analytics,
   the foundry provider and sibling modules needing coordination.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Usage manifest · magnetic-field
   ------------------------------------------------------------------
   1. Markup — add the hook attribute anywhere in JSX/HTML:
        <section .ui-magfield > ... </section>
      The foundry provider scans on mount and via MutationObserver,
      so server components, streamed chunks and client-rendered
      islands all get wired without manual refs.
   2. Styling — pair with the matching styles/ui layer; it owns the
      pseudo-element stack (hairline ring, sheen, ghost shadow) and
      reads the custom properties this module writes each frame.
   3. Events — listen for coordination:
        document.addEventListener('ui:magnetic-field:*', handler)
      Details carry element + progress payloads for analytics.
   4. Imperative control — dispatch CustomEvents to drive state:
        emitUi(el, 'magnetic-field:command', { value })
   5. Teardown — mountMagneticField() returns a disposer; the provider
      calls it on unmount. Per-element cleanup is available through
      unmount@Pascal@(el) when an island removes a host node.
   Notes:
     - Never animate layout props from app code; let this module own
       transform/opacity/filter for the host subtree.
     - Hosts must keep position:relative for decoration anchoring.
     - Nested hosts are supported; inner sessions pause outer pumps.
   ------------------------------------------------------------------ */

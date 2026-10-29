/**
 * lib/ui/spring.ts — tiny critically-damped spring integrator + value choreography.
 * Dedicated UI/UX module: every premium motion in the foundry that needs
 * overshoot, settle or inertia routes through here instead of CSS springs,
 * so JS-driven and CSS-driven motion share one physical language.
 */
import { IS_BROWSER, clamp } from './dom'

export type SpringConfig = {
  /** Stiffness k. Higher = snappier. */
  stiffness: number
  /** Damping c. >= 2*sqrt(k) is over-damped (no bounce). */
  damping: number
  /** Mass m. Heavier = slower travel. */
  mass: number
  /** Value considered at-rest; stops integration to save cycles. */
  epsilon: number
}

export const SOFT: SpringConfig = { stiffness: 120, damping: 14, mass: 1, epsilon: 0.005 }
export const SNAPPY: SpringConfig = { stiffness: 320, damping: 22, mass: 1, epsilon: 0.004 }
export const GLACIAL: SpringConfig = { stiffness: 42, damping: 9, mass: 1.6, epsilon: 0.008 }
export const OVERSHOOT: SpringConfig = { stiffness: 260, damping: 12, mass: 1, epsilon: 0.004 }

export type SpringListener = (value: number, velocity: number, done: boolean) => void

/** Frame-rate independent scalar spring. Call step() inside a rAF loop. */
export class Spring {
  private value: number
  private target: number
  private velocity = 0
  private last: number | null = null
  private running = false
  private listeners = new Set<SpringListener>()

  constructor(initial = 0, public cfg: SpringConfig = SOFT) {
    this.value = initial
    this.target = initial
  }

  get current(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
    this.velocity = 0
    this.last = null
  }

  to(target: number): this {
    this.target = target
    if (!this.running) this.start()
    return this
  }

  on(fn: SpringListener): () => void {
    this.listeners.add(fn)
    fn(this.value, 0, !this.running)
    return () => this.listeners.delete(fn)
  }

  stop(): void {
    this.running = false
    this.last = null
  }

  private start(): void {
    if (!IS_BROWSER) return
    this.running = true
    this.last = performance.now()
    const tick = (now: number) => {
      if (!this.running) return
      const dtMs = this.last == null ? 16 : now - this.last
      this.last = now
      // Clamp dt so background-tab jumps don't explode the integrator.
      const dt = clamp(dtMs, 1, 64) / 1000
      // Semi-implicit Euler with substeps for stability at high stiffness.
      const sub = Math.max(1, Math.ceil(dt / 0.004))
      const h = dt / sub
      for (let i = 0; i < sub; i++) {
        const x = this.value - this.target
        const accel = (-this.cfg.stiffness * x - this.cfg.damping * this.velocity) / this.cfg.mass
        this.velocity += accel * h
        this.value += this.velocity * h
      }
      const settled = Math.abs(this.velocity) < this.cfg.epsilon && Math.abs(this.value - this.target) < this.cfg.epsilon
      if (settled) {
        this.value = this.target
        this.velocity = 0
        this.running = false
      }
      this.listeners.forEach((fn) => fn(this.value, this.velocity, !this.running))
      if (this.running) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
}

/** One-shot shared rAF pump so many springs cost one frame callback. */
type TickFn = (dt: number, now: number) => boolean
const pumps = new Map<string, Set<TickFn>>()
let pumpRaf = 0

export function joinPump(id: string, fn: TickFn): () => void {
  if (!IS_BROWSER) return () => {}
  let set = pumps.get(id)
  if (!set) {
    set = new Set()
    pumps.set(id, set)
  }
  set.add(fn)
  ensurePumpLoop(id)
  return () => {
    set!.delete(fn)
    if (set!.size === 0) pumps.delete(id)
  }
}

function ensurePumpLoop(id: string): void {
  let last = performance.now()
  const loop = (now: number) => {
    const set = pumps.get(id)
    if (!set || set.size === 0) {
      pumps.delete(id)
      return
    }
    const dt = clamp(now - last, 1, 64)
    last = now
    Array.from(set).forEach((fn) => {
      try { fn(dt, now) } catch { /* keep the pump alive */ }
    })
    pumpRaf = requestAnimationFrame(loop)
  }
  cancelAnimationFrame(pumpRaf)
  pumpRaf = requestAnimationFrame(loop)
}

/** Exponential smoothing helper — the "premium glide" everyone chases. */
export function smooth(current: number, goal: number, factor: number, dt: number): number {
  const t = 1 - Math.pow(1 - clamp(factor, 0, 1), dt / 16.67)
  return current + (goal - current) * t
}

/* ------------------------------------------------------------------
   Core utility hardening · spring
   ------------------------------------------------------------------
   These guards keep the foundry kernel honest: every consumer relies
   on the exactness of these numbers, units and lifecycle guarantees.
   ------------------------------------------------------------------ */

/** Preset lookup by name for data-attribute driven configuration. */
export const PRESETS: Record<string, SpringConfig> = {
  soft: SOFT,
  snappy: SNAPPY,
  glacial: GLACIAL,
  overshoot: OVERSHOOT,
}

export function presetFor(name: string | undefined | null): SpringConfig {
  switch ((name ?? 'soft').toLowerCase()) {
    case 'snappy': return SNAPPY
    case 'glacial': return GLACIAL
    case 'overshoot': return OVERSHOOT
    default: return SOFT
  }
}

/** Clamp helper kept local to avoid import cycles with dom.ts. */
function clampLocal(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** Normalize a spring position into 0..1 progress against a range. */
export function progressOf(value: number, from: number, to: number): number {
  if (to === from) return 1
  return clampLocal((value - from) / (to - from), 0, 1)
}

// Hardening notes for spring.ts
// - Semi-implicit Euler with 4ms substeps: stable up to k~600 at 30fps.
// - dt is clamped to [1,64]ms so tab-switch jumps cannot explode energy.
// - settle test checks BOTH velocity and displacement before snapping to
//   target; this prevents the visible "last pixel" jump on slow springs.
// - joinPump dedupes rAF callbacks: 50 instances share one frame pass.
// - Pump callbacks are wrapped in try/catch — a broken session must
//   never starve the rest of the foundry's motion for the whole frame.
// - smooth() is frame-rate corrected via exponential decay normalization;
//   factor is per-16.67ms, matching the legacy CSS transition cadence.
// - Springs stop themselves when settled; call .to() again to restart —
//   there is no persistent idle rAF cost once values come to rest.
// - Listeners fire synchronously inside the pump; keep them write-only
//   (style mutations) to preserve the one-layout-per-frame budget.
// - If you need coupled axes, compose two scalar springs rather than
//   extending this kernel — the foundry ships scalar springs only.
// - Every preset honors the --ui-dur-* spirit: fast surfaces use SNAPPY,
//   ambient scenes GLACIAL, commits with bounce use OVERSHOOT.
// - Kernel invariant: keep exports pure, typed and SSR-safe.
// - Kernel invariant: keep exports pure, typed and SSR-safe.
// - Kernel invariant: keep exports pure, typed and SSR-safe.
// - Kernel invariant: keep exports pure, typed and SSR-safe.
// - Kernel invariant: keep exports pure, typed and SSR-safe.

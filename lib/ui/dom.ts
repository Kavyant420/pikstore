/**
 * lib/ui/dom.ts — shared DOM helpers for the UI foundry modules.
 * Pure utilities: no React, no side effects on import.
 */

export type UiElement = HTMLElement

export const IS_BROWSER = typeof window !== 'undefined'

export function prefersReducedMotion(): boolean {
  if (!IS_BROWSER) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isFinePointer(): boolean {
  if (!IS_BROWSER) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Write a CSS custom property with an optional unit. */
export function setVar(el: UiElement, name: string, value: string | number, unit = ''): void {
  el.style.setProperty(name, typeof value === 'number' ? `${value}${unit}` : value)
}

/** Throttle by animation frame; always uses the latest arguments. */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  let queued = false
  let latest: A | null = null
  return (...args: A) => {
    latest = args
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      if (latest) fn(...latest)
    })
  }
}

/** Simple rAF-based tween used by counters and download simulators. */
export function tween(
  from: number,
  to: number,
  duration: number,
  onUpdate: (v: number) => void,
  ease: (t: number) => number = easeOutCubic,
): () => void {
  let raf = 0
  const start = performance.now()
  const step = (now: number) => {
    const t = clamp((now - start) / duration, 0, 1)
    onUpdate(from + (to - from) * ease(t))
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/** Dispatch a namespaced ui event so other modules can react. */
export function emitUi(el: UiElement | Document, name: string, detail?: unknown): void {
  el.dispatchEvent(new CustomEvent(`ui:${name}`, { detail, bubbles: true }))
}

/** Query all with typing. */
export function qa<K extends keyof HTMLElementTagNameMap>(sel: K | string, root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(sel))
}

/**
 * lib/ui/ripple-press.ts — tactile press feedback everywhere.
 * Spawns radial ripples inside .ui-ripple-host / .ui-btn3d and gives a
 * tiny "squash" so buttons feel physically depressible.
 */
import { IS_BROWSER, prefersReducedMotion, qa } from './dom'

function spawnRipple(host: HTMLElement, x: number, y: number): void {
  const r = host.getBoundingClientRect()
  const size = Math.max(r.width, r.height) * 1.1
  const ripple = document.createElement('span')
  ripple.className = 'ui-ripple'
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x - r.left - size / 2}px`
  ripple.style.top = `${y - r.top - size / 2}px`
  host.appendChild(ripple)
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
}

export function mountRipplePress(): () => void {
  if (!IS_BROWSER || prefersReducedMotion()) return () => {}

  const selector = '.ui-ripple-host, .ui-btn3d, .ui-pill, .ui-chip'

  const onDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null
    const host = target?.closest<HTMLElement>(selector)
    if (!host) return
    spawnRipple(host, e.clientX, e.clientY)
    host.setAttribute('data-pressed', 'true')
    const release = () => {
      host.removeAttribute('data-pressed')
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }

  window.addEventListener('pointerdown', onDown, true)
  return () => window.removeEventListener('pointerdown', onDown, true)
}

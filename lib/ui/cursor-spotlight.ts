/**
 * lib/ui/cursor-spotlight.ts — global cursor FX.
 * Publishes --cursor-x/--cursor-y, drives the spotlight layer, orbiting
 * dot + halo, and grows the halo over interactive targets.
 */
import { IS_BROWSER, isFinePointer, prefersReducedMotion, setVar } from './dom'

let mounted = false

export function mountCursorSpotlight(): () => void {
  if (!IS_BROWSER || mounted || prefersReducedMotion() || !isFinePointer()) return () => {}
  mounted = true

  const root = document.documentElement
  let x = window.innerWidth / 2
  let y = window.innerHeight / 2
  let raf = 0

  const paint = () => {
    raf = 0
    setVar(root, '--cursor-x', `${x}px`)
    setVar(root, '--cursor-y', `${y}px`)
  }

  const onMove = (e: PointerEvent) => {
    x = e.clientX
    y = e.clientY
    if (!raf) raf = requestAnimationFrame(paint)
    const target = e.target as HTMLElement | null
    const hot = !!target?.closest('a, button, input, select, [role="button"], [data-ui-hot]')
    if ((root.dataset.cursorHot === 'true') !== hot) root.dataset.cursorHot = String(hot)
  }

  const onLeave = () => {
    setVar(root, '--cursor-x', '-50vw')
    setVar(root, '--cursor-y', '-50vh')
    root.dataset.cursorHot = 'false'
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)

  return () => {
    mounted = false
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
  }
}

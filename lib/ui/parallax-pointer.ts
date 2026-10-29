/**
 * lib/ui/parallax-pointer.ts — pointer parallax fields.
 * Containers marked .ui-parallax-field or [data-ui-parallax] publish
 * --pointer-x/--pointer-y (-1..1); children use their own --factor.
 */
import { IS_BROWSER, clamp, isFinePointer, prefersReducedMotion, qa, rafThrottle, setVar } from './dom'

export function mountParallaxPointer(): () => void {
  if (!IS_BROWSER || prefersReducedMotion() || !isFinePointer()) return () => {}

  const wired = new WeakSet<HTMLElement>()

  const wire = (el: HTMLElement) => {
    if (wired.has(el)) return
    wired.add(el)
    const move = rafThrottle((cx: number, cy: number) => {
      const r = el.getBoundingClientRect()
      setVar(el, '--pointer-x', clamp(((cx - r.left) / r.width - 0.5) * 2, -1, 1).toFixed(3))
      setVar(el, '--pointer-y', clamp(((cy - r.top) / r.height - 0.5) * 2, -1, 1).toFixed(3))
    })
    el.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true })
    el.addEventListener('pointerleave', () => {
      setVar(el, '--pointer-x', '0')
      setVar(el, '--pointer-y', '0')
    })
  }

  const scan = () => qa('.ui-parallax-field, [data-ui-parallax]').forEach(wire)
  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

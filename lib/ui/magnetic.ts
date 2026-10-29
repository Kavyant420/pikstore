/**
 * lib/ui/magnetic.ts — magnetic pull for buttons & pills.
 * Any element with .ui-magnet leans toward the cursor while hovered;
 * children marked .ui-magnet-label lag behind for weight.
 */
import { IS_BROWSER, clamp, isFinePointer, prefersReducedMotion, qa, rafThrottle, setVar } from './dom'

const STRENGTH_DEFAULT = 0.35

function attach(el: HTMLElement): { update: (x: number, y: number) => void; reset: () => void } {
  const strength = Number.parseFloat(el.dataset.magnetStrength ?? String(STRENGTH_DEFAULT))
  const update = rafThrottle((cx: number, cy: number) => {
    const r = el.getBoundingClientRect()
    const dx = cx - (r.left + r.width / 2)
    const dy = cy - (r.top + r.height / 2)
    setVar(el, '--mx-off', clamp(dx * strength, -26, 26), 'px')
    setVar(el, '--my-off', clamp(dy * strength, -18, 18), 'px')
  })
  const reset = () => {
    setVar(el, '--mx-off', '0px')
    setVar(el, '--my-off', '0px')
  }
  return { update, reset }
}

let observer: MutationObserver | null = null
const wired = new WeakSet<HTMLElement>()

export function mountMagnetic(): () => void {
  if (!IS_BROWSER || prefersReducedMotion() || !isFinePointer()) return () => {}

  const wire = (el: HTMLElement) => {
    if (wired.has(el)) return
    wired.add(el)
    const ctrl = attach(el)
    el.addEventListener('pointerenter', () => {
      el.dataset.attracting = 'true'
    })
    el.addEventListener('pointermove', (e) => ctrl.update(e.clientX, e.clientY))
    el.addEventListener('pointerleave', () => {
      delete el.dataset.attracting
      ctrl.reset()
    })
  }

  const scan = () => qa('.ui-magnet').forEach(wire)
  scan()

  observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer?.disconnect()
    observer = null
  }
}

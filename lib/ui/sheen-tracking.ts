/**
 * lib/ui/sheen-tracking.ts — specular sheen coordinates.
 * Keeps --mx/--my fresh on any .ui-sheen / .ui-rim surface so the
 * light pools in styles/ui/09 track the pointer exactly.
 */
import { IS_BROWSER, isFinePointer, prefersReducedMotion, rafThrottle, setVar } from './dom'

export function mountSheenTracking(): () => void {
  if (!IS_BROWSER || prefersReducedMotion() || !isFinePointer()) return () => {}

  let current: HTMLElement | null = null

  const apply = rafThrottle((e: PointerEvent) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.ui-sheen, .ui-rim, .ui-card3d')
    if (el !== current) {
      if (current) current.removeAttribute('data-active')
      current = el
      if (el) el.setAttribute('data-active', 'true')
    }
    if (!current) return
    const r = current.getBoundingClientRect()
    setVar(current, '--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    setVar(current, '--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  })

  window.addEventListener('pointermove', apply, { passive: true })
  return () => window.removeEventListener('pointermove', apply)
}

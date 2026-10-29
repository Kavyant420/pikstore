/**
 * lib/ui/tilt-3d.ts — pointer-driven 3D tilt for cards & tiles.
 * Adds rotateX/rotateY plus sheen coordinates (--mx/--my) to any
 * element carrying .ui-card3d or [data-ui-tilt].
 */
import { IS_BROWSER, clamp, isFinePointer, prefersReducedMotion, qa, rafThrottle, setVar } from './dom'

const MAX_TILT = 9 // degrees

function wireTilt(el: HTMLElement): void {
  const max = Number.parseFloat(el.dataset.uiTiltMax ?? String(MAX_TILT))
  const layers = () => Array.from(el.querySelectorAll<HTMLElement>('[class*="ui-layer-"]'))

  const move = rafThrottle((cx: number, cy: number) => {
    const r = el.getBoundingClientRect()
    const px = (cx - r.left) / r.width
    const py = (cy - r.top) / r.height
    const rx = clamp((0.5 - py) * max * 2, -max, max)
    const ry = clamp((px - 0.5) * max * 2, -max, max)
    el.style.transform = `perspective(${getComputedStyle(document.documentElement).getPropertyValue('--ui-perspective') || '1200px'}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`
    // Sheen origin in % of the card
    setVar(el, '--mx', `${(px * 100).toFixed(1)}%`)
    setVar(el, '--my', `${(py * 100).toFixed(1)}%`)
    // Directional light angle for conic sheen
    setVar(el, '--sheen-angle', `${Math.round(Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 140)}deg`)
    // Per-layer micro parallax
    layers().forEach((layer, i) => {
      const depth = (i + 1) * 6
      layer.style.translate = `${(-ry / max) * depth}px ${(-rx / max) * -depth}px`
    })
  })

  const leave = () => {
    el.style.transform = ''
    layers().forEach((l) => (l.style.translate = ''))
  }

  el.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
  el.addEventListener('pointerenter', () => el.setAttribute('data-tilting', 'true'))
  el.addEventListener('pointerleave', () => {
    el.removeAttribute('data-tilting')
    leave()
  })
}

export function mountTilt3d(): () => void {
  if (!IS_BROWSER || prefersReducedMotion() || !isFinePointer()) return () => {}

  const wired = new WeakSet<HTMLElement>()
  const scan = () => {
    qa('.ui-card3d, .ui-spotlight-tile, [data-ui-tilt]').forEach((el) => {
      if (wired.has(el)) return
      wired.add(el)
      wireTilt(el)
    })
  }
  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => observer.disconnect()
}

/**
 * lib/ui/scroll-stage.ts — scroll choreography for the whole page.
 *  - publishes --scroll-progress (0-100) for the progress rail
 *  - publishes --scroll-delta for parallax bands
 *  - sets data-scrolled / data-hidden on [data-ui-header]
 *  - adds .is-visible to reveal targets via IntersectionObserver
 */
import { IS_BROWSER, clamp, prefersReducedMotion, rafThrottle, setVar } from './dom'

export function mountScrollStage(): () => void {
  if (!IS_BROWSER) return () => {}

  const root = document.documentElement
  let lastY = window.scrollY

  const onScroll = rafThrottle(() => {
    const y = window.scrollY
    const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
    const progress = clamp((y / max) * 100, 0, 100)
    setVar(root, '--scroll-progress', `${progress.toFixed(2)}%`)
    setVar(root, '--scroll-delta', `${(y - window.innerHeight / 2).toFixed(0)}px`)

    // Header state machine: compact after hero, hide on dive, show on rise
    const header = document.querySelector<HTMLElement>('[data-ui-header]')
    if (header) {
      header.dataset.scrolled = String(y > 48)
      const diving = y > lastY + 6 && y > 320
      const climbing = y < lastY - 6
      if (diving) header.dataset.hidden = 'true'
      else if (climbing) header.dataset.hidden = 'false'
      if (y <= 48) header.dataset.hidden = 'false'
    }
    lastY = y
  })

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Reveal orchestration (works with or without scroll-timeline CSS)
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        el.classList.add('is-visible')
        if (el.dataset.uiStagger !== undefined) {
          Array.from(el.children).forEach((child, i) =>
            setVar(child as HTMLElement, '--stagger-i', i),
          )
        }
        if (el.classList.contains('ui-pill-rail')) {
          Array.from(el.querySelectorAll('.ui-pill')).forEach((pill, i) =>
            setVar(pill as HTMLElement, '--i', i),
          )
        }
        io.unobserve(el)
      }
    },
    { threshold: prefersReducedMotion() ? 0 : 0.12, rootMargin: '0px 0px -8% 0px' },
  )

  const observeAll = () => {
    document
      .querySelectorAll('[data-ui-reveal], [data-ui-stagger], .ui-pill-rail')
      .forEach((el) => io.observe(el))
  }
  observeAll()

  const mo = new MutationObserver(observeAll)
  mo.observe(document.body, { childList: true, subtree: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
    io.disconnect()
    mo.disconnect()
  }
}

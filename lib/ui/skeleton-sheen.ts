/**
 * lib/ui/skeleton-sheen.ts — skeleton index staggering + exit dissolve.
 * Assigns --skel-i per skeleton and marks data-loaded when its host list
 * swaps to real content (MutationObserver on [data-ui-list]).
 */
import { IS_BROWSER, prefersReducedMotion, qa, setVar } from './dom'

export function mountSkeletonSheen(): () => void {
  if (!IS_BROWSER || prefersReducedMotion()) return () => {}

  const tagAll = () => {
    qa('.ui-skeleton').forEach((el, i) => {
      if (!el.style.getPropertyValue('--skel-i')) setVar(el, '--skel-i', i % 8)
    })
  }
  tagAll()

  // When a loading container stops being busy, dissolve its skeletons
  const markLoaded = (list: HTMLElement) => {
    const busy = list.getAttribute('aria-busy') === 'true'
    qa('.ui-skeleton', list).forEach((el) => {
      if (!busy) el.setAttribute('data-loaded', 'true')
      else el.removeAttribute('data-loaded')
    })
  }

  const lists = qa('[data-ui-list]')
  lists.forEach(markLoaded)

  const observer = new MutationObserver((records) => {
    for (const rec of records) {
      const target = rec.target as HTMLElement
      const list = (target.closest?.('[data-ui-list]') ?? target) as HTMLElement
      if (list instanceof HTMLElement && list.hasAttribute?.('data-ui-list')) markLoaded(list)
    }
    tagAll()
  })
  qa('[data-ui-list]').forEach((list) =>
    observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] }),
  )

  return () => observer.disconnect()
}

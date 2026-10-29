/**
 * lib/ui/text-cascade.ts — letter-level entrance for hero words.
 * Splits text inside [data-ui-cascade] into .char spans with an index
 * custom property so styles/ui/11 can animate them like a wave.
 */
import { IS_BROWSER, prefersReducedMotion, qa, setVar } from './dom'

export function mountTextCascade(): () => void {
  if (!IS_BROWSER || prefersReducedMotion()) return () => {}

  const split = (el: HTMLElement) => {
    if (el.dataset.uiCascaded === 'true') return
    el.dataset.uiCascaded = 'true'
    const text = el.textContent ?? ''
    el.textContent = ''
    el.classList.add('ui-cascade')
    let i = 0
    for (const ch of text) {
      const span = document.createElement('span')
      span.className = 'char'
      span.textContent = ch === ' ' ? '\u00A0' : ch
      setVar(span, '--char-i', i++)
      el.appendChild(span)
    }
  }

  qa('[data-ui-cascade]').forEach(split)
  const observer = new MutationObserver(() => qa('[data-ui-cascade]').forEach(split))
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

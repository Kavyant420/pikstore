/**
 * lib/ui/island-toast.ts — dynamic-island toast engine.
 * Any code (or UI event) can raise an island message; this module owns the
 * single fixed element at top-center and its bloom/collapse physics.
 */
import { IS_BROWSER, emitUi } from './dom'

export interface IslandMessage {
  title: string
  subtitle?: string
  tone?: 'neutral' | 'success' | 'danger'
  ms?: number
}

let island: HTMLElement | null = null
let hideTimer: number | null = null

function ensureIsland(): HTMLElement {
  if (island && document.body.contains(island)) return island
  island = document.createElement('div')
  island.className = 'ui-island glass-panel ui-glass fixed left-1/2 top-[calc(var(--spacing)*3)] z-[90] -translate-x-1/2'
  island.setAttribute('role', 'status')
  island.setAttribute('aria-live', 'polite')
  island.style.transformOrigin = '50% 0%'
  document.body.appendChild(island)
  return island
}

export function showIsland(msg: IslandMessage): void {
  if (!IS_BROWSER) return
  const el = ensureIsland()
  el.dataset.leaving = 'false'
  el.innerHTML = `
    <div class="flex items-center gap-2.5 px-4 py-2.5">
      <span class="ui-island-pip h-2 w-2 rounded-full bg-white ${msg.tone === 'danger' ? 'bg-red-400' : msg.tone === 'success' ? 'bg-emerald-400' : ''}"></span>
      <div class="min-w-0">
        <p class="truncate text-[13px] font-medium text-white">${escapeHtml(msg.title)}</p>
        ${msg.subtitle ? `<p class="truncate text-[11px] text-white/50">${escapeHtml(msg.subtitle)}</p>` : ''}
      </div>
    </div>`
  // Restart bloom animation
  el.style.animation = 'none'
  void el.offsetHeight
  el.style.animation = ''
  if (hideTimer) window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => dismissIsland(), msg.ms ?? 2600)
}

export function dismissIsland(): void {
  if (!island) return
  island.dataset.leaving = 'true'
  const el = island
  window.setTimeout(() => {
    if (el.dataset.leaving === 'true') el.remove()
    if (island === el) island = null
  }, 430)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function mountIslandToast(): () => void {
  if (!IS_BROWSER) return () => {}
  const onNotify = (e: Event) => {
    const detail = (e as CustomEvent<Partial<IslandMessage>>).detail
    if (detail?.title) showIsland({ title: detail.title, ...detail })
  }
  const onDownload = (e: Event) => {
    const name = (e as CustomEvent<{ name?: string }>).detail?.name
    if (name) showIsland({ title: `Preparing ${name}`, subtitle: 'Verifying signature chain…', ms: 2200 })
  }
  const onComplete = (e: Event) => {
    const appId = (e as CustomEvent<{ appId?: string }>).detail?.appId
    showIsland({ title: 'Link ready', subtitle: appId ? `Redirecting for ${appId}` : undefined, tone: 'success', ms: 1800 })
  }
  window.addEventListener('ui:notify', onNotify)
  window.addEventListener('ui:download-start', onDownload)
  window.addEventListener('ui:download-complete', onComplete)
  return () => {
    window.removeEventListener('ui:notify', onNotify)
    window.removeEventListener('ui:download-start', onDownload)
    window.removeEventListener('ui:download-complete', onComplete)
  }
}

// Re-export emitter so components can raise events without importing dom utils
export { emitUi }

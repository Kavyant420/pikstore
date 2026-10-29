/**
 * lib/ui/download-physics.ts — download choreography FX.
 * Listens for ui:download-start (dispatched by the Get button) and runs a
 * simulated progress curve against [data-ui-progress-for="<appId>"] tracks,
 * finishing with a light burst. Pure DOM — never blocks the real redirect.
 */
import { IS_BROWSER, emitUi, prefersReducedMotion, setVar, tween } from './dom'

type Track = HTMLElement & { _uiCancel?: () => void }

function trackFor(appId: string): Track | null {
  return document.querySelector<Track>(`[data-ui-progress-for="${CSS.escape(appId)}"]`)
}

function runProgress(track: Track, durationMs = 2600): void {
  if (prefersReducedMotion()) {
    setVar(track, '--progress', '100%')
    return
  }
  track._uiCancel?.()
  const liquid = track.querySelector<HTMLElement>('.ui-progress-liquid')
  if (liquid) liquid.classList.add('ui-progress-stripes')
  let lastPct = -1
  track._uiCancel = tween(0, 100, durationMs, (v) => {
    const pct = Math.round(v)
    if (pct === lastPct) return
    lastPct = pct
    setVar(track, '--progress', `${pct}%`)
    if (track.dataset.uiBar) setVar(document.documentElement, track.dataset.uiBar, pct / 100)
  }, (t) => 1 - Math.pow(1 - t, 2.4))
  window.setTimeout(() => {
    if (liquid) liquid.classList.remove('ui-progress-stripes')
    const burst = document.createElement('span')
    burst.className = 'ui-progress-burst'
    track.appendChild(burst)
    burst.addEventListener('animationend', () => burst.remove(), { once: true })
    emitUi(track, 'download-complete', { appId: track.dataset.uiProgressFor })
  }, durationMs + 80)
}

export function mountDownloadPhysics(): () => void {
  if (!IS_BROWSER) return () => {}

  const onStart = (e: Event) => {
    const detail = (e as CustomEvent<{ appId?: string }>).detail
    if (!detail?.appId) return
    const track = trackFor(detail.appId)
    if (track) runProgress(track)
  }

  window.addEventListener('ui:download-start', onStart)
  return () => window.removeEventListener('ui:download-start', onStart)
}

/** Helper other modules/buttons can call directly. */
export function pulseProgress(appId: string, durationMs?: number): void {
  const track = trackFor(appId)
  if (track) runProgress(track, durationMs)
}

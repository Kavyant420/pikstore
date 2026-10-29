/**
 * lib/ui/foundry.ts — the UI Foundry bootstrapper.
 * One call mounts every dedicated interaction module: cursor spotlight,
 * magnetic buttons, 3D tilt, scroll stage, sheen tracking, ripple press,
 * parallax fields, text cascade, skeleton sheen, download physics and the
 * island toast engine. Also injects the persistent FX layers (spotlight,
 * grain, aurora, progress rail) so components never have to render them.
 */
'use client'

import { IS_BROWSER } from './dom'
import { mountCursorSpotlight } from './cursor-spotlight'
import { mountMagnetic } from './magnetic'
import { mountTilt3d } from './tilt-3d'
import { mountScrollStage } from './scroll-stage'
import { mountSheenTracking } from './sheen-tracking'
import { mountRipplePress } from './ripple-press'
import { mountParallaxPointer } from './parallax-pointer'
import { mountTextCascade } from './text-cascade'
import { mountSkeletonSheen } from './skeleton-sheen'
import { mountDownloadPhysics } from './download-physics'
import { mountIslandToast } from './island-toast'

export type UiFoundryOptions = {
  /** Skip injecting ambient layers (spotlight/grain/rail). */
  layers?: boolean
}

function injectFxLayers(): void {
  if (!IS_BROWSER || document.getElementById('ui-foundry-layers')) return
  const host = document.createElement('div')
  host.id = 'ui-foundry-layers'
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0'
  host.innerHTML = `
    <div class="ui-aurora"></div>
    <div class="ui-spotlight"></div>
    <div class="ui-grain"></div>
    <div class="ui-progress-rail"><span class="ui-progress-fill"></span><span class="ui-progress-dot"></span></div>
    <div class="ui-progress-topline"></div>
    <div class="ui-cursor-halo"></div>
    <div class="ui-cursor-dot"></div>`
  document.body.appendChild(host)
}

let teardown: (() => void) | null = null

export function mountUiFoundry(options: UiFoundryOptions = {}): () => void {
  if (!IS_BROWSER) return () => {}
  if (teardown) return teardown

  if (options.layers !== false) injectFxLayers()

  const cleanups = [
    mountScrollStage(),
    mountCursorSpotlight(),
    mountSheenTracking(),
    mountTilt3d(),
    mountMagnetic(),
    mountRipplePress(),
    mountParallaxPointer(),
    mountTextCascade(),
    mountSkeletonSheen(),
    mountDownloadPhysics(),
    mountIslandToast(),
  ]

  teardown = () => {
    teardown = null
    for (const fn of cleanups) fn()
    document.getElementById('ui-foundry-layers')?.remove()
  }
  return teardown
}

/** Calm mode: strips all motion FX at once (respects user preference too). */
export function setUICalm(calm: boolean): void {
  if (!IS_BROWSER) return
  document.documentElement.dataset.calm = String(calm)
}

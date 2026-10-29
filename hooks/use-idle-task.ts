// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
"use client"

/**
 * Schedules expensive work (WebGL init, AI calls) into idle callbacks with
 * a guaranteed timeout fallback — keeps INP/LCP fast on Vercel edge renders.
 */
import { useEffect, useRef } from 'react'

type IdleHandle = number & { cancel?: () => void }

export function useIdleTask(task: () => void, timeoutMs = 2000, enabled = true): void {
  const saved = useRef(task)
  saved.current = task
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts: { timeout: number }) => IdleHandle; cancelIdleCallback?: (h: IdleHandle) => void }
    const run = () => { if (!cancelled) saved.current() }
    if (typeof w.requestIdleCallback === 'function') {
      const h = w.requestIdleCallback(run, { timeout: timeoutMs })
      return () => { cancelled = true; w.cancelIdleCallback?.(h) }
    }
    const t = setTimeout(run, Math.min(timeoutMs, 200))
    return () => { cancelled = true; clearTimeout(t) }
  }, [timeoutMs, enabled])
}

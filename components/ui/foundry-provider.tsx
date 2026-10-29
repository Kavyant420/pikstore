'use client'

/**
 * components/ui/foundry-provider.tsx — mounts the UI Foundry once per app.
 * Wraps children; all foundry modules are plain-DOM so they work regardless
 * of React render churn (MutationObservers re-scan for new surfaces).
 */
import { useEffect, type ReactNode } from 'react'
import { mountUiFoundry, setUICalm } from '@/lib/ui/foundry'

export function UiFoundryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Respect OS-level reduced motion by defaulting into calm mode
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setUICalm(true)
    const teardown = mountUiFoundry()
    return teardown
  }, [])
  return <>{children}</>
}

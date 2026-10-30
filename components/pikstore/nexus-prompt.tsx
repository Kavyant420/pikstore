'use client'

import { Brain, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { findCatalogApp } from '@/lib/catalog'
import { NEXUS_OWNER, NEXUS_REPO } from '@/lib/nexus'
import { useStore } from './store-provider'

const DISMISS_KEY = 'pikstore:nexus-prompt-dismissed'

/**
 * Homepage suggestion popup for Nexus Assistant (first-party PIK Intelligence
 * app). Appears shortly after the homepage loads — unless the visitor already
 * dismissed it before (persisted in localStorage) or has the scan dialog open.
 * "Install" routes through the store's real install pipeline: a PikShield scan
 * that resolves to the Nexus-specific install popup (NexusView in scan-dialog).
 */
export function NexusPrompt() {
  const { install, installState, installOpen, openApp, platform } = useStore()
  const [visible, setVisible] = useState(false)

  // Entrance delay so the popup doesn't fight the hero animation on load.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let dismissed = false
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // Storage blocked (private mode) — show it anyway.
    }
    if (dismissed) return
    const timer = window.setTimeout(() => setVisible(true), 1800)
    return () => window.clearTimeout(timer)
  }, [])

  // Hide while any scan/install dialog is open so dialogs never stack.
  const dialogBusy = installOpen || !!installState
  const shown = visible && !dialogBusy

  function dismiss() {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore persistence failures.
    }
  }

  function installNexus() {
    const nexus = findCatalogApp(NEXUS_OWNER, NEXUS_REPO)
    if (!nexus) return
    dismiss()
    if (platform) {
      install(nexus, platform)
    } else {
      openApp(nexus)
    }
  }

  if (!shown) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="nexus-prompt-title"
      className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end sm:px-0"
    >
      <div className="glass glass-strong pointer-events-auto relative flex w-full max-w-sm animate-[island-in_600ms_cubic-bezier(0.22,1,0.36,1)_both] flex-col gap-4 rounded-[2rem] p-5 shadow-[0_18px_50px_-20px_oklch(0_0_0/0.9)]">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Nexus suggestion"
          className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
            <Brain className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Recommended for you
            </p>
            <h2 id="nexus-prompt-title" className="text-base font-semibold tracking-tight">
              Meet Nexus Assistant
            </h2>
          </div>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          A private, fully-offline AI assistant by PIK Intelligence. On-device llama.cpp inference, pinned
          SHA-256 model integrity, zero cloud calls. Scanned clean by PikShield.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={installNexus}
            className="btn-primary h-11 flex-1 rounded-full text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
          >
            Install now
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="glass inline-flex h-11 flex-1 items-center justify-center rounded-full text-sm font-semibold outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

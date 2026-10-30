'use client'

import { Brain, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nexusInstallerUrl } from '@/lib/nexus'
import { detectPlatform } from '@/lib/platform'
import { useStore } from './store-provider'

const DISMISS_KEY = 'pikstore:nexus-prompt-dismissed'

/**
 * Homepage suggestion popup for Nexus Assistant (first-party PIK Intelligence
 * app). Appears shortly after the homepage loads — unless the visitor already
 * dismissed it before (persisted in localStorage) or has the scan dialog open.
 * "Install" downloads the NexusAssistant-Setup.exe straight from PikStore's
 * own endpoint (/api/download/nexus-setup) — no GitHub redirect, no git clone.
 * The .exe then completes setup automatically with zero user interference.
 */
export function NexusPrompt() {
  const { downloadInstaller, notice, installState, installOpen } = useStore()
  const [visible, setVisible] = useState(false)
  // The store's DownloadIsland takes over once the .exe fetch starts.
  const downloading = !!notice && notice.app.id === 'pik-intelligence/nexus-ai'

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
    // Direct first-party download of the silent installer — stays on
    // pikstore.vercel.app, no GitHub redirect. Android gets the .apk.
    const ok = downloadInstaller(nexusInstallerUrl(detectPlatform() ?? 'windows'))
    if (ok) dismiss()
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
          Gemini-level assistance powered by an on-device Qwen3-0.6B engine. One click downloads the signed
          NexusAssistant-Setup.exe directly from this page — no GitHub redirect, no terminal, no source
          checkout. After the download finishes, setup completes itself with zero clicks.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={installNexus}
            disabled={downloading}
            className="btn-primary h-11 flex-1 rounded-full text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-60"
          >
            {downloading ? 'Downloading — setup will finish itself' : 'Install .exe now'}
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

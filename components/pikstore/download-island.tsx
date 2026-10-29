'use client'

import { ArrowDown } from 'lucide-react'
import { AppIcon } from './app-icon'
import { useStore } from './store-provider'

export function DownloadIsland() {
  const { notice, installOpen } = useStore()

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex justify-center px-4 md:top-24">
      {/* BUG FIX: the island used to be display:none while the scan dialog was
          open, so clicking Get appeared to do nothing on cards whose sheet was
          closed — there was zero visible feedback for ~3 seconds. The island
          now stays mounted and slides up with a spring entrance whenever a
          notice exists; the dialog simply layers above it (z-[70] vs z-[80]). */}
      {notice && (
        <div
          key={notice.id}
          data-dialog-open={installOpen || undefined}
          className="glass glass-strong pointer-events-auto flex max-w-full translate-y-0 items-center gap-3 rounded-full py-2 pr-2 pl-2 shadow-[0_18px_50px_-20px_oklch(0_0_0/0.9)] animate-[island-in_600ms_cubic-bezier(0.22,1,0.36,1)_both] transition-[opacity,transform] duration-300 data-[dialog-open]:-translate-y-1 data-[dialog-open]:opacity-90"
        >
          <AppIcon app={notice.app} className="size-9" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{notice.title}</span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">{notice.detail}</span>
          </div>
          <span className="relative ml-2 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
            <ArrowDown className="size-4 animate-bounce" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  )
}

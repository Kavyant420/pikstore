'use client'

import { ArrowDown } from 'lucide-react'
import { AppIcon } from './app-icon'
import { useStore } from './store-provider'

export function DownloadIsland() {
  const { notice, installOpen } = useStore()

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex justify-center px-4 md:top-24">
      {notice && !installOpen && (
        <div
          key={notice.id}
          className="glass glass-strong flex max-w-full items-center gap-3 rounded-full py-2 pr-2 pl-2 animate-[island-in_600ms_cubic-bezier(0.22,1,0.36,1)_both]"
        >
          <AppIcon app={notice.app} className="size-9" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{notice.title}</span>
            <span className="truncate font-mono text-[11px] text-muted-foreground">{notice.detail}</span>
          </div>
          <span className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <ArrowDown className="size-4 animate-bounce" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  )
}

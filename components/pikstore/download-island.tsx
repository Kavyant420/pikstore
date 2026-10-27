'use client'

import { ArrowDown } from 'lucide-react'
import Image from 'next/image'
import { PLATFORM_EXT, PLATFORM_LABEL } from '@/lib/platform'
import { useStore } from './store-provider'

export function DownloadIsland() {
  const { notice } = useStore()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4 md:top-24"
    >
      {notice && (
        <div
          key={notice.id}
          className="glass glass-strong flex items-center gap-3 rounded-full py-2 pr-4 pl-2 animate-[island-in_600ms_cubic-bezier(0.22,1,0.36,1)_both]"
        >
          <Image src={notice.app.icon} alt="" width={36} height={36} loading="eager" className="app-icon size-9" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Downloading {notice.app.name}</span>
            <span className="text-xs text-muted-foreground">
              {PLATFORM_LABEL[notice.platform]} · .{PLATFORM_EXT[notice.platform]} ·{' '}
              {notice.app.builds[notice.platform]?.size}
            </span>
          </div>
          <span className="ml-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ArrowDown className="size-4 animate-bounce" strokeWidth={2.75} aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  )
}

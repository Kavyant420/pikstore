import Image from 'next/image'
import { PLATFORMS, PLATFORM_LABEL } from '@/lib/platform'
import { PlatformIcon } from './platform-icon'

export function SiteFooter() {
  return (
    <footer className="glass mt-8 flex flex-col gap-8 rounded-[2rem] p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex items-center gap-3">
        <Image src="/pikstore-mark.png" alt="" width={44} height={44} className="app-icon size-11" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight">pikstore</span>
          <span className="text-sm text-muted-foreground">One store. Every device you own.</span>
        </div>
      </div>
      <ul className="flex flex-wrap items-center gap-2" aria-label="Supported platforms">
        {PLATFORMS.map((p) => (
          <li
            key={p}
            className="glass glass-clear flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-muted-foreground"
          >
            <PlatformIcon platform={p} className="size-3.5 text-foreground" />
            {PLATFORM_LABEL[p]}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{'© 2026 PikStore'}</p>
    </footer>
  )
}

'use client'

import { Star } from 'lucide-react'
import { useTilt } from '@/hooks/use-tilt'
import type { StoreApp } from '@/lib/catalog'
import { PLATFORMS, PLATFORM_LABEL, formatCount } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { AppIcon } from './app-icon'
import { GetButton } from './get-button'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

export function AppCard({ app }: { app: StoreApp }) {
  const { openApp, platform } = useStore()
  const tilt = useTilt<HTMLElement>(10)

  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="tilt glass sheen group relative flex flex-col gap-5 rounded-[1.75rem] p-5"
    >
      <button
        type="button"
        onClick={() => openApp(app)}
        className="absolute inset-0 z-[5] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${app.name}`}
      />
      <div className="flex items-start justify-between gap-3">
        <AppIcon app={app} className="tilt-pop size-16 transition-transform duration-500 [--pop:28px]" />
        <GetButton app={app} />
      </div>
      <div className="tilt-pop flex min-w-0 flex-col gap-1.5 [--pop:16px]">
        <h3 className="truncate text-lg font-semibold tracking-tight">{app.name}</h3>
        <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">{app.tagline}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        {app.platforms ? (
          <div className="flex items-center gap-2" aria-label={`Available on ${app.platforms.map((p) => PLATFORM_LABEL[p]).join(', ')}`}>
            {PLATFORMS.map((p) => (
              <span
                key={p}
                title={PLATFORM_LABEL[p]}
                className={cn(
                  'transition-colors',
                  !app.platforms?.includes(p)
                    ? 'text-foreground/15'
                    : p === platform
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                <PlatformIcon platform={p} className="size-3.5" />
              </span>
            ))}
          </div>
        ) : (
          <span className="truncate font-mono text-[11px] text-muted-foreground">{app.id}</span>
        )}
        {app.stars !== undefined ? (
          <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Star className="size-3 fill-current" aria-hidden="true" />
            {formatCount(app.stars)}
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{app.category}</span>
        )}
      </div>
    </article>
  )
}

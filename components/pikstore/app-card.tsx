'use client'

import Image from 'next/image'
import type { StoreApp } from '@/lib/apps'
import { PLATFORMS, PLATFORM_LABEL } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { GetButton } from './get-button'
import { PlatformIcon } from './platform-icon'
import { Rating } from './rating'
import { useStore } from './store-provider'

function trackPointer(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

export function AppCard({ app, index = 0 }: { app: StoreApp; index?: number }) {
  const { platform, openApp } = useStore()

  return (
    <article
      onPointerMove={trackPointer}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="glass glass-sheen animate-rise group relative flex flex-col gap-4 rounded-[1.75rem] p-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
    >
      <div className="relative z-[2] flex items-start gap-4">
        <Image
          src={app.icon}
          alt=""
          width={72}
          height={72}
          className="app-icon size-16 transition-transform duration-500 group-hover:scale-105 md:size-[72px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
          <h3 className="truncate text-base font-semibold">
            <button
              type="button"
              onClick={() => openApp(app)}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {app.name}
            </button>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{app.category}</p>
          <Rating value={app.rating} className="mt-1" />
        </div>
      </div>

      <p className="relative z-[2] line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">
        {app.tagline}
      </p>

      <div className="relative z-[2] mt-auto flex items-center justify-between gap-3">
        <ul className="flex items-center gap-1.5" aria-label="Available platforms">
          {PLATFORMS.map((p) => {
            const supported = Boolean(app.builds[p])
            return (
              <li
                key={p}
                title={PLATFORM_LABEL[p]}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full transition-colors',
                  supported ? 'bg-secondary text-foreground' : 'text-muted-foreground/40',
                  supported && p === platform && 'bg-primary/25 text-primary',
                )}
              >
                <PlatformIcon platform={p} className="size-3.5" />
                <span className="sr-only">
                  {PLATFORM_LABEL[p]} {supported ? 'available' : 'not available'}
                </span>
              </li>
            )
          })}
        </ul>
        <GetButton app={app} />
      </div>
    </article>
  )
}

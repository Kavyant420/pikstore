'use client'

import { PLATFORMS, PLATFORM_EXT, PLATFORM_LABEL } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

export function PlatformSwitcher() {
  const { platform, detected, setPlatform } = useStore()
  const activeIndex = platform ? PLATFORMS.indexOf(platform) : -1

  return (
    <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
      <div
        role="radiogroup"
        aria-label="Download builds for"
        className="glass relative grid w-full grid-cols-4 rounded-full p-1 md:w-[440px]"
      >
        <span
          aria-hidden="true"
          className={cn(
            'glass pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-foreground/15 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] [--glass-highlight:oklch(1_0_0/0.8)]',
            activeIndex < 0 && 'opacity-0',
          )}
          style={{
            width: 'calc((100% - 0.5rem) / 4)',
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          }}
        />
        {PLATFORMS.map((p) => {
          const active = p === platform
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPlatform(p)}
              className={cn(
                'relative z-10 flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <PlatformIcon platform={p} className="hidden size-4 sm:block" />
              <span>{PLATFORM_LABEL[p]}</span>
              {detected === p && (
                <span className="absolute top-1.5 right-2 size-1.5 rounded-full bg-primary" aria-label="(your device)" />
              )}
            </button>
          )
        })}
      </div>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-right" aria-live="polite">
        {platform ? (
          <>
            {platform === detected ? 'Detected ' : 'Browsing '}
            <span className="font-semibold text-foreground">{PLATFORM_LABEL[platform]}</span>
            {' · every Get button delivers the '}
            <span className="font-mono text-foreground">.{PLATFORM_EXT[platform]}</span>
            {' build'}
            {detected && platform !== detected && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => setPlatform(detected)}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Back to {PLATFORM_LABEL[detected]}
                </button>
              </>
            )}
          </>
        ) : (
          'Choose your device and we will match every download to it.'
        )}
      </p>
    </div>
  )
}

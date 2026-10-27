'use client'

import { PLATFORMS, PLATFORM_EXT, PLATFORM_LABEL } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

export function PlatformSwitcher() {
  const { platform, detected, setPlatform } = useStore()
  const activeIndex = platform ? PLATFORMS.indexOf(platform) : -1

  return (
    <div className="flex w-full flex-col gap-3">
      <div role="radiogroup" aria-label="Download builds for" className="glass relative grid w-full grid-cols-4 rounded-full p-1">
        <span
          aria-hidden="true"
          className={cn(
            'btn-primary pointer-events-none absolute top-1 bottom-1 left-1 rounded-full transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]',
            activeIndex < 0 && 'opacity-0',
          )}
          style={{ width: 'calc((100% - 0.5rem) / 4)', transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
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
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <PlatformIcon platform={p} className="hidden size-4 sm:block" />
              <span>{PLATFORM_LABEL[p]}</span>
              {detected === p && (
                <span
                  className={cn('absolute top-1.5 right-2.5 size-1.5 rounded-full', active ? 'bg-primary-foreground' : 'bg-foreground')}
                  aria-label="(this device)"
                />
              )}
            </button>
          )
        })}
      </div>
      <p className="text-pretty font-mono text-xs leading-relaxed text-muted-foreground" aria-live="polite">
        {platform ? (
          <>
            {platform === detected ? 'DETECTED ' : 'BROWSING '}
            <span className="text-foreground">{PLATFORM_LABEL[platform].toUpperCase()}</span>
            {' → every Get delivers a scanned '}
            <span className="text-foreground">.{platform === 'ios' ? 'ipa / App Store' : PLATFORM_EXT[platform]}</span>
            {detected && platform !== detected && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => setPlatform(detected)}
                  className="text-foreground underline underline-offset-4"
                >
                  back to {PLATFORM_LABEL[detected]}
                </button>
              </>
            )}
          </>
        ) : (
          'SELECT YOUR DEVICE → we match every download to it'
        )}
      </p>
    </div>
  )
}

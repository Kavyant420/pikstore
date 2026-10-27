'use client'

import { useTilt } from '@/hooks/use-tilt'
import { BRAND_ICONS } from '@/lib/brand-icons'
import { CATALOG, type StoreApp } from '@/lib/catalog'
import { PLATFORMS } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { AppIcon } from './app-icon'
import { GetButton } from './get-button'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

function PickCard({ app, hero }: { app: StoreApp; hero?: boolean }) {
  const { openApp } = useStore()
  const tilt = useTilt<HTMLElement>(hero ? 5 : 8)
  const brand = app.icon ? BRAND_ICONS[app.icon] : undefined

  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className={cn(
        'tilt glass sheen group relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] p-6 sm:p-8',
        hero && 'md:col-span-2 md:min-h-[22rem]',
      )}
    >
      {brand && (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={cn(
            'tilt-pop pointer-events-none absolute text-foreground/[0.06] transition-colors duration-700 group-hover:text-foreground/[0.1]',
            hero ? '-right-10 -bottom-16 size-[26rem] [--pop:60px]' : '-right-8 -bottom-10 size-64 [--pop:50px]',
          )}
        >
          <path d={brand.path} />
        </svg>
      )}

      <div className="tilt-pop relative z-10 flex items-center justify-between [--pop:24px]">
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {hero ? "Editor's choice" : app.category}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {PLATFORMS.filter((p) => app.platforms?.includes(p)).map((p) => (
            <PlatformIcon key={p} platform={p} className="size-3.5" />
          ))}
        </span>
      </div>

      <div className="tilt-pop relative z-10 flex flex-col gap-6 [--pop:40px]">
        <h3 className={cn('text-balance font-semibold tracking-[-0.04em]', hero ? 'text-4xl sm:text-5xl' : 'text-3xl')}>
          {app.featured}
        </h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => openApp(app)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AppIcon app={app} className="size-12" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{app.name}</span>
              <span className="truncate text-sm text-muted-foreground">{app.tagline}</span>
            </span>
          </button>
          <GetButton app={app} />
        </div>
      </div>
    </article>
  )
}

export function FeaturedPicks() {
  const picks = CATALOG.filter((a) => a.featured)

  return (
    <section id="picks" aria-labelledby="picks-title" className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8">
      <div className="mb-10 flex flex-col gap-3">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">Curated</p>
        <h2 id="picks-title" className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Worth installing today.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {picks.map((app, i) => (
          <PickCard key={app.id} app={app} hero={i === 0} />
        ))}
      </div>
    </section>
  )
}

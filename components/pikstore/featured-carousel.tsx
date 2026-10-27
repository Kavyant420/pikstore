'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { StoreApp } from '@/lib/apps'
import { cn } from '@/lib/utils'
import { GetButton } from './get-button'
import { useStore } from './store-provider'

const ROTATE_MS = 7000

export function FeaturedCarousel({ apps }: { apps: StoreApp[] }) {
  const { openApp } = useStore()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || apps.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % apps.length), ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [paused, apps.length])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured apps"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="glass relative h-[520px] overflow-hidden rounded-[2.25rem] md:h-[540px] md:rounded-[2.75rem]"
    >
      {apps.map((app, i) => {
        const active = i === index
        return (
          <div
            key={app.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${apps.length}: ${app.name}`}
            aria-hidden={!active}
            inert={!active}
            className={cn(
              'absolute inset-0 transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]',
              active ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.04] opacity-0',
            )}
          >
            {app.banner && (
              <Image
                src={app.banner}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1152px) 1152px, 100vw"
                className="object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-background/40"
            />

            <div className="relative flex h-full flex-col justify-between p-5 md:p-10">
              <div className="flex max-w-xl flex-col gap-3">
                <span className="glass glass-clear w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  {"Editor's Choice"}
                </span>
                <h2 className="text-balance text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
                  {app.tagline}
                </h2>
              </div>

              <div className="glass flex flex-col gap-4 rounded-[1.75rem] p-3 sm:flex-row sm:items-center sm:justify-between md:rounded-[2rem] md:p-4">
                <button
                  type="button"
                  onClick={() => openApp(app)}
                  className="flex min-w-0 items-center gap-4 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image src={app.icon} alt="" width={64} height={64} className="app-icon size-14 md:size-16" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-lg font-semibold">{app.name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {app.category} · {app.developer}
                    </span>
                  </span>
                </button>
                <GetButton app={app} size="lg" className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        )
      })}

      <div className="glass glass-clear absolute top-5 right-5 flex items-center gap-1.5 rounded-full p-2 md:top-10 md:right-10">
        {apps.map((app, i) => (
          <button
            key={app.slug}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${app.name}`}
            aria-current={i === index}
            className={cn(
              'h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-ring',
              i === index ? 'w-6 bg-foreground' : 'w-2 bg-foreground/40 hover:bg-foreground/70',
            )}
          />
        ))}
      </div>
    </section>
  )
}

'use client'

import { ArrowDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { CATALOG } from '@/lib/catalog'
import { PlatformSwitcher } from './platform-switcher'

const HeroScene = dynamic(() => import('./three/hero-scene'), { ssr: false })

export function Hero() {
  return (
    <section id="discover" aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden">
      <div className="absolute inset-0 -z-10 animate-[rise-in_1.6s_ease-out_both]">
        <HeroScene />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/4 bg-gradient-to-t from-background to-transparent" />

      <div className="pointer-events-none mx-auto flex min-h-svh max-w-6xl flex-col justify-end gap-10 px-5 pt-32 pb-14 md:justify-center md:px-8 md:pb-20">
        <div className="flex max-w-xl flex-col gap-6">
          <div className="glass sheen animate-rise flex w-fit items-center gap-3 rounded-full px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase [animation-delay:40ms]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/60" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </span>
            Live catalog / 180+ verified builds
          </div>
          <p className="animate-rise font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            PikStore · Verified distribution
          </p>
          <h1
            id="hero-title"
            className="animate-rise text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl [animation-delay:120ms]"
          >
            <span className="text-chrome">Every app.</span>
            <br />
            <span className="text-chrome">Every device.</span>
            <br />
            <span className="text-muted-foreground">Scanned first.</span>
          </h1>
          <p className="animate-rise max-w-md text-pretty text-base leading-relaxed text-muted-foreground [animation-delay:240ms]">
            PikStore recognises your device, fetches the official installer straight from the developer and checks it
            for threats before a single byte lands.
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col gap-6 animate-rise [animation-delay:360ms] md:max-w-xl">
          <PlatformSwitcher />
          <div className="flex items-center gap-6">
            <a
              href="#library"
              className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
            >
              Browse {CATALOG.length} apps
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              How scanning works
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

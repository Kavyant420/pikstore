'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { CATALOG, type Category } from '@/lib/catalog'
import { AppCard } from './app-card'
import { AppSheet } from './app-sheet'
import { CategoryBar } from './category-bar'
import { DownloadIsland } from './download-island'
import { FeaturedPicks } from './featured-picks'
import { Hero } from './hero'
import { MobileTabBar } from './mobile-tab-bar'
import { NexusPrompt } from './nexus-prompt'
import { ScanDialog } from './scan-dialog'
import { SearchField } from './search-field'
import { SecuritySection } from './security-section'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { StoreProvider, useStore } from './store-provider'
import { UiFoundryProvider } from '@/components/ui/foundry-provider'
import { UniverseResults } from './universe-results'

function Library({ query, onQueryChange }: { query: string; onQueryChange: (v: string) => void }) {
  const { platform } = useStore()
  const [category, setCategory] = useState<Category>('All')
  const [onlyMine, setOnlyMine] = useState(false)
  const deferredQuery = useDeferredValue(query)

  const apps = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return CATALOG.filter((app) => {
      if (category !== 'All' && app.category !== category) return false
      if (onlyMine && platform && !app.platforms?.includes(platform)) return false
      if (!q) return true
      return [app.name, app.tagline, app.category, app.id].some((v) => v?.toLowerCase().includes(q))
    })
  }, [deferredQuery, category, onlyMine, platform])

  return (
    <section id="library" aria-labelledby="library-title" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-8 px-5 py-20 md:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">The library</p>
          <h2 id="library-title" className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Built for the device in your hand.
          </h2>
        </div>
        {platform && (
          <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
            <span>Only show apps for this device</span>
            <button
              type="button"
              role="switch"
              aria-checked={onlyMine}
              onClick={() => setOnlyMine((v) => !v)}
              className="group relative h-7 w-12 shrink-0 rounded-full bg-secondary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring aria-checked:bg-foreground"
            >
              <span className="absolute top-1 left-1 size-5 rounded-full bg-foreground transition-[transform,background-color] duration-300 group-aria-checked:translate-x-5 group-aria-checked:bg-background" />
            </button>
          </label>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <SearchField value={query} onChange={onQueryChange} className="h-12 md:hidden" />
        <CategoryBar value={category} onChange={setCategory} />
      </div>

      {apps.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <p role="status" className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
          Nothing in the curated library matches. Try the open-source universe below.
        </p>
      )}

      <UniverseResults query={query} />
    </section>
  )
}

export function Storefront() {
  const [query, setQuery] = useState('')

  function focusLibrary() {
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <UiFoundryProvider>
    <StoreProvider>
      <SiteHeader query={query} onQueryChange={setQuery} onSearchSubmit={focusLibrary} />
      <main>
        <Hero />
        <FeaturedPicks />
        <Library query={query} onQueryChange={setQuery} />
        <SecuritySection />
      </main>
      <SiteFooter />
      <AppSheet />
      <ScanDialog />
      <DownloadIsland />
      <MobileTabBar />
      <NexusPrompt />
    </StoreProvider>
    </UiFoundryProvider>
  )
}

'use client'

import { SearchX } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { APPS, CATEGORIES, FEATURED_SLUGS, type StoreApp } from '@/lib/apps'
import { AppCard } from './app-card'
import { AppSheet } from './app-sheet'
import { CategoryBar } from './category-bar'
import { DownloadIsland } from './download-island'
import { FeaturedCarousel } from './featured-carousel'
import { MobileTabBar } from './mobile-tab-bar'
import { PlatformSwitcher } from './platform-switcher'
import { SearchField } from './search-field'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { StoreProvider } from './store-provider'
import { TopCharts } from './top-charts'

const featured = FEATURED_SLUGS.map((slug) => APPS.find((a) => a.slug === slug)).filter(
  (a): a is StoreApp => Boolean(a),
)

const charted = [...APPS].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))

function matches(app: StoreApp, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [app.name, app.developer, app.category, app.tagline].some((field) => field.toLowerCase().includes(q))
}

export function Storefront({ dateLabel }: { dateLabel: string }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const deferredQuery = useDeferredValue(query)
  const searching = deferredQuery.trim().length > 0

  const results = useMemo(
    () =>
      APPS.filter((app) => (category === 'All' || app.category === category) && matches(app, deferredQuery)),
    [category, deferredQuery],
  )

  return (
    <StoreProvider>
      <SiteHeader query={query} onQueryChange={setQuery} />
      <DownloadIsland />

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pt-28 pb-32 md:gap-20 md:px-6 md:pt-32 md:pb-16">
        <section id="discover" aria-labelledby="discover-title" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="animate-rise flex flex-col gap-1">
              <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{dateLabel}</p>
              <h1 id="discover-title" className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
                Discover
              </h1>
            </div>
            <div className="animate-rise [animation-delay:120ms]">
              <PlatformSwitcher />
            </div>
          </div>

          <SearchField value={query} onChange={setQuery} className="h-12 md:hidden" />

          {!searching && (
            <div className="animate-rise [animation-delay:220ms]">
              <FeaturedCarousel apps={featured} />
            </div>
          )}
        </section>

        {!searching && <TopCharts apps={charted} />}

        <section id="apps" aria-labelledby="apps-title" className="flex scroll-mt-28 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id="apps-title" className="text-3xl font-bold tracking-tight md:text-4xl">
              {searching ? `Results for “${deferredQuery.trim()}”` : 'All Apps'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? 'app' : 'apps'} · downloads match your device automatically
            </p>
          </div>

          <CategoryBar value={category} onChange={setCategory} />

          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((app, i) => (
                <AppCard key={app.slug} app={app} index={i} />
              ))}
            </div>
          ) : (
            <div className="glass flex flex-col items-center gap-3 rounded-[2rem] px-6 py-16 text-center">
              <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-lg font-semibold">No apps found</p>
              <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                Try a different name or category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
                className="glass-tint mt-2 h-10 rounded-full px-5 text-sm font-semibold text-primary-foreground"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <SiteFooter />
      </main>

      <MobileTabBar />
      <AppSheet />
    </StoreProvider>
  )
}

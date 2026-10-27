'use client'

import useSWR from 'swr'
import { useDebounced } from '@/hooks/use-debounced'
import type { StoreApp } from '@/lib/catalog'
import { AppCard } from './app-card'

type SearchResponse = { results: StoreApp[]; error?: string }

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  const body = (await res.json()) as SearchResponse
  if (!res.ok) throw new Error(body.error ?? 'Search failed')
  return body
}

export function UniverseResults({ query }: { query: string }) {
  const debounced = useDebounced(query.trim(), 400)
  const key = debounced.length >= 2 ? `/api/search?q=${encodeURIComponent(debounced)}` : null
  const { data, error, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: false, keepPreviousData: true })

  if (!key) return null

  return (
    <div className="flex flex-col gap-6 border-t border-border pt-12">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">Open-source universe</p>
        <h3 className="text-balance text-2xl font-semibold tracking-[-0.03em]">
          {'More results for “'}
          {debounced}
          {'” across GitHub'}
        </h3>
        <p className="max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
          Any public project that ships installers can be scanned and downloaded. Platforms are found live from each
          project&apos;s latest releases.
        </p>
      </div>

      {error ? (
        <p role="status" className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          {error.message}
        </p>
      ) : isLoading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Searching">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-52 animate-pulse rounded-[1.75rem]" />
          ))}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          No open-source projects matched.
        </p>
      )}
    </div>
  )
}

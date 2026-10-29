'use client'

import { Dialog } from '@base-ui/react/dialog'
import { ArrowUpRight, ShieldCheck, X } from 'lucide-react'
import useSWR from 'swr'
import type { StoreApp } from '@/lib/catalog'
import { PLATFORMS, PLATFORM_LABEL, formatBytes, formatCount } from '@/lib/platform'
import type { AppDetails } from '@/lib/scan-types'
import { cn } from '@/lib/utils'
import { AppIcon } from './app-icon'
import { GetButton } from './get-button'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

const fetcher = async (url: string): Promise<AppDetails> => {
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not load releases')
  return body
}

function SheetBody({ app }: { app: StoreApp }) {
  const { platform, detected } = useStore()
  const { data, error, isLoading } = useSWR(`/api/apps/${app.owner}/${app.repo}`, fetcher, { revalidateOnFocus: false })

  const effective: StoreApp = data
    ? {
        ...app,
        platforms: PLATFORMS.filter((p) => data.builds[p] || (p === 'ios' && app.appStoreId)),
      }
    : app

  const latest = data ? PLATFORMS.map((p) => data.builds[p]).find(Boolean) : null

  return (
    <div className="no-scrollbar max-h-[92dvh] overflow-y-auto">
      {/* `min-h-full` + centering keeps content vertically centered inside the card
          when it's short, and falls back to normal top-aligned scrolling when it overflows. */}
      <div className="flex min-h-full flex-col justify-center gap-7 p-5 sm:p-7">
        <div className="flex flex-col gap-5 pr-10 sm:flex-row sm:items-end sm:justify-between sm:pr-0">
          <div className="flex items-center gap-4">
            <AppIcon app={app} className="size-20 sm:size-24" />
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{app.name}</Dialog.Title>
              <a
                href={`https://github.com/${app.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {app.id}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>
          <GetButton app={effective} size="lg" className="w-full sm:w-auto" />
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border py-4 text-center">
          <div className="flex flex-col gap-1 px-2">
            <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Stars</dt>
            <dd className="text-lg font-semibold">{data ? formatCount(data.stars) : '—'}</dd>
          </div>
          <div className="flex flex-col gap-1 px-2">
            <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Version</dt>
            <dd className="truncate text-lg font-semibold">{latest?.version ?? '—'}</dd>
          </div>
          <div className="flex flex-col gap-1 px-2">
            <dt className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">License</dt>
            <dd className="truncate text-lg font-semibold">{data?.license ?? '—'}</dd>
          </div>
        </dl>

        <Dialog.Description className="text-pretty leading-relaxed text-muted-foreground">
          {data?.description ?? app.tagline}
        </Dialog.Description>

        <section aria-labelledby="builds-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 id="builds-title" className="font-semibold tracking-tight">
              Official builds
            </h3>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Scanned on download
            </span>
          </div>

          {error ? (
            <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">{error.message}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {PLATFORMS.map((p) => {
                const build = data?.builds[p]
                const viaAppStore = p === 'ios' && !!app.appStoreId
                const available = !!build || viaAppStore
                return (
                  <li
                    key={p}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3',
                      p === platform ? 'bg-secondary' : 'bg-muted',
                      data && !available && 'opacity-45',
                    )}
                  >
                    <PlatformIcon platform={p} className="size-5" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {PLATFORM_LABEL[p]}
                        {detected === p && (
                          <span className="rounded-full bg-foreground px-1.5 py-px font-mono text-[10px] text-background">
                            THIS DEVICE
                          </span>
                        )}
                      </span>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {isLoading
                          ? 'Resolving latest release…'
                          : viaAppStore
                            ? 'App Store · reviewed by Apple'
                            : build
                              ? `${build.name} · ${formatBytes(build.size)}`
                              : 'No official build'}
                      </span>
                    </div>
                    {available && <GetButton app={{ ...effective }} platform={p} label={viaAppStore ? 'Open' : 'Get'} />}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export function AppSheet() {
  const { sheetApp: app, sheetOpen, closeApp } = useStore()

  return (
    <Dialog.Root open={sheetOpen} onOpenChange={(open) => !open && closeApp()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6">
          <Dialog.Popup className="glass glass-strong pointer-events-auto relative max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-[2.25rem] text-foreground outline-none transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:translate-y-8 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-12 data-[starting-style]:opacity-0 sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95 sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95">
            {app && <SheetBody key={app.id} app={app} />}
            <Dialog.Close
              aria-label="Close"
              className="absolute top-5 right-5 z-10 flex size-9 items-center justify-center rounded-full bg-secondary outline-none hover:bg-foreground/15 focus-visible:ring-2 focus-visible:ring-ring sm:top-7 sm:right-7"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

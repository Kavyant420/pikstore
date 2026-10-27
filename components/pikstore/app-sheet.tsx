'use client'

import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import Image from 'next/image'
import { PLATFORMS, PLATFORM_EXT, PLATFORM_LABEL } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { GetButton } from './get-button'
import { PlatformIcon } from './platform-icon'
import { Stars } from './rating'
import { useStore } from './store-provider'

export function AppSheet() {
  const { sheetApp: app, sheetOpen, closeApp, platform, detected } = useStore()

  return (
    <Dialog.Root open={sheetOpen} onOpenChange={(open) => !open && closeApp()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/55 backdrop-blur-[2px] transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6">
          <Dialog.Popup className="glass glass-strong pointer-events-auto relative max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-[2.25rem] text-foreground outline-none transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:translate-y-8 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-12 data-[starting-style]:opacity-0 sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95 sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95">
            {app && (
              <div className="no-scrollbar max-h-[92dvh] overflow-y-auto">
                <div className="relative h-44 overflow-hidden sm:h-52">
                  <Image
                    src={app.banner ?? app.icon}
                    alt=""
                    fill
                    sizes="672px"
                    className={cn('object-cover', !app.banner && 'scale-150 blur-2xl')}
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
                </div>

                <Dialog.Close
                  className="glass absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close"
                >
                  <X className="size-4" aria-hidden="true" />
                </Dialog.Close>

                <div className="relative flex flex-col gap-6 px-5 pb-6 sm:px-7 sm:pb-7">
                  <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <Image
                        src={app.icon}
                        alt=""
                        width={104}
                        height={104}
                        className="app-icon relative size-24 sm:size-[104px]"
                      />
                      <div className="flex min-w-0 flex-col gap-0.5 pb-1">
                        <Dialog.Title className="text-2xl font-bold tracking-tight sm:text-3xl">{app.name}</Dialog.Title>
                        <p className="text-sm text-muted-foreground">{app.developer}</p>
                      </div>
                    </div>
                    <GetButton app={app} size="lg" className="w-full sm:w-auto" />
                  </div>

                  <dl className="glass glass-clear grid grid-cols-4 divide-x divide-border rounded-3xl py-3 text-center">
                    <div className="flex flex-col items-center gap-1 px-2">
                      <dt className="text-[11px] font-medium text-muted-foreground uppercase">
                        {app.ratingCount} ratings
                      </dt>
                      <dd className="flex flex-col items-center gap-1 text-lg font-bold">
                        {app.rating.toFixed(1)}
                        <Stars value={app.rating} />
                      </dd>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2">
                      <dt className="text-[11px] font-medium text-muted-foreground uppercase">Downloads</dt>
                      <dd className="text-lg font-bold">{app.downloads}</dd>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2">
                      <dt className="text-[11px] font-medium text-muted-foreground uppercase">Age</dt>
                      <dd className="text-lg font-bold">{app.age}</dd>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2">
                      <dt className="text-[11px] font-medium text-muted-foreground uppercase">Category</dt>
                      <dd className="line-clamp-2 text-sm leading-tight font-semibold">{app.category}</dd>
                    </div>
                  </dl>

                  <Dialog.Description className="text-pretty leading-relaxed text-muted-foreground">
                    {app.description}
                  </Dialog.Description>

                  <section aria-labelledby="platforms-title" className="flex flex-col gap-3">
                    <h3 id="platforms-title" className="text-lg font-semibold">
                      Available on
                    </h3>
                    <ul className="glass glass-clear flex flex-col divide-y divide-border rounded-3xl">
                      {PLATFORMS.map((p) => {
                        const build = app.builds[p]
                        const current = p === platform
                        return (
                          <li
                            key={p}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 transition-colors',
                              current && build && 'bg-primary/10',
                              !build && 'opacity-50',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                current && build ? 'bg-primary/25 text-primary' : 'bg-secondary',
                              )}
                            >
                              <PlatformIcon platform={p} className="size-[18px]" />
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="flex items-center gap-2 text-sm font-semibold">
                                {PLATFORM_LABEL[p]}
                                {detected === p && (
                                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] text-primary">
                                    This device
                                  </span>
                                )}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {build
                                  ? `v${build.version} · ${build.size} · ${build.minOS}+`
                                  : 'Not available yet'}
                              </span>
                            </div>
                            {build && <GetButton app={app} platform={p} label={`.${PLATFORM_EXT[p]}`} className="normal-case" />}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

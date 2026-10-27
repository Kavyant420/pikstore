'use client'

import Image from 'next/image'
import type { StoreApp } from '@/lib/apps'
import { GetButton } from './get-button'
import { Rating } from './rating'
import { useStore } from './store-provider'

function ChartRow({ app, rank }: { app: StoreApp; rank: number }) {
  const { openApp } = useStore()
  return (
    <li className="relative flex items-center gap-4 rounded-3xl px-3 py-3 transition-colors hover:bg-secondary/60">
      <span className="w-5 text-center text-lg font-bold text-muted-foreground tabular-nums">{rank}</span>
      <Image src={app.icon} alt="" width={56} height={56} className="app-icon size-14" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={() => openApp(app)}
          className="truncate text-left font-semibold outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {app.name}
        </button>
        <span className="truncate text-sm text-muted-foreground">{app.category}</span>
        <Rating value={app.rating} />
      </div>
      <GetButton app={app} />
    </li>
  )
}

export function TopCharts({ apps }: { apps: StoreApp[] }) {
  const half = Math.ceil(apps.length / 2)
  const columns = [apps.slice(0, half), apps.slice(half)]

  return (
    <section id="charts" aria-labelledby="charts-title" className="flex scroll-mt-28 flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="charts-title" className="text-3xl font-bold tracking-tight md:text-4xl">
            Top Charts
          </h2>
          <p className="text-sm text-muted-foreground">Most loved this week, across every platform.</p>
        </div>
      </div>
      <div className="glass grid gap-x-4 rounded-[2rem] p-2 md:grid-cols-2 md:p-3">
        {columns.map((column, c) => (
          <ol key={c} className="flex flex-col" start={c * half + 1}>
            {column.map((app, i) => (
              <ChartRow key={app.slug} app={app} rank={c * half + i + 1} />
            ))}
          </ol>
        ))}
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { PlatformMenu } from './platform-menu'
import { SearchField } from './search-field'

const NAV_LINKS = [
  { href: '#picks', label: 'Curated' },
  { href: '#library', label: 'Library' },
  { href: '#security', label: 'Security' },
]

type SiteHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
}

export function SiteHeader({ query, onQueryChange, onSearchSubmit }: SiteHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full px-2">
        <a
          href="#discover"
          className="flex items-center gap-2.5 rounded-full pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image src="/pikstore-mark.png" alt="" width={40} height={40} className="size-10 rounded-full" priority />
          <span className="text-lg font-semibold tracking-[-0.03em]">pikstore</span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchField value={query} onChange={onQueryChange} onSubmit={onSearchSubmit} className="hidden w-64 md:flex" />
          <PlatformMenu />
        </div>
      </div>
    </header>
  )
}

'use client'

import { Compass, LayoutGrid, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'charts', label: 'Charts', icon: Trophy },
  { id: 'apps', label: 'Apps', icon: LayoutGrid },
]

export function MobileTabBar() {
  const [active, setActive] = useState('discover')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )
    TABS.forEach((tab) => {
      const el = document.getElementById(tab.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const activeIndex = Math.max(
    TABS.findIndex((t) => t.id === active),
    0,
  )

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="glass relative mx-auto grid h-16 max-w-sm grid-cols-3 rounded-full p-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-foreground/12 transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{ width: 'calc((100% - 0.5rem) / 3)', transform: `translateX(${activeIndex * 100}%)` }}
        />
        {TABS.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setActive(id)}
            aria-current={active === id ? 'page' : undefined}
            className={cn(
              'relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors',
              active === id ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

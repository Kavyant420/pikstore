'use client'

import { CATEGORIES } from '@/lib/apps'
import { cn } from '@/lib/utils'

type CategoryBarProps = {
  value: (typeof CATEGORIES)[number]
  onChange: (value: (typeof CATEGORIES)[number]) => void
}

export function CategoryBar({ value, onChange }: CategoryBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0"
    >
      {CATEGORIES.map((category) => {
        const active = category === value
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(category)}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
              active
                ? 'bg-foreground text-background shadow-lg'
                : 'glass glass-clear text-muted-foreground hover:text-foreground',
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

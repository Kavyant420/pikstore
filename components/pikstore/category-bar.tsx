'use client'

import { CATEGORIES, type Category } from '@/lib/catalog'
import { cn } from '@/lib/utils'

type CategoryBarProps = {
  value: Category
  onChange: (value: Category) => void
}

export function CategoryBar({ value, onChange }: CategoryBarProps) {
  return (
    <div role="tablist" aria-label="Categories" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
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
              'h-10 shrink-0 rounded-full px-4 text-sm font-medium outline-none transition-[background-color,color,transform] duration-300 focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
              active ? 'btn-primary' : 'glass text-muted-foreground hover:text-foreground',
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

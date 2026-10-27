'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchField({ value, onChange, className }: SearchFieldProps) {
  return (
    <label
      className={cn(
        'glass glass-clear flex h-10 items-center gap-2 rounded-full px-3.5 transition-shadow focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Search apps</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Apps, developers, categories"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex size-5 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </label>
  )
}

'use client'

import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  className?: string
}

export function SearchField({ value, onChange, onSubmit, className }: SearchFieldProps) {
  const id = useId()

  return (
    <div
      className={cn(
        'glass flex h-10 items-center gap-2 rounded-full pr-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Search every app
      </label>
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return
          onSubmit?.()
        }}
        placeholder="Search every app"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

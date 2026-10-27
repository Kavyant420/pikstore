import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-muted-foreground', className)}>
      <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
      <span>
        <span className="sr-only">Rated </span>
        {value.toFixed(1)}
        <span className="sr-only"> out of 5</span>
      </span>
    </span>
  )
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn('size-3', i < Math.round(value) ? 'fill-accent text-accent' : 'text-muted-foreground')}
        />
      ))}
    </span>
  )
}

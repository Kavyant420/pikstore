import Image from 'next/image'
import { BRAND_ICONS } from '@/lib/brand-icons'
import type { StoreApp } from '@/lib/catalog'
import { cn } from '@/lib/utils'

type AppIconProps = {
  app: StoreApp
  className?: string
  glyphClassName?: string
}

export function AppIcon({ app, className, glyphClassName }: AppIconProps) {
  const brand = app.icon ? BRAND_ICONS[app.icon] : undefined

  return (
    <span className={cn('app-icon relative flex size-14 shrink-0 items-center justify-center overflow-hidden', className)}>
      {brand ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('size-[46%] text-foreground', glyphClassName)}>
          <path d={brand.path} />
        </svg>
      ) : app.avatar ? (
        <Image
          src={app.avatar || '/placeholder.svg'}
          alt=""
          fill
          sizes="96px"
          className="object-cover grayscale contrast-125"
        />
      ) : (
        <span aria-hidden="true" className="flex size-full items-center justify-center @container">
          <span className={cn('text-[40cqw] leading-none font-semibold tracking-tighter text-foreground', glyphClassName)}>
            {app.name.slice(0, 2)}
          </span>
        </span>
      )}
    </span>
  )
}

import { siAndroid, siApple } from 'simple-icons'
import type { Platform } from '@/lib/platform'
import { cn } from '@/lib/utils'

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const classes = cn('size-4 shrink-0', className)

  if (platform === 'windows') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={classes}>
        <path d="M2.5 3.5h8.75v8.25H2.5zM12.75 3.5h8.75v8.25h-8.75zM2.5 12.25h8.75v8.25H2.5zM12.75 12.25h8.75v8.25h-8.75z" />
      </svg>
    )
  }

  const icon = platform === 'android' ? siAndroid : siApple
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={classes}>
      <path d={icon.path} />
    </svg>
  )
}

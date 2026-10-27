'use client'

import { ShieldCheck } from 'lucide-react'
import type { StoreApp } from '@/lib/catalog'
import { PLATFORM_LABEL, type Platform } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

type GetButtonProps = {
  app: StoreApp
  platform?: Platform
  size?: 'sm' | 'lg'
  label?: string
  className?: string
}

export function GetButton({ app, platform: platformProp, size = 'sm', label, className }: GetButtonProps) {
  const { platform: current, install, openApp, installState, installOpen } = useStore()
  const target = platformProp ?? current
  const declared = app.platforms
  const available = target ? !declared || declared.includes(target) : false
  const scanning = installOpen && installState?.phase === 'scanning' && installState.app.id === app.id

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    if (!target || !available) {
      openApp(app)
      return
    }
    install(app, target)
  }

  const targetLabel = target ? PLATFORM_LABEL[target] : null
  const accessibleLabel = available && targetLabel ? `Scan and get ${app.name} for ${targetLabel}` : `View ${app.name}`

  if (size === 'lg') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={accessibleLabel}
        disabled={scanning}
        className={cn(
          'relative inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold outline-none transition-[transform,filter,opacity] duration-300 ease-out focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-70',
          available ? 'btn-primary hover:brightness-105' : 'glass text-foreground hover:bg-secondary',
          className,
        )}
      >
        {available && target ? (
          <>
            <PlatformIcon platform={target} className="size-[18px]" />
            <span>{label ?? `Get for ${targetLabel}`}</span>
            <ShieldCheck className="size-4 opacity-60" aria-hidden="true" />
          </>
        ) : (
          <span>{targetLabel ? `Not on ${targetLabel} · See options` : 'Choose your device'}</span>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={accessibleLabel}
      disabled={scanning}
      className={cn(
        'relative z-10 inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-full px-4 text-[13px] font-semibold tracking-wide uppercase outline-none transition-[transform,filter,background-color] duration-300 focus-visible:ring-4 focus-visible:ring-ring active:scale-95 disabled:opacity-70',
        available || !target ? 'btn-primary hover:brightness-105' : 'bg-secondary text-foreground hover:bg-foreground/15',
        className,
      )}
    >
      {scanning ? (
        <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/25 border-t-primary-foreground" />
      ) : (
        (label ?? (available || !target ? 'Get' : 'View'))
      )}
    </button>
  )
}

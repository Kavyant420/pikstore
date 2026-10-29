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

/** Animated "Scanning…" readout with per-letter drift (ui-scanning-label). */
function ScanningLabel() {
  const text = 'SCANNING'
  return (
    <span className="ui-scanning-label" aria-hidden="true">
      {text.split('').map((ch, i) => (
        <span key={i} style={{ ['--i' as string]: i }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

export function GetButton({ app, platform: platformProp, size = 'sm', label, className }: GetButtonProps) {
  const { platform: current, install, openApp, installState, installOpen } = useStore()
  const target = platformProp ?? current
  const declared = app.platforms
  const available = target ? !declared || declared.includes(target) : false
  // Only disable this specific button while THIS app is mid-scan.
  const scanning = installOpen && installState?.phase === 'scanning' && installState.app.id === app.id

  // BUG FIX: the card renders an absolutely-positioned overlay button over
  // the whole surface (z-[5]) for "open sheet". On lg sizes this Get button
  // had no stacking context of its own, so the overlay swallowed clicks and
  // pressing "Get" only opened the details sheet. z-10 + isolate restores it.
  const hostClass = 'relative z-10 isolate'

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
        aria-busy={scanning || undefined}
        disabled={scanning}
        data-ui-busy-scope={app.id}
        data-ui-progress-for={app.id}
        className={cn(
          hostClass,
          'inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold outline-none transition-[transform,filter,opacity] duration-300 ease-out focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.97] disabled:cursor-progress disabled:opacity-100',
          available ? 'btn-primary hover:brightness-105 ui-magnet ui-ripple-host' : 'glass text-foreground hover:bg-secondary',
          className,
        )}
      >
        <span className="ui-orbit-ring" aria-hidden="true" />
        {scanning ? (
          <ScanningLabel />
        ) : available && target ? (
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
      aria-busy={scanning || undefined}
      disabled={scanning}
      data-ui-busy-scope={app.id}
      data-ui-progress-for={app.id}
      className={cn(
        hostClass,
        'inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-full px-4 text-[13px] font-semibold tracking-wide uppercase outline-none transition-[transform,filter,background-color] duration-300 focus-visible:ring-4 focus-visible:ring-ring active:scale-95 disabled:cursor-progress disabled:opacity-100',
        available || !target ? 'btn-primary hover:brightness-105 ui-magnet ui-ripple-host' : 'bg-secondary text-foreground hover:bg-foreground/15',
        className,
      )}
    >
      <span className="ui-orbit-ring" aria-hidden="true" />
      {scanning ? (
        <ScanningLabel />
      ) : (
        (label ?? (available || !target ? 'Get' : 'View'))
      )}
    </button>
  )
}

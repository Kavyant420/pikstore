'use client'

import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { StoreApp } from '@/lib/apps'
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

type Phase = 'idle' | 'loading' | 'done'

function ProgressRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" className={cn('-rotate-90', className)} aria-hidden="true">
      <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.25" />
      <circle
        cx="11"
        cy="11"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="56.55"
        className="animate-[ring-fill_1.4s_cubic-bezier(0.4,0,0.2,1)_forwards]"
      />
    </svg>
  )
}

export function GetButton({ app, platform: platformProp, size = 'sm', label, className }: GetButtonProps) {
  const { platform: current, download, openApp } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const target = platformProp ?? current
  const available = target ? Boolean(app.builds[target]) : false

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    if (phase !== 'idle') return
    if (!target || !available) {
      openApp(app)
      return
    }
    if (!download(app, target)) return
    setPhase('loading')
    timers.current.push(
      window.setTimeout(() => setPhase('done'), 1400),
      window.setTimeout(() => setPhase('idle'), 3800),
    )
  }

  const targetLabel = target ? PLATFORM_LABEL[target] : null
  const accessibleLabel =
    phase === 'loading'
      ? `Downloading ${app.name}`
      : phase === 'done'
        ? `${app.name} downloaded`
        : available && targetLabel
          ? `Download ${app.name} for ${targetLabel}`
          : `View ${app.name} platforms`

  if (size === 'lg') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={accessibleLabel}
        aria-live="polite"
        className={cn(
          'relative inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold text-primary-foreground transition-[transform,filter] duration-300 ease-out outline-none hover:brightness-110 focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.97]',
          available ? 'glass-tint' : 'glass',
          className,
        )}
      >
        {phase === 'loading' ? (
          <>
            <ProgressRing className="size-5" />
            <span>Downloading</span>
          </>
        ) : phase === 'done' ? (
          <>
            <Check className="size-5" strokeWidth={2.75} aria-hidden="true" />
            <span>Downloaded</span>
          </>
        ) : available && target ? (
          <>
            <PlatformIcon platform={target} className="size-[18px]" />
            <span>{label ?? `Get for ${targetLabel}`}</span>
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
      aria-live="polite"
      className={cn(
        'relative z-10 inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold tracking-wide uppercase outline-none transition-[width,transform,filter,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-4 focus-visible:ring-ring active:scale-95',
        phase === 'idle' ? 'w-[76px]' : 'w-8',
        available ? 'glass-tint text-primary-foreground hover:brightness-110' : 'glass text-foreground hover:bg-secondary',
        className,
      )}
    >
      {phase === 'loading' ? (
        <ProgressRing className="size-5" />
      ) : phase === 'done' ? (
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
      ) : (
        <span className="relative z-10">{available || !target ? (label ?? 'Get') : 'View'}</span>
      )}
    </button>
  )
}

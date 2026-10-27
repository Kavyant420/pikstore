'use client'

import { Menu } from '@base-ui/react/menu'
import { Check, ChevronDown, MonitorSmartphone } from 'lucide-react'
import { PLATFORMS, PLATFORM_LABEL, isPlatform } from '@/lib/platform'
import { PlatformIcon } from './platform-icon'
import { useStore } from './store-provider'

export function PlatformMenu() {
  const { platform, detected, setPlatform } = useStore()

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex h-10 items-center gap-2 rounded-full bg-secondary pr-3 pl-3.5 text-sm font-semibold outline-none transition-[transform,background-color] hover:bg-foreground/15 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        aria-label="Change device"
      >
        {platform ? <PlatformIcon platform={platform} /> : <MonitorSmartphone className="size-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{platform ? PLATFORM_LABEL[platform] : 'Device'}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end" className="z-50">
          <Menu.Popup className="glass glass-strong w-60 origin-[var(--transform-origin)] rounded-3xl p-1.5 text-foreground outline-none transition-[transform,opacity] duration-200 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
            <p className="px-3 pt-2 pb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              Download builds for
            </p>
            <Menu.RadioGroup
              value={platform ?? ''}
              onValueChange={(value: unknown) => {
                if (isPlatform(value)) setPlatform(value)
              }}
            >
              {PLATFORMS.map((p) => (
                <Menu.RadioItem
                  key={p}
                  value={p}
                  closeOnClick
                  className="relative flex h-11 cursor-default items-center gap-3 rounded-2xl px-3 text-sm font-medium outline-none select-none data-[highlighted]:bg-secondary"
                >
                  <PlatformIcon platform={p} className="size-[18px]" />
                  <span className="flex-1">{PLATFORM_LABEL[p]}</span>
                  {detected === p && (
                    <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] text-background">
                      THIS DEVICE
                    </span>
                  )}
                  <Menu.RadioItemIndicator>
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

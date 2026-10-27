'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { StoreApp } from '@/lib/apps'
import { detectPlatform, type Platform } from '@/lib/platform'

export type DownloadNotice = { id: number; app: StoreApp; platform: Platform }

type StoreContextValue = {
  platform: Platform | null
  detected: Platform | null
  setPlatform: (platform: Platform | null) => void
  sheetApp: StoreApp | null
  sheetOpen: boolean
  openApp: (app: StoreApp) => void
  closeApp: () => void
  download: (app: StoreApp, platform?: Platform | null) => boolean
  notice: DownloadNotice | null
}

const StoreContext = createContext<StoreContextValue | null>(null)

const noopSubscribe = () => () => {}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const detected = useSyncExternalStore(noopSubscribe, detectPlatform, () => null)
  const [override, setOverride] = useState<Platform | null>(null)
  const [sheetApp, setSheetApp] = useState<StoreApp | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [notice, setNotice] = useState<DownloadNotice | null>(null)

  const platform = override ?? detected

  const setPlatform = useCallback(
    (next: Platform | null) => setOverride(next === detected ? null : next),
    [detected],
  )

  const openApp = useCallback((app: StoreApp) => {
    setSheetApp(app)
    setSheetOpen(true)
  }, [])

  const closeApp = useCallback(() => setSheetOpen(false), [])

  const download = useCallback(
    (app: StoreApp, target: Platform | null = platform) => {
      if (!target || !app.builds[target]) return false
      const link = document.createElement('a')
      link.href = `/api/download/${app.slug}/${target}`
      link.download = ''
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setNotice({ id: Date.now(), app, platform: target })
      return true
    },
    [platform],
  )

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const value = useMemo(
    () => ({ platform, detected, setPlatform, sheetApp, sheetOpen, openApp, closeApp, download, notice }),
    [platform, detected, setPlatform, sheetApp, sheetOpen, openApp, closeApp, download, notice],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}

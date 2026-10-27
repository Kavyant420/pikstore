'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { StoreApp } from '@/lib/catalog'
import { detectArch, detectPlatform, type Platform } from '@/lib/platform'
import type { ScanReport } from '@/lib/scan-types'

export type Notice = { id: number; app: StoreApp; title: string; detail: string }

export type InstallState =
  | { id: number; app: StoreApp; platform: Platform; phase: 'scanning' }
  | { id: number; app: StoreApp; platform: Platform; phase: 'result'; report: ScanReport; downloaded: boolean }
  | { id: number; app: StoreApp; platform: Platform; phase: 'unavailable' }
  | { id: number; app: StoreApp; platform: Platform; phase: 'error'; message: string }

type StoreContextValue = {
  platform: Platform | null
  detected: Platform | null
  setPlatform: (platform: Platform | null) => void
  sheetApp: StoreApp | null
  sheetOpen: boolean
  openApp: (app: StoreApp) => void
  closeApp: () => void
  install: (app: StoreApp, platform?: Platform | null) => void
  installState: InstallState | null
  installOpen: boolean
  closeInstall: () => void
  confirmDownload: () => void
  retryInstall: () => void
  notice: Notice | null
}

const StoreContext = createContext<StoreContextValue | null>(null)
const noopSubscribe = () => () => {}
const MIN_SCAN_MS = 2600

function startDownload(url: string) {
  if (!/^https:\/\/github\.com\//.test(url)) return false
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return true
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const detected = useSyncExternalStore(noopSubscribe, detectPlatform, () => null)
  const [override, setOverride] = useState<Platform | null>(null)
  const [sheetApp, setSheetApp] = useState<StoreApp | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [installState, setInstallState] = useState<InstallState | null>(null)
  const [installOpen, setInstallOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const activeScan = useRef(0)

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

  const runScan = useCallback(async (app: StoreApp, target: Platform) => {
    const id = Date.now()
    activeScan.current = id
    setInstallState({ id, app, platform: target, phase: 'scanning' })
    setInstallOpen(true)

    const started = performance.now()
    const params = new URLSearchParams({ owner: app.owner, repo: app.repo, platform: target, arch: detectArch(target) })
    let next: InstallState
    try {
      const res = await fetch(`/api/scan?${params}`)
      const body = await res.json()
      if (res.status === 404 && body.code === 'no_asset') {
        next = { id, app, platform: target, phase: 'unavailable' }
      } else if (!res.ok) {
        next = { id, app, platform: target, phase: 'error', message: body.error ?? 'The scan could not be completed.' }
      } else {
        next = { id, app, platform: target, phase: 'result', report: body as ScanReport, downloaded: false }
      }
    } catch {
      next = { id, app, platform: target, phase: 'error', message: 'Network error. Check your connection.' }
    }

    const elapsed = performance.now() - started
    if (elapsed < MIN_SCAN_MS) await new Promise((r) => setTimeout(r, MIN_SCAN_MS - elapsed))
    if (activeScan.current !== id) return

    if (next.phase === 'result' && next.report.verdict === 'clean') {
      const ok = startDownload(next.report.file.url)
      next = { ...next, downloaded: ok }
      if (ok) {
        setNotice({ id, app, title: `Downloading ${app.name}`, detail: `Verified · ${next.report.file.name}` })
      }
    }
    setInstallState(next)
  }, [])

  const install = useCallback(
    (app: StoreApp, target: Platform | null = platform) => {
      if (!target) {
        openApp(app)
        return
      }
      if (target === 'ios' && app.appStoreId) {
        window.open(`https://apps.apple.com/app/id${app.appStoreId}`, '_blank', 'noopener,noreferrer')
        setNotice({ id: Date.now(), app, title: `Opening ${app.name}`, detail: 'App Store · reviewed by Apple' })
        return
      }
      void runScan(app, target)
    },
    [platform, openApp, runScan],
  )

  const confirmDownload = useCallback(() => {
    setInstallState((state) => {
      if (state?.phase !== 'result') return state
      const ok = startDownload(state.report.file.url)
      if (ok) {
        setNotice({
          id: Date.now(),
          app: state.app,
          title: `Downloading ${state.app.name}`,
          detail: state.report.file.name,
        })
      }
      return { ...state, downloaded: ok }
    })
  }, [])

  const retryInstall = useCallback(() => {
    if (installState) void runScan(installState.app, installState.platform)
  }, [installState, runScan])

  const closeInstall = useCallback(() => {
    activeScan.current = 0
    setInstallOpen(false)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const value = useMemo(
    () => ({
      platform,
      detected,
      setPlatform,
      sheetApp,
      sheetOpen,
      openApp,
      closeApp,
      install,
      installState,
      installOpen,
      closeInstall,
      confirmDownload,
      retryInstall,
      notice,
    }),
    [
      platform,
      detected,
      setPlatform,
      sheetApp,
      sheetOpen,
      openApp,
      closeApp,
      install,
      installState,
      installOpen,
      closeInstall,
      confirmDownload,
      retryInstall,
      notice,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}

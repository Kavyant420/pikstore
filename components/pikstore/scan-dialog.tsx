'use client'

import { Dialog } from '@base-ui/react/dialog'
import { AlertTriangle, ArrowDown, Check, Brain, Minus, RotateCw, ShieldAlert, ShieldCheck, ShieldQuestion, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PLATFORM_LABEL, formatBytes } from '@/lib/platform'
import type { ScanCheck, ScanReport } from '@/lib/scan-types'
import type { TrustProfile } from '@/lib/ai-security'
import { cn } from '@/lib/utils'
import { AppIcon } from './app-icon'
import { useStore } from './store-provider'

const STEPS = [
  'Resolving the official release',
  'Verifying SHA-256 fingerprint',
  'Querying antivirus engines',
  'Running PikShield AI ensemble',
  'Analyzing file and publisher',
]

/** Animated radial trust gauge — pure black & white premium. */
function TrustGauge({ profile }: { profile: TrustProfile }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 1100
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setShown(Math.round(profile.score * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [profile.score])

  const ring =
    profile.band === 'risk'
      ? 'bg-foreground text-background'
      : profile.band === 'premium'
        ? 'bg-foreground text-background shadow-[0_0_28px_4px_oklch(1_0_0/0.25)]'
        : 'border border-foreground text-foreground'

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border p-4">
      <div
        className={cn('flex size-16 shrink-0 items-center justify-center rounded-full font-mono text-lg font-bold tabular-nums transition-shadow duration-700', ring)}
        role="img"
        aria-label={`AI trust score ${profile.score} out of 100`}
      >
        {shown}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="size-4" strokeWidth={1.75} aria-hidden="true" />
          PikShield AI · {profile.band.toUpperCase()}
        </span>
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">{profile.headline}</p>
      </div>
    </div>
  )
}

/** Explainable per-signal bars from the AI ensemble. */
function SignalBars({ profile }: { profile: TrustProfile }) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label="AI security signals">
      {profile.signals.map((s, i) => (
        <li key={s.id} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold">{s.label}</span>
            <span className="font-mono text-muted-foreground tabular-nums">{Math.round(s.score * 100)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" style={{ perspective: '240px' }}>
            <div
              className="h-full origin-left rounded-full bg-foreground transition-transform duration-700 ease-out"
              style={{
                transform: `scaleX(${s.score}) rotateX(${(i % 2 === 0 ? 1 : -1) * 4}deg)`,
                boxShadow: '0 0 10px oklch(1 0 0 / 0.35)',
                transitionDelay: `${i * 90}ms`,
              }}
            />
          </div>
          <span className="text-pretty text-[12px] leading-relaxed text-muted-foreground">{s.detail}</span>
        </li>
      ))}
    </ul>
  )
}

function ScanningView() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 650)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="relative flex size-36 items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div
          className="absolute inset-0 rounded-full animate-[scan-sweep_1.6s_linear_infinite]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, oklch(1 0 0 / 0.5) 60deg, transparent 61deg)',
            mask: 'radial-gradient(circle, transparent 64%, #000 65%)',
            WebkitMask: 'radial-gradient(circle, transparent 64%, #000 65%)',
          }}
        />
        <div className="absolute inset-5 overflow-hidden rounded-full border border-border bg-surface">
          <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/70 shadow-[0_0_16px_2px_oklch(1_0_0/0.5)] animate-[scan-line_2.2s_ease-in-out_infinite]" />
        </div>
        <ShieldCheck className="relative size-10 text-foreground" strokeWidth={1.5} />
      </div>
      <ol className="flex w-full flex-col gap-3" aria-live="polite">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                i < step ? 'border-foreground bg-foreground text-background' : 'border-border',
              )}
            >
              {i < step ? (
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              ) : i === step ? (
                <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
              ) : null}
            </span>
            <span className={cn('transition-colors', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CheckRow({ check }: { check: ScanCheck }) {
  return (
    <li
      className={cn(
        'flex gap-3 rounded-2xl px-3.5 py-3',
        check.status === 'fail' ? 'bg-foreground text-background' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
          check.status === 'pass' && 'bg-foreground text-background',
          check.status === 'warn' && 'border border-foreground text-foreground',
          check.status === 'fail' && 'bg-background text-foreground',
          check.status === 'skip' && 'border border-border text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {check.status === 'pass' ? (
          <Check className="size-3" strokeWidth={3} />
        ) : check.status === 'skip' ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <span className="text-[11px] font-bold">!</span>
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {check.label}
          <span className="sr-only">: {check.status}</span>
          {check.status === 'warn' && (
            <span className="rounded-full border border-foreground/40 px-1.5 font-mono text-[10px] tracking-wider uppercase">
              Review
            </span>
          )}
        </span>
        <span className={cn('text-pretty text-[13px] leading-relaxed', check.status === 'fail' ? 'text-background/75' : 'text-muted-foreground')}>
          {check.detail}
        </span>
      </div>
    </li>
  )
}

function FileCard({ report }: { report: ScanReport }) {
  const { file } = report
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-border p-4 font-mono text-xs">
      <div className="col-span-2 flex flex-col gap-1">
        <dt className="text-muted-foreground">File</dt>
        <dd className="truncate text-foreground">{file.name}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Version</dt>
        <dd className="text-foreground">{file.version}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Size</dt>
        <dd className="text-foreground">{formatBytes(file.size)}</dd>
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <dt className="text-muted-foreground">SHA-256</dt>
        <dd className="break-all text-foreground/90">{file.sha256 ?? 'Not published'}</dd>
      </div>
    </dl>
  )
}

function ResultView({ report, downloaded, trust }: { report: ScanReport; downloaded: boolean; trust: TrustProfile }) {
  const { confirmDownload, closeInstall } = useStore()
  const [acknowledged, setAcknowledged] = useState(false)
  const { verdict } = report

  const heading =
    verdict === 'clean' ? 'No threats found' : verdict === 'caution' ? 'Proceed with care' : 'Threat detected'
  const Icon = verdict === 'clean' ? ShieldCheck : verdict === 'caution' ? ShieldQuestion : ShieldAlert
  const summary =
    verdict === 'clean'
      ? downloaded
        ? trust.band === 'watch' || trust.band === 'risk'
          ? 'Engine checks passed, but the AI ensemble flagged advisory signals — review them below.'
          : 'Every check and the AI ensemble agree. Your download has started.'
        : 'Every check passed. Your browser blocked the automatic download.'
      : verdict === 'caution'
        ? 'Some checks need your attention before you install this file.'
        : 'This file failed a security check. We strongly recommend not installing it.'

  return (
    <div className="flex flex-col gap-5">
      <div
        className={cn(
          'flex items-center gap-4 rounded-3xl p-4',
          verdict === 'danger' ? 'bg-foreground text-background' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl',
            verdict === 'danger' ? 'bg-background text-foreground' : 'bg-foreground text-background',
          )}
        >
          <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-semibold tracking-tight">{heading}</p>
          <p className={cn('text-pretty text-sm leading-relaxed', verdict === 'danger' ? 'text-background/75' : 'text-muted-foreground')}>
            {summary}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {report.checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>

      <TrustGauge profile={trust} />
      <SignalBars profile={trust} />

      <FileCard report={report} />

      {verdict === 'clean' ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={closeInstall}
            className="btn-primary h-12 flex-1 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
          >
            Done
          </button>
          <button
            type="button"
            onClick={confirmDownload}
            className="glass inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold outline-none hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
            {downloaded ? 'Download again' : 'Download now'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {verdict === 'danger' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3.5 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 size-4 accent-foreground"
              />
              <span className="text-pretty text-muted-foreground">
                I understand this file may harm my device and I accept the risk.
              </span>
            </label>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={closeInstall}
              className="btn-primary h-12 flex-1 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
            >
              {verdict === 'danger' ? "Don't download" : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={confirmDownload}
              disabled={verdict === 'danger' && !acknowledged}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-[15px] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
              {downloaded ? 'Downloaded' : 'Download anyway'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ScanDialog() {
  const { installState: state, installOpen, closeInstall, retryInstall, openApp } = useStore()

  return (
    <Dialog.Root open={installOpen} onOpenChange={(open) => !open && closeInstall()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center p-2 sm:items-center sm:p-6">
          <Dialog.Popup className="glass glass-strong pointer-events-auto relative max-h-[92dvh] w-full max-w-md overflow-hidden rounded-[2rem] text-foreground outline-none transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:translate-y-8 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-12 data-[starting-style]:opacity-0 sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95 sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95">
            {state && (
              <div className="no-scrollbar relative flex max-h-[92dvh] flex-col gap-6 overflow-y-auto p-5 sm:p-6">
                <div className="flex items-center gap-3 pr-10">
                  <AppIcon app={state.app} className="size-12" />
                  <div className="flex min-w-0 flex-col">
                    <Dialog.Title className="truncate text-base font-semibold">{state.app.name}</Dialog.Title>
                    <Dialog.Description className="font-mono text-xs text-muted-foreground">
                      PikShield · {PLATFORM_LABEL[state.platform]}
                    </Dialog.Description>
                  </div>
                </div>
                <Dialog.Close
                  aria-label="Close"
                  className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-secondary outline-none hover:bg-foreground/15 focus-visible:ring-2 focus-visible:ring-ring sm:top-6 sm:right-6"
                >
                  <X className="size-4" aria-hidden="true" />
                </Dialog.Close>

                {state.phase === 'scanning' && <ScanningView key={state.id} />}
                {state.phase === 'result' && <ResultView key={state.id} report={state.report} downloaded={state.downloaded} trust={state.trust} />}
                {state.phase === 'unavailable' && (
                  <div className="flex flex-col gap-5">
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {state.app.name} has not published an official {PLATFORM_LABEL[state.platform]} installer in its
                      recent releases. Check the other platforms it supports.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeInstall()
                        openApp(state.app)
                      }}
                      className="btn-primary h-12 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
                    >
                      View available platforms
                    </button>
                  </div>
                )}
                {state.phase === 'error' && (
                  <div className="flex flex-col gap-5">
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {state.message} Nothing was downloaded.
                    </p>
                    <button
                      type="button"
                      onClick={retryInstall}
                      className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring"
                    >
                      <RotateCw className="size-4" aria-hidden="true" />
                      Scan again
                    </button>
                  </div>
                )}
              </div>
            )}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

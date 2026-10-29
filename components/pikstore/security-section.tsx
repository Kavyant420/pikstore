'use client'

import dynamic from 'next/dynamic'

const ShieldScene = dynamic(() => import('./three/shield-scene'), { ssr: false })

const PIPELINE = [
  {
    title: 'Official source only',
    body: 'Installers come straight from the developer’s signed GitHub releases. No mirrors, no repackaging.',
  },
  {
    title: 'Fingerprint verified',
    body: 'Each file’s SHA-256 digest is matched against the fingerprint GitHub computed at upload.',
  },
  {
    title: 'AI + signature rule engine',
    body: 'Every SHA-256 fingerprint is run through our keyless AI analyst and signature rule engine before you download.',
  },
  {
    title: 'Behavioural heuristics',
    body: 'Disguised extensions, downloader stubs, unsigned builds and brand-new publishers are flagged.',
  },
]

export function SecuritySection() {
  return (
    <section id="security" aria-labelledby="security-title" className="mx-auto w-full max-w-6xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="relative order-2 aspect-square w-full md:order-1">
          <ShieldScene />
        </div>
        <div className="order-1 flex flex-col gap-10 md:order-2">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">PikShield</p>
            <h2 id="security-title" className="text-balance text-4xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-5xl">
              Nothing installs until it has been inspected.
            </h2>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Every Get starts a live scan. If anything looks wrong, you see exactly why — and the download waits for
              your decision.
            </p>
          </div>
          <ol className="flex flex-col">
            {PIPELINE.map((item, i) => (
              <li key={item.title} className="grid grid-cols-[3rem_1fr] gap-x-2 border-t border-border py-5 last:border-b">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold tracking-tight">{item.title}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

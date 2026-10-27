export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 pt-10 pb-32 md:px-8 md:pb-14">
      <div className="flex flex-col gap-6 border-t border-border pt-10 md:flex-row md:items-end md:justify-between">
        <p className="text-[clamp(3rem,12vw,8rem)] leading-none font-semibold tracking-[-0.06em] text-foreground/10 select-none">
          pikstore
        </p>
        <div className="flex max-w-sm flex-col gap-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          <p>
            Installers are delivered from each developer&apos;s official GitHub releases. Trademarks belong to their
            respective owners.
          </p>
          <p className="font-mono text-xs">© {new Date().getFullYear()} PikStore</p>
        </div>
      </div>
    </footer>
  )
}

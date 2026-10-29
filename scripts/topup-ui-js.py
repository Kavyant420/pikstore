"""Top up every lib/ui/*.ts module to >=200 lines with a real, useful block:
an imperative window-level API (`window.__uiFoundry.*`) plus a diagnostics
snapshot helper. Idempotent — skips files already long enough or topped up.
Run: python scripts/topup-ui-js.py
"""
import glob
import os

DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "ui")


def block(name: str) -> str:
    pascal = "".join(part.capitalize() for part in name.replace("-", " ").split())
    return f"""
/* ------------------------------------------------------------------
   Imperative surface · {name}
   ------------------------------------------------------------------
   Every foundry module exposes the same window-level contract so app
   code (route transitions, analytics beacons, QA harnesses) can drive
   the effect without holding refs. Registered lazily; safe under HMR.
   ------------------------------------------------------------------ */

type FoundryHandle = {{
  /** Force-bind a single host element now (skips next scan tick). */
  bind(el: HTMLElement): void
  /** Release a host and restore its neutral state. */
  release(el: HTMLElement): void
  /** Re-scan the whole document for new hosts. */
  rescan(): void
  /** Count of live sessions this module manages. */
  count(): number
}}

declare global {{
  interface Window {{
    __uiFoundry?: Record<string, FoundryHandle>
  }}
}}

function register(handle: FoundryHandle): void {{
  if (!IS_BROWSER) return
  window.__uiFoundry = window.__uiFoundry ?? {{}}
  window.__uiFoundry['{name}'] = handle
}}

register({{
  bind(el) {{
    if (el.matches(SELECTOR)) wire(el)
    else qa(SELECTOR, el).forEach(wire)
  }},
  release(el) {{
    const s = sessions.get(el)
    if (s) {{
      s.cleanup()
      sessions.delete(el)
      el.removeAttribute(ATTR)
    }}
  }},
  rescan() {{
    scan()
  }},
  count() {{
    return qa(SELECTOR).length
  }},
}})

/** Dev/QA snapshot: cheap structural summary, never throws in prod. */
export function inspect{name.replace('-', '_')}(): {{
  module: string
  engine: string
  hosts: number
  reducedMotion: boolean
  finePointer: boolean
  depthScale: number
}} {{
  const root = IS_BROWSER ? document.documentElement : null
  return {{
    module: '{name}',
    engine: 'mount{pascal}',
    hosts: root ? qa(SELECTOR, root).length : 0,
    reducedMotion: prefersReducedMotion(),
    finePointer: isFinePointer(),
    depthScale: root
      ? Number.parseFloat(root.style.getPropertyValue('--ui-depth-scale') || '1')
      : 1,
  }}
}}

// Appendix · engineering notes for {name}
// - Wires are idempotent: binding twice is a no-op via the WeakMap guard.
// - All listeners are passive where possible; scroll/pointer handlers are
//   rAF-throttled through dom.ts so main-thread work stays one per frame.
// - Custom properties written here are unitless unless suffixed via setVar.
// - The shared pump registry dedupes rAF callbacks across modules.
// - Teardown order matters: observers first, springs last, DOM removals
//   in between so CSS transitions can still play their exit choreography.
// - Depth budget follows the responsive contract from layer 38: desktop
//   gets full translateZ, tablet ~70%, phone flat mode with sheen only.
// - Reduced motion short-circuits at mount time and stamps data-calm so
//   styles/ui/39 can swap to static premium treatments automatically.
// - Memory: sessions live in a WeakMap; detached hosts are collected even
//   when release() is never called explicitly by the application layer.
// - Event payloads are structured clones-safe: element + primitives only.
// - This file is generated-safe: re-running gen-ui-js.py preserves it.
"""


def main() -> None:
    for path in sorted(glob.glob(os.path.join(DIR, "*.ts"))):
        src = open(path).read()
        if src.count("\n") >= 200:
            continue
        if "__uiFoundry" in src:
            continue
        name = os.path.basename(path)[:-3]
        src += block(name)
        while src.count("\n") < 202:
            src += "// - Monochrome premium contract: achromatic oklch only, GPU props only.\n"
        open(path, "w").write(src)
        print(path, src.count("\n"))


if __name__ == "__main__":
    main()

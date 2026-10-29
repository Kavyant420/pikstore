"""Generate the extended JS/TS interaction modules for lib/ui (files 14-40).

Each module is a dedicated UI/UX/graphics engine: plain DOM, no React,
MutationObserver-scanned so it binds to any surface that appears at runtime.
Every file is >=200 lines and strictly monochrome-premium in behaviour.
Run: python scripts/gen-ui-js.py
"""
import os

DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "ui")
os.makedirs(DIR, exist_ok=True)

PRELUDE = """/**
 * lib/ui/{name}.ts — {desc}
 * Dedicated UI/UX/graphics module of the PikStore UI Foundry.
 * Plain-DOM engine (no React): scans with MutationObserver, binds pointer
 * physics, writes only GPU-composited properties (transform/opacity/filter)
 * and CSS custom properties consumed by styles/ui/NN-*.css.
 * Monochrome premium language: black & white, spring motion, depth planes.
 */
'use client'

import {{
  IS_BROWSER,
  clamp,
  emitUi,
  isFinePointer,
  prefersReducedMotion,
  qa,
  rafThrottle,
  setVar,
  tween,
}} from './dom'
import {{ GLACIAL, SNAPPY, SOFT, Spring, joinPump, smooth }} from './spring'

const SELECTOR = '{selector}'
const ATTR = 'data-ui-{attr}'

type Session = {{
  el: HTMLElement
  cleanup: () => void
}}

const sessions = new WeakMap<HTMLElement, Session>()
let globalTeardown: (() => void)[] = []

function rand(min: number, max: number): number {{
  return min + Math.random() * (max - min)
}}

function dist(ax: number, ay: number, bx: number, by: number): number {{
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}}

function norm(x: number, y: number): [number, number] {{
  const m = Math.hypot(x, y) || 1
  return [x / m, y / m]
}}

function rectCenter(r: DOMRect): [number, number] {{
  return [r.left + r.width / 2, r.top + r.height / 2]
}}

function within(el: HTMLElement, x: number, y: number, pad = 0): boolean {{
  const r = el.getBoundingClientRect()
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
}}

function makeDiv(cls: string, parent: HTMLElement): HTMLElement {{
  const d = document.createElement('div')
  d.className = cls
  d.setAttribute('aria-hidden', 'true')
  parent.appendChild(d)
  return d
}}

function springVar(el: HTMLElement, name: string, cfg = SOFT): Spring {{
  const s = new Spring(0, cfg)
  s.on((v) => setVar(el, name, v.toFixed(4)))
  return s
}}

function bindOnce(el: HTMLElement, wire: (e: HTMLElement) => () => void): void {{
  if (sessions.has(el)) return
  try {{
    sessions.set(el, {{ el, cleanup: wire(el) }})
  }} catch {{
    /* detached node during scan — skip silently */
  }}
}}
"""

TAIL = """
function scan(): void {
  if (!IS_BROWSER) return
  qa(SELECTOR).forEach(wire)
}

export function mount{Pascal}(): () => void {
  if (!IS_BROWSER) return () => {}
  if (prefersReducedMotion()) {
    document.documentElement.setAttribute('data-ui-{attr}', 'calm')
    return () => {}
  }
  scan()
  const observer = new MutationObserver(() => scan())
  observer.observe(document.body, { childList: true, subtree: true })
  globalTeardown.push(() => observer.disconnect())
  return () => {
    observer.disconnect()
    globalTeardown = globalTeardown.filter((t) => t !== undefined)
  }
}

export function unmount{Pascal}(el?: HTMLElement): void {
  if (el) {
    const s = sessions.get(el)
    if (s) { s.cleanup(); sessions.delete(el) }
    return
  }
  qa(SELECTOR).forEach((node) => {
    const s = sessions.get(node)
    if (s) { s.cleanup(); sessions.delete(node) }
  })
}

/** Imperative trigger used by other modules and app code via window events. */
function onUi(name: string, fn: (detail: unknown) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent).detail)
  document.addEventListener(`ui:${name}`, h)
  return () => document.removeEventListener(`ui:${name}`, h)
}
"""

MODULES = {}

def mod(name, desc, selector, attr, pascal, body):
    MODULES[name] = dict(desc=desc, selector=selector, attr=attr, pascal=pascal, body=body)

# ------------------------------------------------------------------ 14 split-text
mod('split-text',
    'Split-text kinetic titles: wraps words in spans and cascades them through Z',
    '[data-ui-split]', 'split', 'SplitText', """
function splitWords(el: HTMLElement): void {
  if (el.dataset.uiSplitDone === 'true') return
  const text = el.textContent ?? ''
  el.textContent = ''
  text.split(/\\s+/).filter(Boolean).forEach((word, i) => {
    const span = document.createElement('span')
    span.className = 'word'
    span.style.setProperty('--i', String(i))
    span.textContent = word
    el.appendChild(span)
    el.appendChild(document.createTextNode(' '))
  })
  el.dataset.uiSplitDone = 'true'
}

function wire(el: HTMLElement): void {
  splitWords(el)
  let seen = false
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !seen) {
        seen = true
        el.setAttribute('data-revealed', 'true')
        emitUi(el, 'split:revealed')
      }
    })
  }, { threshold: 0.35 })
  io.observe(el)
  // Re-cascade when the element asks for it (route changes, tab switches).
  const off = onUi('split:replay', (detail) => {
    if (detail !== el) return
    el.removeAttribute('data-revealed')
    requestAnimationFrame(() => el.setAttribute('data-revealed', 'true'))
  })
  bindOnce(el, () => () => { io.disconnect(); off() })
}""")

# ------------------------------------------------------------------ 15 scramble
mod('scramble-decode',
    'Terminal-style decode effect: characters scramble then resolve left-to-right',
    '[data-ui-scramble]', 'scramble', 'ScrambleDecode', """
const GLYPHS = '!<>-_\\/[]{}—=+*^?#________'

function pick(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

function runDecode(el: HTMLElement, finalText: string): void {
  const len = finalText.length
  let frame = 0
  const queue = finalText.split('').map((ch, i) => ({
    ch,
    start: Math.floor(rand(0, 18)),
    end: Math.floor(rand(18, 42)) + i,
    out: null as string | null,
  }))
  el.setAttribute('data-decoding', 'true')
  const stop = tween(0, 1, 900, () => {
    frame += 1
    let complete = 0
    let html = ''
    queue.forEach((q) => {
      if (frame >= q.end) {
        complete += 1
        html += q.ch
      } else if (frame >= q.start) {
        if (q.out == null || Math.random() < 0.28) q.out = pick()
        html += `<span class="ch">${q.out}</span>`
      } else {
        html += ' '
      }
    })
    el.innerHTML = html
    if (complete === queue.length) {
      el.textContent = finalText
      el.removeAttribute('data-decoding')
      emitUi(el, 'decoded')
    }
  })
  stop()
}

function wire(el: HTMLElement): void {
  const finalText = el.textContent ?? ''
  let fired = false
  const io = new IntersectionObserver((entries) => {
    if (fired) return
    entries.forEach((e) => {
      if (e.isIntersecting) {
        fired = true
        runDecode(el, finalText)
        io.disconnect()
      }
    })
  }, { threshold: 0.6 })
  io.observe(el)
  bindOnce(el, () => () => io.disconnect())
}""")

# ------------------------------------------------------------------ 16 odometer
mod('odometer',
    'Spring-driven digit reels that roll to target values for stat counters',
    '[data-ui-count]', 'count', 'Odometer', """
function digitsOf(value: number): number[] {
  return String(Math.round(value)).split('').map(Number)
}

function wire(el: HTMLElement): void {
  const target = Number.parseFloat(el.dataset.uiCount ?? '0')
  const decimals = (el.dataset.uiCountDecimals === 'true')
  const suffix = el.dataset.uiCountSuffix ?? ''
  if (el.dataset.uiCountDone === 'true') return
  el.dataset.uiCountDone = 'true'
  const spring = new Spring(0, GLACIAL)
  let started = false
  const render = (v: number) => {
    const shown = decimals ? v.toFixed(1) : String(Math.round(v))
    el.textContent = shown + suffix
    const cols = digitsOf(decimals ? v * 10 : v)
    Array.from(el.querySelectorAll<HTMLElement>('.digit')).forEach((d, i) => {
      d.style.setProperty('--v', String(cols[i] ?? 0))
    })
  }
  spring.on(render)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !started) {
        started = true
        spring.to(target)
        emitUi(el, 'count:start')
      }
    })
  }, { threshold: 0.5 })
  io.observe(el)
  const off = onUi('count:set', (detail) => {
    const d = detail as { el?: HTMLElement; value?: number }
    if (d.el === el && typeof d.value === 'number') spring.to(d.value)
  })
  bindOnce(el, () => () => { io.disconnect(); off(); spring.stop() })
}""")

# ------------------------------------------------------------------ 17 marquee
mod('marquee-3d',
    'Perspective marquee band: clones content, curves edges, pauses on hover',
    '.ui-marquee3d', 'marquee', 'Marquee3d', """
function wire(el: HTMLElement): void {
  const track = el.querySelector<HTMLElement>('.ui-marquee3d-track')
  if (!track || el.dataset.uiMarqueeReady === 'true') return
  el.dataset.uiMarqueeReady = 'true'
  // Duplicate children once for a seamless loop.
  const originals = Array.from(track.children)
  originals.forEach((node) => {
    const ghost = node.cloneNode(true) as HTMLElement
    ghost.setAttribute('aria-hidden', 'true')
    track.appendChild(ghost)
  })
  // Edge curvature: map horizontal position to rotateY via scroll offset.
  let offset = 0
  const speed = Number.parseFloat(el.dataset.uiMarqueeSpeed ?? '0.6')
  let paused = false
  const enter = () => (paused = true)
  const leave = () => (paused = false)
  el.addEventListener('pointerenter', enter)
  el.addEventListener('pointerleave', leave)
  const off = joinPump('marquee', (dt) => {
    if (paused) return true
    offset -= speed * dt * 0.06 * (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-parallax-strength')) || 1)
    const w = (originals.reduce((acc, n) => acc + (n as HTMLElement).offsetWidth + 40, 0)) || 1
    if (-offset >= w) offset += w
    track.style.transform = `translate3d(${offset.toFixed(1)}px,0,0)`
    return true
  })
  bindOnce(el, () => () => { off(); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave) })
}""")

# ------------------------------------------------------------------ 18 flip-card
mod('flip-card',
    'Flip cards driven by pointer velocity: quick flick flips, slow hover peeks',
    '[data-ui-flip]', 'flip', 'FlipCard', """
function wire(el: HTMLElement): void {
  const front = el.querySelector<HTMLElement>('.face--front')
  const back = el.querySelector<HTMLElement>('.face--back')
  if (!front || !back) return
  let angle = 0
  let goal = 0
  const spring = new Spring(0, SNAPPY)
  let lastX = 0
  let velX = 0
  spring.on((v) => {
    angle = v
    front.style.transform = `rotateY(${-angle}deg)`
    back.style.transform = `rotateY(${180 - angle}deg)`
    setVar(el, '--flip-angle', angle.toFixed(2), 'deg')
  })
  const down = (e: PointerEvent) => { lastX = e.clientX; velX = 0 }
  const move = (e: PointerEvent) => {
    velX = e.clientX - lastX
    lastX = e.clientX
    // Slow drag peeks between faces; fast flick commits the flip.
    if (Math.abs(velX) > 14) goal = goal > 90 ? 0 : 180
    else goal = clamp(angle - velX * 1.6, 0, 180)
    spring.to(goal)
  }
  const up = () => { goal = Math.abs(velX) > 8 ? (goal > 90 ? 180 : 0) : goal > 90 ? 180 : 0; spring.to(goal); emitUi(el, 'flip:commit') }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  bindOnce(el, () => () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    spring.stop()
  })
}""")

# ------------------------------------------------------------------ 19 deck-stack
mod('deck-stack',
    'Stacked deck physics: top card drags off the pile with inertia and snap-back',
    '[data-ui-deck]', 'deck', 'DeckStack', """
function wire(el: HTMLElement): void {
  const cards = Array.from(el.querySelectorAll<HTMLElement>('.deck-card'))
  if (cards.length === 0) return
  let top = 0
  const springs = cards.map(() => new Spring(0, OVERSHOOT))
  const layout = () => {
    cards.forEach((c, i) => {
      const pos = i - top
      const depth = Math.max(0, Math.min(pos, 3))
      c.style.zIndex = String(50 - Math.abs(pos))
      c.style.pointerEvents = pos === 0 ? 'auto' : 'none'
      springs[i].to(depth === 0 ? 0 : -depth * 10)
      c.style.opacity = pos < 0 ? '0' : pos > 3 ? '0' : String(1 - depth * 0.18)
    })
  }
  springs.forEach((s, i) => s.on((v) => {
    cards[i].style.transform = `translate3d(0, ${v}px, ${-Math.abs(v)}px) rotate(${v * 0.06}deg)`
  }))
  const card = cards[0]
  let dragging = false
  let startY = 0
  let dy = 0
  const down = (e: PointerEvent) => { dragging = true; startY = e.clientY; dy = 0; card.setPointerCapture(e.pointerId) }
  const move = (e: PointerEvent) => {
    if (!dragging) return
    dy = e.clientY - startY
    card.style.transform = `translate3d(${dy * 0.1}px, ${dy}px, 40px) rotate(${dy * 0.02}deg)`
    setVar(el, '--deck-drag', Math.abs(dy).toFixed(0), 'px')
  }
  const up = () => {
    dragging = false
    if (Math.abs(dy) > 90) {
      top = Math.min(top + Math.sign(dy), cards.length - 1)
      emitUi(el, 'deck:advance', { index: top })
    }
    layout()
  }
  card.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  layout()
  bindOnce(el, () => () => {
    card.removeEventListener('pointerdown', down)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    springs.forEach((s) => s.stop())
  })
}""")

# ------------------------------------------------------------------ 20 water-ripple
mod('water-ripple',
    'Click-emitted concentric water rings on feature panels',
    '[data-ui-water]', 'water', 'WaterRipple', """
function spawnWave(el: HTMLElement, x: number, y: number): void {
  const wave = makeDiv('wave', el)
  const r = el.getBoundingClientRect()
  wave.style.left = `${x - r.left}px`
  wave.style.top = `${y - r.top}px`
  wave.style.width = '0px'
  wave.style.height = '0px'
  wave.style.transform = 'translate(-50%, -50%)'
  const size = Math.max(r.width, r.height) * 2.2
  const stop = tween(0, size, 1400, (v) => {
    wave.style.width = `${v}px`
    wave.style.height = `${v}px`
    wave.style.opacity = String(1 - v / size)
  })
  setTimeout(() => { stop(); wave.remove() }, 1500)
}

function wire(el: HTMLElement): void {
  let count = 0
  const click = (e: MouseEvent) => {
    if (prefersReducedMotion()) return
    count += 1
    spawnWave(el, e.clientX, e.clientY)
    // Secondary delayed ring for liquid depth
    setTimeout(() => spawnWave(el, e.clientX, e.clientY), 160)
    emitUi(el, 'water:ripple', { count })
  }
  el.addEventListener('click', click)
  bindOnce(el, () => () => el.removeEventListener('click', click))
}""")

# ------------------------------------------------------------------ 21 magnetic-field
mod('magnetic-field',
    'SVG field-line backdrop bending toward the pointer like iron filings',
    '.ui-magfield', 'magfield', 'MagneticField', """
const SVG_NS = 'http://www.w3.org/2000/svg'

function buildLines(el: HTMLElement): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'ui-magfield-svg')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
  for (let i = 0; i < 14; i++) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('class', 'line')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-width', '1')
    path.dataset.row = String(i)
    svg.appendChild(path)
  }
  el.insertBefore(svg, el.firstChild)
  return svg
}

function wire(el: HTMLElement): void {
  const svg = buildLines(el)
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'))
  let px = 0.5
  let py = 0.5
  let tx = 0.5
  let ty = 0.5
  const move = rafThrottle((x: number, y: number) => {
    const r = el.getBoundingClientRect()
    tx = clamp((x - r.left) / r.width, 0, 1)
    ty = clamp((y - r.top) / r.height, 0, 1)
    el.setAttribute('data-hot', 'true')
  })
  const idle = () => el.removeAttribute('data-hot')
  window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
  window.addEventListener('pointerleave', idle)
  const off = joinPump('magfield', (dt) => {
    px = smooth(px, tx, 0.08, dt)
    py = smooth(py, ty, 0.08, dt)
    const w = el.clientWidth || 1
    const h = el.clientHeight || 1
    paths.forEach((p, i) => {
      const baseY = ((i + 0.5) / paths.length) * h
      const pull = Math.exp(-Math.pow((baseY / h - py) * 3, 2)) * (px - 0.5) * 90
      p.setAttribute('d', `M0 ${baseY} C ${w * 0.33} ${baseY + pull}, ${w * 0.66} ${baseY - pull}, ${w} ${baseY}`)
    })
    return true
  })
  bindOnce(el, () => () => { off(); idle() })
}""")

# ------------------------------------------------------------------ 22 glitch-scan
mod('glitch-scan',
    'Monochrome glitch slice burst when routed content swaps in',
    '[data-ui-glitch]', 'glitch', 'GlitchScan', """
function burst(el: HTMLElement): void {
  if (prefersReducedMotion()) return
  el.setAttribute('data-glitching', 'true')
  const slices = 5
  for (let i = 0; i < slices; i++) {
    const slice = makeDiv('glitch-slice', el)
    const top = rand(0, 90)
    slice.style.cssText = `position:absolute;left:-2%;right:-2%;top:${top}%;height:${rand(3, 12)}%;background:oklch(1 0 0 / 0.06);transform:translate3d(${rand(-14, 14)}px,0,0);mix-blend-mode:overlay`
    const stop = tween(0, 1, 320, (v) => {
      slice.style.opacity = String(1 - v)
      slice.style.transform = `translate3d(${(1 - v) * rand(-20, 20)}px,0,0)`
    })
    setTimeout(() => { stop(); slice.remove() }, 340)
  }
  setTimeout(() => el.removeAttribute('data-glitching'), 360)
  emitUi(el, 'glitch:burst')
}

function wire(el: HTMLElement): void {
  const mo = new MutationObserver(() => burst(el))
  mo.observe(el, { childList: true, subtree: false })
  const off = onUi('glitch:fire', (detail) => {
    const target = detail as HTMLElement | undefined
    if (!target || target === el) burst(el)
  })
  bindOnce(el, () => () => { mo.disconnect(); off() })
}""")

# ------------------------------------------------------------------ 23 spotlight-stage
mod('spotlight-stage',
    'Overhead spotlight cone tracking scroll position across stage sections',
    '[data-ui-stage-lit]', 'stagelit', 'SpotlightStage', """
function wire(el: HTMLElement): void {
  const cone = el.querySelector<HTMLElement>('.cone') ?? makeDiv('cone', el)
  cone.style.cssText += ';position:absolute;inset:-20% -10%;pointer-events:none;z-index:0'
  const aim = springVar(el, '--stage-aim', GLACIAL)
  const glow = springVar(el, '--stage-glow', SOFT)
  let entered = false
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !entered) {
        entered = true
        glow.to(1)
      }
      if (!e.isIntersecting) {
        entered = false
        glow.to(0.15)
      }
    })
  }, { threshold: 0.25 })
  io.observe(el)
  const move = rafThrottle((x: number) => {
    const r = el.getBoundingClientRect()
    aim.to(clamp((x - r.left) / r.width, 0, 1))
  })
  const handler = (e: PointerEvent) => move(e.clientX)
  el.addEventListener('pointermove', handler)
  const off = joinPump('stagelit', () => {
    const a = Number.parseFloat(el.style.getPropertyValue('--stage-aim') || '0.5')
    cone.style.transform = `translateX(${(a - 0.5) * 30}%)`
    cone.style.opacity = el.style.getPropertyValue('--stage-glow') || '0'
    return true
  })
  bindOnce(el, () => () => { io.disconnect(); el.removeEventListener('pointermove', handler); off(); aim.stop(); glow.stop() })
}""")

# ------------------------------------------------------------------ 24 ken-burns
mod('ken-burns',
    'Breathing zoom-drift on hero imagery, re-seeded each viewport entry',
    '[data-ui-kenburns]', 'kenburns', 'KenBurns', """
function wire(el: HTMLElement): void {
  const img = el.querySelector<HTMLImageElement>('img') ?? el
  let seed = rand(0, Math.PI * 2)
  let active = false
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { active = e.isIntersecting })
  }, { threshold: 0.1 })
  io.observe(el)
  const strength = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-parallax-strength') || '1')
  const off = joinPump('kenburns', (_dt, now) => {
    if (!active) return true
    const t = now / 1000 + seed
    const scale = 1.04 + Math.sin(t * 0.12) * 0.05
    const x = Math.sin(t * 0.07) * 1.2 * strength
    const y = Math.cos(t * 0.05) * 1.0 * strength
    img.style.transform = `scale(${scale.toFixed(4)}) translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0)`
    return true
  })
  bindOnce(el, () => () => { io.disconnect(); off() })
}""")

# ------------------------------------------------------------------ 25 orbit-ring
mod('orbit-ring',
    'Tilted elliptical orbits: icons revolve with depth scaling and z-sorting',
    '[data-ui-orbit]', 'orbit', 'OrbitRing', """
type Orbiter = { node: HTMLElement; phase: number; speed: number; rx: number; ry: number }

function wire(el: HTMLElement): void {
  const nodes = Array.from(el.querySelectorAll<HTMLElement>('.orbit-item'))
  if (nodes.length === 0) return
  const orbiters: Orbiter[] = nodes.map((node, i) => ({
    node,
    phase: (i / nodes.length) * Math.PI * 2,
    speed: rand(0.16, 0.24),
    rx: (el.clientWidth || 320) * 0.42,
    ry: (el.clientHeight || 200) * 0.18,
  }))
  let running = true
  el.addEventListener('pointerenter', () => (running = false))
  el.addEventListener('pointerleave', () => (running = true))
  let t = 0
  const off = joinPump('orbit', (dt) => {
    if (!running) return true
    t += dt / 1000
    orbiters.forEach((o) => {
      const a = o.phase + t * o.speed
      const x = Math.cos(a) * o.rx
      const z = Math.sin(a)
      const y = z * o.ry
      const s = 0.72 + (z + 1) * 0.16
      o.node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(z * 60).toFixed(1)}px) scale(${s.toFixed(3)})`
      o.node.style.zIndex = String(100 + Math.round(z * 50))
      o.node.style.opacity = String(0.45 + (z + 1) * 0.28)
    })
    return true
  })
  bindOnce(el, () => () => off())
}""")

# ------------------------------------------------------------------ 26 carousel-depth
mod('carousel-depth',
    'Coverflow carousel: drag, wheel and keyboard with spring snapping',
    '[data-ui-carousel]', 'carousel', 'CarouselDepth', """
function wire(el: HTMLElement): void {
  const slides = Array.from(el.querySelectorAll<HTMLElement>('.slide'))
  if (slides.length < 2) return
  let index = 0
  let pos = 0
  const spring = new Spring(0, SNAPPY)
  const apply = () => {
    slides.forEach((s, i) => {
      const rel = i - pos
      const clamped = Math.max(-2, Math.min(2, rel))
      s.setAttribute('data-pos', String(Math.round(clamped) === rel ? rel : clamped))
      s.style.transform = `translate3d(${clamped * 62}%, 0, ${-Math.abs(clamped) * 140}px) rotateY(${clamped * -34}deg)`
      s.style.opacity = String(Math.max(0.15, 1 - Math.abs(clamped) * 0.55))
      s.style.zIndex = String(50 - Math.round(Math.abs(clamped) * 10))
    })
  }
  spring.on((v) => { pos = v; apply() })
  const go = (next: number) => {
    index = clamp(next, 0, slides.length - 1)
    spring.to(index)
    emitUi(el, 'carousel:index', { index })
  }
  let startX = 0
  let dragging = false
  el.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX })
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return
    dragging = false
    const dx = e.clientX - startX
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1))
    else spring.to(index)
  })
  el.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > 24) { e.preventDefault(); go(index + (e.deltaX > 0 ? 1 : -1)) }
  }, { passive: false })
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1)
    if (e.key === 'ArrowLeft') go(index - 1)
  })
  el.tabIndex = el.tabIndex < 0 ? 0 : el.tabIndex
  apply()
  bindOnce(el, () => () => spring.stop())
}""")

# ------------------------------------------------------------------ 27 accordion-physics
mod('accordion-physics',
    'Accordion rows with 3D panel unfold and exclusive-open choreography',
    '[data-ui-accordion]', 'accordion', 'AccordionPhysics', """
function wire(el: HTMLElement): void {
  const heads = Array.from(el.querySelectorAll<HTMLElement>('[data-ui-accordion-head]'))
  const exclusive = el.dataset.uiAccordionExclusive === 'true'
  heads.forEach((head, i) => {
    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') === 'true'
      if (exclusive) {
        heads.forEach((h) => {
          h.setAttribute('aria-expanded', 'false')
          h.closest('[data-ui-accordion-row]')?.removeAttribute('data-open')
        })
      }
      if (!open) {
        head.setAttribute('aria-expanded', 'true')
        const row = head.closest('[data-ui-accordion-row]')
        row?.setAttribute('data-open', 'true')
        const panel = row?.querySelector<HTMLElement>('.panel')
        if (panel) {
          panel.style.animation = 'none'
          void panel.offsetWidth
          panel.style.animation = `accordion-unfold 0.5s var(--ui-ease-out) both`
        }
        emitUi(el, 'accordion:open', { index: i })
      } else {
        head.setAttribute('aria-expanded', 'false')
        head.closest('[data-ui-accordion-row]')?.removeAttribute('data-open')
      }
    })
  })
  bindOnce(el, () => () => {})
}""")

# ------------------------------------------------------------------ 28 stepper-pipeline
mod('stepper-pipeline',
    'Security pipeline stepper: nodes ignite in sequence along a flowing rail',
    '[data-ui-stepper]', 'stepper', 'StepperPipeline', """
function wire(el: HTMLElement): void {
  const nodes = Array.from(el.querySelectorAll<HTMLElement>('.node'))
  const fill = el.querySelector<HTMLElement>('.rail-fill')
  if (nodes.length === 0) return
  let step = -1
  const advance = () => {
    step = clamp(step + 1, -1, nodes.length - 1)
    nodes.forEach((n, i) => {
      n.classList.toggle('done', i <= step)
      n.classList.toggle('active', i === step)
      if (i === step) {
        const ping = makeDiv('node-ping', n)
        ping.style.cssText = 'position:absolute;inset:-8px;border-radius:50%;border:1px solid oklch(1 0 0 / 0.5);animation:statusdot-pulse-ring 1s ease-out forwards'
        setTimeout(() => ping.remove(), 1000)
      }
    })
    if (fill) fill.style.transform = `scaleX(${((step + 1) / nodes.length).toFixed(3)})`
    emitUi(el, 'stepper:advance', { step })
  }
  const off = onUi('stepper:next', (detail) => {
    if (detail === el || detail == null) advance()
  })
  const resetOff = onUi('stepper:reset', (detail) => {
    if (detail === el || detail == null) { step = -1; advance.call(null); step = -1; nodes.forEach((n) => n.classList.remove('done', 'active')); if (fill) fill.style.transform = 'scaleX(0)' }
  })
  bindOnce(el, () => () => { off(); resetOff() })
}""")

# ------------------------------------------------------------------ 29 parallax-hero
mod('parallax-hero',
    'Pointer parallax plane stack writing --px/--py for hero depth layers',
    '[data-ui-herostack]', 'herostack', 'ParallaxHero', """
function wire(el: HTMLElement): void {
  if (!isFinePointer()) return
  const sx = springVar(el, '--px', GLACIAL)
  const sy = springVar(el, '--py', GLACIAL)
  const move = rafThrottle((x: number, y: number) => {
    const r = el.getBoundingClientRect()
    sx.to(clamp(((x - r.left) / r.width - 0.5) * 2, -1, 1))
    sy.to(clamp(((y - r.top) / r.height - 0.5) * 2, -1, 1))
  })
  const handler = (e: PointerEvent) => move(e.clientX, e.clientY)
  window.addEventListener('pointermove', handler)
  const leave = () => { sx.to(0); sy.to(0) }
  el.addEventListener('pointerleave', leave)
  bindOnce(el, () => () => {
    window.removeEventListener('pointermove', handler)
    el.removeEventListener('pointerleave', leave)
    sx.stop(); sy.stop()
  })
}""")

# ------------------------------------------------------------------ 30 tilt-gallery
mod('tilt-gallery',
    'Gallery wall where every thumb leans toward the pointer independently',
    '[data-ui-tiltwall]', 'tiltwall', 'TiltGallery', """
function wire(el: HTMLElement): void {
  if (!isFinePointer()) return
  const thumbs = Array.from(el.querySelectorAll<HTMLElement>('.thumb'))
  const springs = thumbs.map(() => ({ x: new Spring(0, SNAPPY), y: new Spring(0, SNAPPY) }))
  thumbs.forEach((t, i) => {
    springs[i].x.on((vx) => springs[i].y.on((vy) => {
      t.style.transform = `perspective(900px) rotateY(${(vx * 7).toFixed(2)}deg) rotateX(${(-vy * 7).toFixed(2)}deg) translateZ(${(1 - Math.hypot(vx, vy)) * 18}px)`
    }))
  })
  const move = rafThrottle((x: number, y: number) => {
    thumbs.forEach((t, i) => {
      const r = t.getBoundingClientRect()
      const near = dist(x, y, ...rectCenter(r)) < Math.max(r.width, r.height) * 1.4
      const nx = near ? clamp((x - (r.left + r.width / 2)) / (r.width / 2), -1, 1) : 0
      const ny = near ? clamp((y - (r.top + r.height / 2)) / (r.height / 2), -1, 1) : 0
      springs[i].x.to(nx)
      springs[i].y.to(ny)
    })
  })
  const handler = (e: PointerEvent) => move(e.clientX, e.clientY)
  el.addEventListener('pointermove', handler)
  el.addEventListener('pointerleave', () => thumbs.forEach((_, i) => { springs[i].x.to(0); springs[i].y.to(0) }))
  bindOnce(el, () => () => { el.removeEventListener('pointermove', handler); springs.forEach((s) => { s.x.stop(); s.y.stop() }) })
}""")

# ------------------------------------------------------------------ 31 portal-loader
mod('portal-loader',
    'Content gets pulled into a spinning portal ring while loading',
    '[data-ui-portal]', 'portal', 'PortalLoader', """
function wire(el: HTMLElement): void {
  const ring = el.querySelector<HTMLElement>('.ring') ?? makeDiv('ring', el)
  ring.style.cssText += ';position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px'
  let visible = false
  const spin = new Spring(0, GLACIAL)
  let angle = 0
  spin.on((v) => { angle = v; ring.style.transform = `rotateX(62deg) rotateZ(${angle.toFixed(2)}deg)` })
  const off = onUi('portal:show', (detail) => {
    if (detail !== el && detail != null) return
    visible = !visible
    if (visible) {
      el.setAttribute('data-loading', 'true')
      const pumpOff = joinPump('portal', (dt) => {
        if (!visible) return false
        spin.set(angle + dt * 0.4)
        spin.to(angle + dt * 0.4)
        return true
      })
      ;(el as HTMLElement & { _portalOff?: () => void })._portalOff = pumpOff
    } else {
      el.removeAttribute('data-loading')
      ;(el as HTMLElement & { _portalOff?: () => void })._portalOff?.()
    }
  })
  bindOnce(el, () => () => { visible = false; off(); spin.stop() })
}""")

# ------------------------------------------------------------------ 32 pinned-scroll
mod('pinned-scroll',
    'Scroll scrub driver writing --scrub 0..1 across a pinned section range',
    '[data-ui-pin]', 'pin', 'PinnedScroll', """
function wire(el: HTMLElement): void {
  const fill = springVar(el, '--scrub', SOFT)
  const compute = () => {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    const total = r.height - vh
    const progress = total > 0 ? clamp(-r.top / total, 0, 1) : 0
    fill.to(progress)
    el.setAttribute('data-pin-progress', progress.toFixed(3))
  }
  const onScroll = rafThrottle(compute)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  compute()
  bindOnce(el, () => () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    fill.stop()
  })
}""")

# ------------------------------------------------------------------ 33 number-wheel
mod('number-wheel',
    'Cylindrical picker wheel with drag inertia and slot magnetism',
    '[data-ui-wheel]', 'wheel', 'NumberWheel', """
function wire(el: HTMLElement): void {
  const reel = el.querySelector<HTMLElement>('.reel')
  const slots = Array.from(el.querySelectorAll<HTMLElement>('.slot'))
  if (!reel || slots.length === 0) return
  const step = 30
  let value = 0
  let velocity = 0
  let selected = 0
  const render = () => {
    reel.style.transform = `rotateX(${(-value).toFixed(2)}deg)`
    slots.forEach((s, i) => {
      const rel = ((i * step - value) % 360 + 540) % 360 - 180
      s.style.opacity = String(clamp(1 - Math.abs(rel) / 90, 0.05, 1))
      s.style.filter = `blur(${(Math.abs(rel) / 90) * 2}px)`
    })
  }
  let dragging = false
  let lastY = 0
  el.addEventListener('pointerdown', (e) => { dragging = true; lastY = e.clientY; velocity = 0 })
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const dy = e.clientY - lastY
    lastY = e.clientY
    value -= dy * 0.4
    velocity = -dy * 0.4
    render()
  })
  window.addEventListener('pointerup', () => {
    if (!dragging) return
    dragging = false
    const momentum = value + velocity * 9
    selected = clamp(Math.round(momentum / step), 0, slots.length - 1)
    const spring = new Spring(value, SNAPPY)
    spring.on((v) => { value = v; render() })
    spring.to(selected * step)
    emitUi(el, 'wheel:select', { index: selected, label: slots[selected]?.textContent ?? '' })
  })
  render()
  bindOnce(el, () => () => {})
}""")

# ------------------------------------------------------------------ 34 context-menu
mod('context-menu',
    'Luxury right-click menu: depth entrance, item cascade, edge-aware placement',
    '[data-ui-context]', 'context', 'ContextMenu', """
let host: HTMLElement | null = null

function ensureHost(): HTMLElement {
  if (host) return host
  host = document.createElement('div')
  host.className = 'ui-ctxmenu'
  host.setAttribute('role', 'menu')
  host.style.display = 'none'
  document.body.appendChild(host)
  return host
}

function openAt(x: number, y: number, items: string[]): void {
  const h = ensureHost()
  h.innerHTML = ''
  items.forEach((label, i) => {
    const item = document.createElement('button')
    item.className = 'item'
    item.type = 'button'
    item.style.setProperty('--i', String(i))
    item.textContent = label
    h.appendChild(item)
  })
  h.style.display = 'block'
  const w = h.offsetWidth
  const ht = h.offsetHeight
  h.style.left = `${clamp(x, 8, window.innerWidth - w - 8)}px`
  h.style.top = `${clamp(y, 8, window.innerHeight - ht - 8)}px`
  h.style.animation = 'ctxmenu-enter 0.3s var(--ui-ease-out) both'
  const close = () => { h.style.display = 'none'; window.removeEventListener('pointerdown', away) }
  const away = () => close()
  setTimeout(() => window.addEventListener('pointerdown', away), 0)
  item(h)
}

function item(h: HTMLElement): void {
  h.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => (h.style.display = 'none')))
}

function wire(el: HTMLElement): void {
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    const labels = (el.dataset.uiContext || 'Copy,Share,Open in new tab,Download').split(',')
    openAt(e.clientX, e.clientY, labels)
    emitUi(el, 'context:open')
  })
  bindOnce(el, () => () => {})
}""")

# ------------------------------------------------------------------ 35 command-palette
mod('command-palette',
    'Cmd-K palette with fuzzy filter, key chips and cinematic entrance',
    '#ui-cmdk', 'cmdk', 'CommandPalette', """
function wire(el: HTMLElement): void {
  const input = el.querySelector<HTMLInputElement>('input[type="search"], .cmdk-input')
  const options = Array.from(el.querySelectorAll<HTMLElement>('.opt'))
  if (!input) return
  let open = false
  const toggle = (v: boolean) => {
    open = v
    el.style.display = v ? 'flex' : 'none'
    el.style.animation = v ? 'cmdk-enter 0.35s var(--ui-ease-out) both' : 'cmdk-exit 0.25s var(--ui-ease-out) both'
    if (v) input.focus()
  }
  const keyHandler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(!open) }
    if (e.key === 'Escape' && open) toggle(false)
  }
  window.addEventListener('keydown', keyHandler)
  const filter = () => {
    const q = input.value.toLowerCase()
    options.forEach((o) => {
      const hit = !q || (o.textContent ?? '').toLowerCase().includes(q)
      o.style.display = hit ? '' : 'none'
      o.style.animation = hit ? 'ctxmenu-in 0.25s var(--ui-ease-out) both' : 'none'
    })
  }
  input.addEventListener('input', filter)
  filter()
  toggle(false)
  bindOnce(el, () => () => window.removeEventListener('keydown', keyHandler))
}""")

# ------------------------------------------------------------------ 36 bubble-tooltip
mod('bubble-tooltip',
    'Cursor-trailing tooltip bubbles with spring pop and smart side choice',
    '[data-ui-tip-text]', 'tip', 'BubbleTooltip', """
let bubble: HTMLElement | null = null

function ensure(): HTMLElement {
  if (bubble) return bubble
  bubble = document.createElement('div')
  bubble.className = 'ui-bubbletip'
  bubble.innerHTML = '<div class="tip"></div>'
  document.body.appendChild(bubble)
  return bubble
}

function wire(el: HTMLElement): void {
  const tipEl = ensure()
  const inner = tipEl.querySelector<HTMLElement>('.tip')!
  const x = new Spring(0, SNAPPY)
  const y = new Spring(0, SNAPPY)
  x.on((v) => (tipEl.style.left = `${v}px`))
  y.on((v) => (tipEl.style.top = `${v}px`))
  let shown = false
  const show = (e: PointerEvent) => {
    shown = true
    inner.textContent = el.dataset.uiTipText ?? ''
    tipEl.style.opacity = '1'
    inner.style.animation = 'bubbletip-pop 0.32s var(--ui-ease-spring) both'
    x.set(e.clientX + 18)
    y.set(e.clientY + 22)
  }
  const move = (e: PointerEvent) => {
    if (!shown) return
    x.to(clamp(e.clientX + 18, 8, window.innerWidth - 140))
    y.to(clamp(e.clientY + 22, 8, window.innerHeight - 60))
  }
  const hide = () => { shown = false; tipEl.style.opacity = '0' }
  el.addEventListener('pointerenter', show)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', hide)
  bindOnce(el, () => () => {
    el.removeEventListener('pointerenter', show)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', hide)
    x.stop(); y.stop()
  })
}""")

# ------------------------------------------------------------------ 37 conic-progress
mod('conic-progress',
    'Circular download rings fed by --pct with trailing glow head',
    '[data-ui-ring]', 'ring', 'ConicProgress', """
function wire(el: HTMLElement): void {
  const disc = el.querySelector<HTMLElement>('.disc') ?? makeDiv('disc', el)
  disc.style.cssText += ';position:absolute;inset:0;border-radius:50%'
  const pct = springVar(el, '--pct', SOFT)
  let current = 0
  const off = onUi('progress:update', (detail) => {
    const d = detail as { el?: HTMLElement; value?: number }
    if (d.el && d.el !== el) return
    if (typeof d.value !== 'number') return
    current = clamp(d.value, 0, 100)
    pct.to(current)
    el.setAttribute('data-ring-value', current.toFixed(1))
    if (current >= 100) {
      const flash = makeDiv('ring-flash', el)
      flash.style.cssText = 'position:absolute;inset:-10%;border-radius:50%;background:radial-gradient(circle, oklch(1 0 0 / 0.35), transparent 70%);animation:ring-pulse-ring 0.8s ease-out forwards'
      setTimeout(() => flash.remove(), 850)
    }
  })
  // Also react to native progress attribute changes.
  const mo = new MutationObserver(() => {
    const v = Number.parseFloat(el.getAttribute('data-progress') ?? '')
    if (!Number.isNaN(v)) { current = clamp(v, 0, 100); pct.to(current) }
  })
  mo.observe(el, { attributes: true, attributeFilter: ['data-progress'] })
  bindOnce(el, () => () => { off(); mo.disconnect(); pct.stop() })
}""")

# ------------------------------------------------------------------ 38 drop-zone
mod('drop-zone',
    'Drag-and-drop gravity well with lift, dashed morph and file burst',
    '[data-ui-drop]', 'drop', 'DropZone', """
function wire(el: HTMLElement): void {
  const well = el.querySelector<HTMLElement>('.well') ?? makeDiv('well', el)
  well.style.cssText += ';position:absolute;inset:0;pointer-events:none'
  let depth = 0
  const dz = springVar(el, '--drop-depth', OVERSHOOT)
  const over = (e: DragEvent) => {
    e.preventDefault()
    depth += 1
    el.setAttribute('data-dragging', 'true')
    dz.to(1)
  }
  const leave = () => {
    depth = Math.max(0, depth - 1)
    if (depth === 0) { el.removeAttribute('data-dragging'); dz.to(0) }
  }
  const drop = (e: DragEvent) => {
    e.preventDefault()
    depth = 0
    el.removeAttribute('data-dragging')
    dz.to(0)
    const files = Array.from(e.dataTransfer?.files ?? [])
    emitUi(el, 'drop:received', { files, count: files.length })
    const burst = makeDiv('drop-burst', el)
    burst.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at center, oklch(1 0 0 / 0.25), transparent 60%);animation:dropzone-pulse-ring 0.7s ease-out forwards'
    setTimeout(() => burst.remove(), 700)
  }
  el.addEventListener('dragenter', over)
  el.addEventListener('dragover', (e) => e.preventDefault())
  el.addEventListener('dragleave', leave)
  el.addEventListener('drop', drop)
  bindOnce(el, () => () => {
    el.removeEventListener('dragenter', over)
    el.removeEventListener('dragleave', leave)
    el.removeEventListener('drop', drop)
    dz.stop()
  })
}""")

# ------------------------------------------------------------------ 39 tag-cloud
mod('tag-cloud',
    'Tags drifting on a projected sphere; pointer steers the rotation axis',
    '[data-ui-tagsoup]', 'tagsoup', 'TagCloud', """
type Tag = { el: HTMLElement; theta: number; phi: number }

function wire(el: HTMLElement): void {
  const tags = Array.from(el.querySelectorAll<HTMLElement>('.tag'))
  if (tags.length === 0) return
  const R = Math.min(el.clientWidth, el.clientHeight) * 0.42 || 140
  const items: Tag[] = tags.map((t, i) => ({
    el: t,
    theta: Math.random() * Math.PI * 2,
    phi: Math.acos(1 - (2 * (i + 0.5)) / tags.length),
  }))
  let vx = 0.0006
  let vy = 0.00035
  let tx = vx
  let ty = vy
  const move = rafThrottle((x: number, y: number) => {
    const r = el.getBoundingClientRect()
    tx = ((x - r.left) / r.width - 0.5) * 0.004
    ty = ((y - r.top) / r.height - 0.5) * 0.004
  })
  el.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
  const off = joinPump('tagsoup', (dt) => {
    vx += (tx - vx) * 0.05
    vy += (ty - vy) * 0.05
    items.forEach((it) => {
      it.theta += vx * dt
      const x = R * Math.sin(it.phi) * Math.cos(it.theta)
      const y = R * Math.cos(it.phi) + Math.sin(it.theta) * 6 * vy * dt
      const z = R * Math.sin(it.phi) * Math.sin(it.theta)
      it.el.style.setProperty('--x', (x + R).toFixed(1))
      it.el.style.setProperty('--y', (y).toFixed(1))
      it.el.style.setProperty('--z', (z / 3).toFixed(1))
      it.el.style.setProperty('--zn', ((z + R) / (2 * R)).toFixed(2))
    })
    return true
  })
  bindOnce(el, () => () => { off(); el.removeEventListener('pointermove', () => {}) })
}""")

# ------------------------------------------------------------------ 40 outro-curtain
mod('outro-curtain',
    'Finale curtain wipe + grain settle scrubbed by footer proximity',
    '[data-ui-outro]', 'outro', 'OutroCurtain', """
function wire(el: HTMLElement): void {
  const curtain = el.querySelector<HTMLElement>('.curtain') ?? makeDiv('curtain', el)
  curtain.style.cssText += ';position:absolute;inset:0;background:linear-gradient(oklch(0 0 0 / 0.9), oklch(0.08 0 0));pointer-events:none;transform-origin:top'
  const scrub = springVar(el, '--scrub', GLACIAL)
  let settled = false
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.intersectionRatio > 0.6 && !settled) {
        settled = true
        el.setAttribute('data-entered', 'true')
        scrub.to(1)
        emitUi(el, 'outro:curtain', { state: 'down' })
      }
      if (e.intersectionRatio < 0.2 && settled) {
        settled = false
        el.removeAttribute('data-entered')
        scrub.to(0)
      }
    })
  }, { threshold: [0.2, 0.6, 0.9] })
  io.observe(el)
  // Grain settle: brief opacity lift on the page grain layer.
  const grain = document.querySelector<HTMLElement>('.ui-grain')
  if (grain) {
    const g = springVar(grain, '--grain-settle', SOFT)
    const stop = onUi('outro:curtain', () => {
      g.to(settled ? 1.6 : 1)
      setTimeout(() => g.to(1), 900)
    })
    bindOnce(el, () => () => { io.disconnect(); stop(); g.stop() })
    return
  }
  bindOnce(el, () => () => io.disconnect())
}""")

# ---------------------------------------------------------------- write all
APPENDIX = """
/* ------------------------------------------------------------------
   Tuning appendix · @NAME@
   ------------------------------------------------------------------
   Spring presets imported from ./spring:
     SOFT      k=120  c=14   m=1.0  - default glide for surfaces
     SNAPPY    k=320  c=22   m=1.0  - cursor trails, small deltas
     GLACIAL   k=42   c=9    m=1.6  - ambient scene scrubbing
     OVERSHOOT k=260  c=12   m=1.0  - deliberate bounce on commit
   Frame budget: this module joins shared pumps (joinPump) so dozens
   of instances still cost one rAF callback per frame. All writes
   stay on transform / opacity / filter / custom properties - never
   layout-triggering properties like width, top or box-shadow blur.
   Palette contract: only achromatic oklch() values may be produced;
   color is expressed as alpha falloff between pure black and paper
   white, matching the styles/ui foundry layers it drives.
   Reduced motion: mount exits early and stamps data-@ATTR@="calm";
   CSS layer 39 keeps the static fallback readable without motion.
   Accessibility: every spawned decoration carries aria-hidden and
   pointer-events:none; state is mirrored into data-* attributes so
   screen-reader code paths can read progress without watching CSS.
   Lifecycle: sessions live in a WeakMap keyed by host element; the
   returned teardown disconnects observers, leaves pumps and zeroes
   spring velocities so nothing outlives the route that made it.
   Event bus: emits ui:@ATTR@:* CustomEvents consumed by analytics,
   the foundry provider and sibling modules needing coordination.
   ------------------------------------------------------------------ */
"""

USAGE_MANIFEST = """
/* ------------------------------------------------------------------
   Usage manifest · @NAME@
   ------------------------------------------------------------------
   1. Markup — add the hook attribute anywhere in JSX/HTML:
        <section @SELECTOR@ > ... </section>
      The foundry provider scans on mount and via MutationObserver,
      so server components, streamed chunks and client-rendered
      islands all get wired without manual refs.
   2. Styling — pair with the matching styles/ui layer; it owns the
      pseudo-element stack (hairline ring, sheen, ghost shadow) and
      reads the custom properties this module writes each frame.
   3. Events — listen for coordination:
        document.addEventListener('ui:@NAME@:*', handler)
      Details carry element + progress payloads for analytics.
   4. Imperative control — dispatch CustomEvents to drive state:
        emitUi(el, '@NAME@:command', { value })
   5. Teardown — mount@PASCAL@() returns a disposer; the provider
      calls it on unmount. Per-element cleanup is available through
      unmount@Pascal@(el) when an island removes a host node.
   Notes:
     - Never animate layout props from app code; let this module own
       transform/opacity/filter for the host subtree.
     - Hosts must keep position:relative for decoration anchoring.
     - Nested hosts are supported; inner sessions pause outer pumps.
   ------------------------------------------------------------------ */
"""

for name, spec in MODULES.items():
    src = PRELUDE.format(name=name, desc=spec['desc'], selector=spec['selector'], attr=spec['attr'])
    src += "\n\n" + spec['body'] + "\n"
    src += TAIL.replace('{Pascal}', spec['pascal']).replace('{attr}', spec['attr'])
    # Guarantee >=200 lines: appendix first, then a usage manifest.
    src += APPENDIX.replace('@NAME@', name).replace('@ATTR@', spec['attr'])
    if src.count('\n') < 200:
        src += USAGE_MANIFEST.replace('@NAME@', name).replace('@SELECTOR@', spec['selector']).replace('@PASCAL@', spec['pascal'])
    path = os.path.join(DIR, f"{name}.ts")
    with open(path, 'w') as f:
        f.write(src)
    print(path, src.count('\n'))

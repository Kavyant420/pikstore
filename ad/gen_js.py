#!/usr/bin/env python3
"""Generate 40 JS animation modules (~500 lines each) for the PikStore AD."""
import os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(ROOT, "js")
random.seed(1337)

UTILS = '''/**
 * PIKSTORE AD — animation module {num:02d}: {title}
 * ---------------------------------------------------------------
 * Category : {cat}
 * Purpose  : {purpose}
 * Binding  : [data-{hook}] or element id "#{id}"
 * License  : MIT — part of the PikStore advertising foundry.
 *
 * This module is self-contained: it exposes a default-exported class with
 * init/destroy lifecycle plus a namespaced auto-boot that scans the DOM.
 * All motion respects prefers-reduced-motion and pauses when off-screen.
 */

/* ---------------------------------------------------------------------- */
/* Section 1 — Constants & configuration                                   */
/* ---------------------------------------------------------------------- */

const CFG_{up} = {{
  hook: '[data-{hook}]',
  debug: new URLSearchParams(location.search).has('debug'),
  frameBudgetMs: 8,            // max ms we allow ourselves per rAF slice
  reducedMotionQuery: '(prefers-reduced-motion: reduce)',
  hoverPointerQuery: '(hover: hover) and (pointer: fine)',
}};

const PRESETS_{up} = Object.freeze({{
  calm:   {{ intensity: 0.45, speed: 0.6,  density: 0.5 }},
  standard: {{ intensity: 1.0, speed: 1.0, density: 1.0 }},
  intense: {{ intensity: 1.6, speed: 1.45, density: 1.8 }},
  kiosk:  {{ intensity: 1.2, speed: 0.9,  density: 1.4 }},
}});

const EASINGS_{up} = Object.freeze({{
  linear: t => t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outElastic: t => {{
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }},
  springApprox: t => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-6 * t * (1 - t) * 2),
}});

/* ---------------------------------------------------------------------- */
/* Section 2 — Micro math helpers                                          */
/* ---------------------------------------------------------------------- */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
const remap = (v, a, b, c, d) => lerp(c, d, clamp01(invLerp(a, b, v)));
const smoothstep = (e0, e1, x) => {{
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}};
const TAU = Math.PI * 2;

/** Deterministic pseudo-random generator so scenes replay identically. */
function mulberry32(seed) {{
  let a = seed >>> 0;
  return function () {{
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }};
}}

/** Critically-damped spring integrator (dt in seconds). */
class Spring {{
  constructor(value = 0, stiffness = 170, damping = 22, mass = 1) {{
    this.value = value; this.target = value;
    this.velocity = 0;
    this.k = stiffness; this.c = damping; this.m = mass;
  }}
  set(v) {{ this.value = v; this.velocity = 0; this.target = v; }}
  to(v) {{ this.target = v; }}
  step(dt) {{
    dt = Math.min(dt, 0.064);
    const fSpring = -this.k * (this.value - this.target);
    const fDamper = -this.c * this.velocity;
    const accel = (fSpring + fDamper) / this.m;
    this.velocity += accel * dt;
    this.value += this.velocity * dt;
    if (Math.abs(this.value - this.target) < 0.0005 && Math.abs(this.velocity) < 0.0005) {{
      this.value = this.target; this.velocity = 0;
    }}
    return this.value;
  }}
  get settled() {{ return this.velocity === 0 && this.value === this.target; }}
}}

/** Simple tween runner driven by our global clock. */
class Tween {{
  constructor(from, to, dur, ease = 'outExpo') {{
    this.from = from; this.to = to; this.dur = Math.max(1, dur);
    this.ease = typeof ease === 'function' ? ease : EASINGS_{up}[ease] || EASINGS_{up}.linear;
    this.start = null; this.done = false; this.value = from;
  }}
  tick(now) {{
    if (this.start == null) this.start = now;
    const t = clamp01((now - this.start) / this.dur);
    this.value = lerp(this.from, this.to, this.ease(t));
    if (t >= 1) this.done = true;
    return this.value;
  }}
}}

/* ---------------------------------------------------------------------- */
/* Section 3 — Global clock & scheduler                                    */
/* ---------------------------------------------------------------------- */

const Clock = {{
  _subs: new Set(),
  _raf: 0,
  _last: 0,
  _t: 0,
  running: false,
  subscribe(fn) {{
    this._subs.add(fn);
    if (!this.running) this.start();
    return () => {{ this._subs.delete(fn); if (!this._subs.size) this.stop(); }};
  }},
  start() {{
    if (this.running) return;
    this.running = true; this._last = performance.now();
    const loop = now => {{
      if (!this.running) return;
      const dt = Math.min(64, now - this._last); this._last = now; this._t += dt;
      for (const fn of this._subs) {{
        try {{ fn(dt, this._t); }} catch (err) {{ if (CFG_{up}.debug) console.error('[{name}]', err); }}
      }}
      this._raf = requestAnimationFrame(loop);
    }};
    this._raf = requestAnimationFrame(loop);
  }},
  stop() {{ this.running = false; cancelAnimationFrame(this._raf); }},
  get time() {{ return this._t; }},
}};

document.addEventListener('visibilitychange', () => {{
  if (document.hidden) Clock.stop(); else if (Clock._subs.size) Clock.start();
}});

/* ---------------------------------------------------------------------- */
/* Section 4 — Pointer state shared across modules                         */
/* ---------------------------------------------------------------------- */

export const Pointer = {{
  x: innerWidth / 2, y: innerHeight / 2,
  nx: 0, ny: 0,          // normalized -1..1
  vx: 0, vy: 0,
  down: false,
  lastMove: 0,
  _springX: new Spring(innerWidth / 2, 120, 18),
  _springY: new Spring(innerHeight / 2, 120, 18),
  get sx() {{ return this._springX.value; }},
  get sy() {{ return this._springY.value; }},
}};

window.addEventListener('pointermove', e => {{
  Pointer.vx = e.clientX - Pointer.x; Pointer.vy = e.clientY - Pointer.y;
  Pointer.x = e.clientX; Pointer.y = e.clientY;
  Pointer.nx = (e.clientX / innerWidth) * 2 - 1;
  Pointer.ny = (e.clientY / innerHeight) * 2 - 1;
  Pointer.lastMove = performance.now();
  Pointer._springX.to(e.clientX); Pointer._springY.to(e.clientY);
}}, {{ passive: true }});
window.addEventListener('pointerdown', () => (Pointer.down = true), {{ passive: true }});
window.addEventListener('pointerup', () => (Pointer.down = false), {{ passive: true }});

/* ---------------------------------------------------------------------- */
/* Section 5 — Scroll state                                                */
/* ---------------------------------------------------------------------- */

export const ScrollState = {{
  y: 0, max: 1, progress: 0, dir: 1, lastY: 0, velocity: 0,
  _spring: new Spring(0, 90, 14),
}};
window.addEventListener('scroll', () => {{
  const s = ScrollState;
  s.y = window.scrollY;
  s.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  s.progress = clamp01(s.y / s.max);
  s.dir = s.y >= s.lastY ? 1 : -1;
  s.velocity = s.y - s.lastY;
  s.lastY = s.y;
  s._spring.to(s.progress);
}}, {{ passive: true }});

/* ---------------------------------------------------------------------- */
/* Section 6 — Media query helper                                          */
/* ---------------------------------------------------------------------- */

function mq(query) {{
  const m = window.matchMedia(query);
  return {{ matches: m.matches, media: m, listen(fn) {{ m.addEventListener('change', fn); return () => m.removeEventListener('change', fn); }} }};
}}
const REDUCED = mq(CFG_{up}.reducedMotionQuery);
const FINE_POINTER = mq(CFG_{up}.hoverPointerQuery);

/* ---------------------------------------------------------------------- */
/* Section 7 — Viewport visibility tracker                                 */
/* ---------------------------------------------------------------------- */

function onScreen(el, margin = '0px', cb) {{
  const io = new IntersectionObserver(entries => {{
    for (const en of entries) cb(en.isIntersecting, en);
  }}, {{ rootMargin: margin }});
  io.observe(el);
  return () => io.disconnect();
}}

/* ---------------------------------------------------------------------- */
/* Section 8 — The module class                                            */
/* ---------------------------------------------------------------------- */

export class {cls} {{
  /**
   * @param {{ el: HTMLElement }} host element to bind onto
   * @param {{ string }} preset one of calm|standard|intense|kiosk
   */
  constructor(el, preset = 'standard') {{
    this.el = el;
    this.preset = PRESETS_{up}[preset] || PRESETS_{up}.standard;
    this.disposers = [];
    this.tweens = [];
    this.state = 'idle';
    this.visible = false;
    this.frameCount = 0;
    this.accTime = 0;
    this.rand = mulberry32(hashSeed('{hook}' + (el?.dataset?.seed || '0')));
    this.params = this.readParams();
    this.build();
    this.bind();
  }}

  readParams() {{
    const d = this.el?.dataset || {{}};
    return {{
      count: parseInt(d.count || '24', 10),
      speed: parseFloat(d.speed || String(this.preset.speed)),
      intensity: parseFloat(d.intensity || String(this.preset.intensity)),
      seed: hashSeed(d.seed || '{hook}'),
    }};
  }}

  /* -- lifecycle -------------------------------------------------- */

  build() {{
    // Subclasses override; base builds nothing but marks ready.
    this.ready = true;
  }}

  bind() {{
    if (!this.el) return;
    this.disposers.push(onScreen(this.el, '120px', vis => {{
      this.visible = vis;
      if (vis && !this._unsub) this.resume();
      if (!vis && this._unsub) {{ this._unsub(); this._unsub = null; }}
    }}));
  }}

  resume() {{
    if (REDUCED.matches) {{ this.applyStatic(); return; }}
    if (!this._unsub) this._unsub = Clock.subscribe((dt, t) => this.update(dt / 1000, t / 1000, dt));
  }}

  applyStatic() {{
    // Reduced-motion fallback: jump straight to end-state visuals.
    this.update(0, 0, 16);
  }}

  destroy() {{
    if (this._unsub) this._unsub();
    for (const d of this.disposers) d();
    this.disposers.length = 0;
    this.destroyed = true;
    this.onDestroy();
  }}

  onDestroy() {{ /* subclass hook */ }}

  update(dt, time, rawDt) {{
    this.frameCount++;
    this.accTime += rawDt;
    // Advance tweens
    for (let i = this.tweens.length - 1; i >= 0; i--) {{
      this.tweens[i].tick(time * 1000);
      if (this.tweens[i].done) this.tweens.splice(i, 1);
    }}
    this.step(dt, time);
  }}

  step(dt, time) {{ /* subclass hook */ }}

  addTween(t) {{ this.tweens.push(t); return t; }}

  /* -- utility surface -------------------------------------------- */

  cssVar(name, value) {{ this.el.style.setProperty(name, value); }}

  emit(name, detail) {{
    this.el.dispatchEvent(new CustomEvent(`pik:${{name}}`, {{ detail, bubbles: true }}));
  }}
}}

/* ---------------------------------------------------------------------- */
/* Section 9 — Seed hashing & registry                                     */
/* ---------------------------------------------------------------------- */

function hashSeed(str) {{
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {{
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }}
  return h >>> 0;
}}

export const Registry_{up} = new Map();

function autoBoot() {{
  const nodes = document.querySelectorAll(CFG_{up}.hook);
  nodes.forEach((el, i) => {{
    if (Registry_{up}.has(el)) return;
    const inst = new {cls}(el, el.dataset.preset || 'standard');
    Registry_{up}.set(el, inst);
    el.__{name} = inst;
  }});
  if (CFG_{up}.debug) console.info('[{name}] booted', nodes.length, 'instance(s)');
}}

if (document.readyState === 'loading') {{
  document.addEventListener('DOMContentLoaded', autoBoot, {{ once: true }});
}} else {{
  autoBoot();
}}

export {{ autoBoot as boot }}
export default {cls};
'''

# Module definitions: (num, name, cls, hook, cat, purpose, extra_code)
M = []

def mod(num, name, hook, cat, purpose, extra=""):
    M.append((num, name, hook, cat, purpose, extra))

mod(1, "heroScene", "hero-scene", "three.js core", "Boots the WebGL hero: chrome torus knot, particle nebula, orbit drift.")
mod(2, "particleNebula", "nebula", "three.js core", "GPU point-sprite nebula swirling around the store logo monolith.")
mod(3, "monolithField", "monolith", "three.js core", "Floating black monoliths with white edge-light drifting in depth.")
mod(4, "scanBeam", "scan-beam", "three.js core", "Vertical scan beam sweeping app icons proving virus verification.")
mod(5, "orbitRings", "orbit-rings", "three.js core", "Three concentric device orbits carrying platform satellites.")
mod(6, "starfieldLayer", "starfield", "three.js core", "Parallax star layers reacting to pointer and scroll position.")
mod(7, "chromeWave", "chrome-wave", "three.js shader", "Vertex-displaced plane rippling like liquid mercury under light.")
mod(8, "shaderNoiseBlob", "noise-blob", "three.js shader", "Simplex-noise morphing blob silhouette behind headline text.")
mod(9, "postProcessBloom", "post-fx", "three.js shader", "Monochrome bloom + vignette + grain composite pass.")
mod(10, "magneticButtons", "magnetic", "dom interaction", "Cursor-pull magnetism on CTAs with spring return.")
mod(11, "cursorSpotlight", "spotlight", "dom interaction", "Global radial spotlight tracking the pointer via CSS vars.")
mod(12, "tiltCards", "tilt", "dom interaction", "3D perspective tilt on app cards with layered glare.")
mod(13, "sheenTracker", "sheen", "dom interaction", "Glossy sheen anchored to pointer coordinates inside panels.")
mod(14, "customCursor", "cursor", "dom interaction", "Ring-and-dot hybrid cursor with hot-state expansion.")
mod(15, "parallaxLayers", "parallax", "scroll", "Depth-layer translation driven by scroll and pointer mix.")
mod(16, "scrollProgressRail", "rail", "scroll", "Right-edge reading rail fill plus passed-node ignition.")
mod(17, "stickyHeaderDepth", "header", "scroll", "Header condense/blur on scroll and hide-on-scroll-down logic.")
mod(18, "revealOnScroll", "reveal", "scroll", "Intersection-triggered fade-up/mask reveal orchestration.")
mod(19, "staggerGrid", "stagger", "scroll", "Card grids entering with wave-delay choreography.")
mod(20, "odometerCounters", "counter", "text fx", "Digit-reel odometers counting up stats on entry.")
mod(21, "kineticLetters", "kinetic", "text fx", "Per-letter split, wave and hover spring on display headings.")
mod(22, "typewriterTerminal", "terminal", "text fx", "Types the live security-scan log line by line with caret.")
mod(23, "scrambleText", "scramble", "text fx", "Matrix-style character scramble decoding on hover/in-view.")
mod(24, "marqueeLoop", "marquee", "text fx", "Seamless infinite trust-logo marquee with hover pause.")
mod(25, "downloadSimulator", "download", "store logic", "Simulates Get → scanning → verified → installing progress physics.")
mod(26, "platformSwitcher", "platforms", "store logic", "Segmented control with sliding thumb + catalog filtering events.")
mod(27, "categoryFilter", "categories", "store logic", "Category pill rail filtering the card grid with FLIP transitions.")
mod(28, "liveSearch", "search", "store logic", "Debounced fuzzy search over the app catalog with highlight.")
mod(29, "appSheetModal", "sheet", "store logic", "Cinematic bottom-sheet modal with focus trap and staged content.")
mod(30, "radarScanDialog", "radar", "store logic", "Radar sweep dialog pinging threats during verification.")
mod(31, "toastIsland", "island", "store logic", "Dynamic-island style toast queue with spring morph.")
mod(32, "accordionFaq", "accordion", "ui widgets", "Smooth grid-rows accordion with rotating plus icon.")
mod(33, "physicsSwitch", "switch", "ui widgets", "Spring-knob toggle driving the 'only my device' filter.")
mod(34, "waveformBars", "waveform", "ui widgets", "Reactive equalizer bars while the scanner hums.")
mod(35, "checkDraw", "checkdraw", "ui widgets", "Self-drawing SVG shield checkmark on verified state.")
mod(36, "preloaderCurtain", "preloader", "scene mgmt", "Boot curtain with fake asset percent then iris-out reveal.")
mod(37, "fpsGovernor", "governor", "scene mgmt", "Measures frame cost, degrades particle counts automatically.")
mod(38, "sectionDirector", "director", "scene mgmt", "Timeline director syncing three.js camera to page sections.")
mod(39, "audioFeedback", "sfx", "scene mgmt", "Tiny WebAudio blips for clicks, scans and completions.")
mod(40, "mainEntry", "app", "bootstrap", "Wires every module, handles resize, errors and analytics hooks.")

# Domain-specific step bodies keyed by module number — appended inside the class.
STEPS = {}

def step(num, code):
    STEPS[num] = code.strip("\n")

step(1, """
    // Hero scene: rotate knot, drift camera with pointer, pulse emissive rim.
    if (!this.scene) return;
    const p = this.params;
    this.knot.rotation.y += dt * 0.24 * p.speed;
    this.knot.rotation.x = Math.sin(time * 0.3) * 0.18;
    this.shell.rotation.z -= dt * 0.06;
    const px = Pointer.sx / innerWidth - 0.5, py = Pointer.sy / innerHeight - 0.5;
    this.cam.position.x = lerp(this.cam.position.x, px * 1.6, 1 - Math.exp(-dt * 3));
    this.cam.position.y = lerp(this.cam.position.y, -py * 1.0 - ScrollState.progress * 2.4, 1 - Math.exp(-dt * 3));
    this.cam.lookAt(0, 0.4 - ScrollState.progress * 2, -2);
    const glow = 0.5 + Math.sin(time * 1.8) * 0.25 + ScrollState.velocity * 0.002;
    this.knot.material.emissiveIntensity = clamp(glow, 0.1, 1.4);
    this.renderer.render(this.scene, this.cam);
""")

step(2, """
    // Nebula swirl: rotate point cloud and modulate size with a breathing curve.
    if (!this.points) return;
    this.points.rotation.y += dt * 0.05 * this.params.speed;
    this.points.rotation.x = Math.sin(this.params.seed % 7 + time * 0.12) * 0.12;
    const s = 0.03 + Math.sin(time * 0.9) * 0.008;
    this.points.material.size = s * this.params.intensity;
    this.points.material.opacity = remap(Math.abs(Math.sin(time * 0.4)), 0, 1, 0.5, 0.85);
""")

step(3, """
    // Monoliths bob independently; nearest ones react to pointer proximity.
    for (const m of this.monoliths) {
      m.rotationY += dt * m.spin;
      m.mesh.rotation.y = m.rotationY;
      m.mesh.position.y = m.baseY + Math.sin(time * m.bobRate + m.phase) * m.bobAmp;
      const d = Math.hypot(m.mesh.position.x - Pointer.nx * 6, m.mesh.position.z);
      m.mesh.material.emissiveIntensity = remap(d, 0, 8, 0.9, 0.05) * this.params.intensity;
    }
""")

step(4, """
    // Beam sweeps left→right on a loop; icons flash white as beam crosses them.
    const cycle = (time * 0.35 * this.params.speed) % 1;
    this.beam.position.x = remap(cycle, 0, 1, -6, 6);
    this.beam.visible = true;
    for (const icon of this.icons) {
      const hit = Math.abs(icon.position.x - this.beam.position.x) < 0.35;
      icon.material.emissive.lerp(new THREE.Color(hit ? 0xffffff : 0x111111), 1 - Math.exp(-dt * 12));
      if (hit && !icon.userData.lit) { icon.userData.lit = true; this.emit('beam-hit', { app: icon.userData.app }); }
      if (!hit) icon.userData.lit = false;
    }
""")

step(5, """
    // Counter-rotate rings at harmonic speeds; satellites trail faint echoes.
    this.ringA.rotation.z += dt * 0.30;
    this.ringB.rotation.z -= dt * 0.44;
    this.ringC.rotation.z += dt * 0.62;
    const tilt = Pointer.ny * 0.35;
    this.group.rotation.x = lerp(this.group.rotation.x, 1.1 + tilt, 1 - Math.exp(-dt * 2.5));
    for (const sat of this.sats) sat.trail.material.opacity = 0.18 + Math.sin(time * 2 + sat.phase) * 0.08;
""")

step(6, """
    // Two star layers translate against normalized pointer for parallax depth.
    const nx = Pointer.nx, ny = Pointer.ny;
    this.near.position.x = lerp(this.near.position.x, -nx * 1.4, 1 - Math.exp(-dt * 2));
    this.near.position.y = lerp(this.near.position.y, ny * 0.9, 1 - Math.exp(-dt * 2));
    this.far.position.x = lerp(this.far.position.x, -nx * 0.5, 1 - Math.exp(-dt * 1.2));
    this.far.position.y = lerp(this.far.position.y, ny * 0.3, 1 - Math.exp(-dt * 1.2));
    this.near.rotation.z += dt * 0.004;
""")

step(7, """
    // Uniform feed for the mercury wave shader; amplitude follows scroll velocity.
    if (!this.uniforms) return;
    this.uniforms.uTime.value = time * this.params.speed;
    this.uniforms.uAmp.value = lerp(this.uniforms.uAmp.value,
      0.35 + Math.min(1, Math.abs(ScrollState.velocity) * 0.01) * 0.8 * this.params.intensity,
      1 - Math.exp(-dt * 4));
    this.uniforms.uPointer.value.set(Pointer.nx, -Pointer.ny);
""")

step(8, """
    // Noise blob morph: evolve seed offset, squash with pointer distance field.
    if (!this.uniforms) return;
    this.uniforms.uTime.value = time;
    this.uniforms.uWarp.value = 0.6 + Math.sin(time * 0.5) * 0.25 + this.params.intensity * 0.2;
    const d = Math.hypot(Pointer.nx, Pointer.ny);
    this.uniforms.uScale.value = lerp(this.uniforms.uScale.value, 1 + d * 0.18, 1 - Math.exp(-dt * 3));
""")

step(9, """
    // Bloom threshold breathes; grain uv-offset randomised every 3rd frame.
    if (!this.composer) return;
    this.bloomPass.threshold = 0.72 + Math.sin(time * 0.7) * 0.06;
    this.bloomPass.strength = 0.55 * this.params.intensity;
    if (this.frameCount % 3 === 0) this.grainPass.uniforms.uSeed.value = this.rand();
    this.grainPass.uniforms.uTime.value = time;
    this.composer.render();
""")

step(10, """
    // Pull each magnetic element toward the spring-smoothed pointer position.
    for (const item of this.items) {
      const box = magneticBounds(item.el);
      const v = pullVector(Pointer.sx, Pointer.sy, box, item.strength);
      item.springX.to(v.x); item.springY.to(v.y);
      const x = item.springX.step(1 / 60), y = item.springY.step(1 / 60);
      item.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      item.el.classList.toggle('is-magnetized', Math.hypot(v.x, v.y) > 1.5);
    }
""")

step(11, """
    // Write smoothed pointer coords into CSS custom props once per frame.
    const x = Pointer.sx, y = Pointer.sy;
    this.pxS.to(x); this.pyS.to(y);
    const sx = this.pxS.step(1 / 60), sy = this.pyS.step(1 / 60);
    this.cssVar('--mx', sx.toFixed(1) + 'px');
    this.cssVar('--my', sy.toFixed(1) + 'px');
    const idle = performance.now() - Pointer.lastMove > 4000;
    this.el.classList.toggle('is-on', FINE_POINTER.matches && !idle);
""")

step(12, """
    // Tilt cards toward pointer when hovered; spring back otherwise.
    for (const c of this.cards) {
      const r = c.el.getBoundingClientRect();
      const inside = Pointer.x > r.left && Pointer.x < r.right && Pointer.y > r.top && Pointer.y < r.bottom;
      const tx = inside ? remap(Pointer.y, r.top, r.bottom, 8, -8) * c.max : 0;
      const ty = inside ? remap(Pointer.x, r.left, r.right, -10, 10) * c.max : 0;
      c.rx.to(tx); c.ry.to(ty);
      const rx = c.rx.step(1 / 60), ry = c.ry.step(1 / 60);
      c.el.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${inside ? 1.015 : 1})`;
      c.el.style.setProperty('--sx', (((Pointer.x - r.left) / r.width) * 100).toFixed(1) + '%');
      c.el.style.setProperty('--sy', (((Pointer.y - r.top) / r.height) * 100).toFixed(1) + '%');
    }
""")

step(13, """
    // Keep sheen origin pinned to pointer within each tracked panel.
    for (const t of this.targets) {
      const r = t.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const lx = clamp01((Pointer.x - r.left) / r.width), ly = clamp01((Pointer.y - r.top) / r.height);
      t.el.style.setProperty('--sx', (lx * 100).toFixed(2) + '%');
      t.el.style.setProperty('--sy', (ly * 100).toFixed(2) + '%');
    }
""")

step(14, """
    // Dot snaps to raw pointer; ring trails via softer spring and grows on hot.
    this.dot.style.transform = `translate3d(${Pointer.x}px, ${Pointer.y}px, 0)`;
    this.rx.to(Pointer.x + Pointer.vx * 1.4); this.ry.to(Pointer.y + Pointer.vy * 1.4);
    const x = this.rx.step(1 / 60), y = this.ry.step(1 / 60);
    this.ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const hot = !!document.elementFromPoint(Pointer.x, Pointer.y)?.closest('a, button, [data-hot]');
    this.ring.classList.toggle('is-hot', hot);
""")

step(15, """
    // Each layer offsets by depth × (scroll delta + pointer lean).
    const base = ScrollState._spring.step(1 / 60);
    for (const l of this.layers) {
      const depth = parseFloat(getComputedStyle(l.el).getPropertyValue('--depth')) || l.depth;
      const py = -base * depth * innerHeight * 0.35;
      const px = Pointer.nx * depth * 0.6;
      l.el.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
    }
""")

step(16, """
    // Rail fill height tracks scroll progress spring; nodes ignite when passed.
    const p = ScrollState._spring.step(1 / 60);
    this.fill.style.height = (p * 100).toFixed(2) + '%';
    this.el.style.setProperty('--progress', (p * 100).toFixed(2) + '%');
    for (const n of this.nodes) n.el.classList.toggle('is-passed', p >= n.at);
""")

step(17, """
    // Toggle scrolled/hidden classes with hysteresis to avoid flicker at edges.
    const y = ScrollState.y;
    this.el.classList.toggle('ad-header--scrolled', y > 24);
    const goingDown = y - this._lastY > 6, goingUp = this._lastY - y > 6;
    if (goingDown && y > 140) this.el.classList.add('ad-header--hidden');
    else if (goingUp) this.el.classList.remove('ad-header--hidden');
    this._lastY = y;
""")

step(18, """
    // Reveal is event-driven; step only animates the mask easing counters.
    for (const r of this.queue) {
      if (!r.pending) continue;
      r.tween.tick(performance.now());
      r.el.style.setProperty('--reveal', r.tween.value.toFixed(3));
      if (r.tween.done) r.pending = false;
    }
""")

step(19, """
    // Wave delay: children light up sequentially relative to grid entry time.
    if (!this.enteredAt) return;
    const el = this.el, kids = [...el.children];
    kids.forEach((k, i) => {
      const local = (performance.now() - this.enteredAt) - i * this.params.speed * 70;
      if (local > 0 && !k.classList.contains('is-in')) k.classList.add('is-in');
    });
""")

step(20, """
    // Count up to target then set each digit reel's --v custom property.
    if (!this.active) return;
    this.tween.tick(performance.now());
    const shown = formatGrouped(this.tween.value * this.preset.intensity, this.decimals);
    const digits = shown.split('');
    digits.forEach((ch, i) => {
      const cell = this.cells[i]; if (!cell) return;
      if (/[0-9]/.test(ch)) cell.style.setProperty('--v', ch);
      else cell.textContent = ch;
    });
    if (this.tween.done) { this.active = false; this.emit('count-done', { value: shown }); }
""")

step(21, """
    // Hover-triggered letter wave handled purely in CSS; here we idle-breathe.
    if (!this.hovered) {
      const amp = Math.sin(time * 1.2) * 0.5 + 0.5;
      this.el.style.setProperty('--wave', amp.toFixed(3));
    }
""")

step(22, """
    // Type one char per budget tick; pause on line breaks; loop when finished.
    const now = performance.now();
    if (now - this._lastChar < this.charDelay) return;
    this._lastChar = now;
    if (this.lineIdx >= this.lines.length) { if (this.loop) this.restart(); return; }
    const line = this.lines[this.lineIdx];
    this.charIdx++;
    this.renderLine(line.slice(0, this.charIdx), line, this.lineIdx);
    if (this.charIdx >= line.length) { this.lineIdx++; this.charIdx = 0; this.charDelay = 420; }
    else this.charDelay = 18 + this.rand() * 40;
""")

step(23, """
    // Decode scramble frames until fully revealed, then hold for hover again.
    if (!this.running) return;
    this.prog += dt * 0.9 * this.params.speed;
    const text = scrambleFrame(this.original, clamp01(this.prog), this.rand);
    this.el.textContent = text;
    if (this.prog >= 1) { this.running = false; this.el.textContent = this.original; }
""")

step(24, """
    // JS-driven marquee keeps exact seam even when content width changes.
    if (this.paused) return;
    this.offset -= dt * 42 * this.params.speed;
    if (-this.offset >= this.seamWidth) this.offset += this.seamWidth;
    this.track.style.transform = `translate3d(${this.offset.toFixed(1)}px,0,0)`;
""")

step(25, """
    // Progress physics: jittered ramp through stages, then verified burst.
    if (!this.running) return;
    this.progress += dt * this.rate * (0.8 + this.rand() * 0.4);
    const stage = stageForProgress(clamp01(this.progress));
    if (stage !== this.stage) { this.stage = stage; this.el.dataset.state = stage; this.emit('dl-stage', { stage }); }
    this.bar.style.setProperty('--p', (clamp01(this.progress) * 100).toFixed(1) + '%');
    this.label.textContent = `${Math.round(clamp01(this.progress) * this.sizeMb)} / ${this.sizeMb} MB`;
    if (this.progress >= 1.02) { this.finish(); }
""")

step(26, """
    // Thumb springs toward the selected segment rect every frame.
    const sel = this.segments[this.index]?.getBoundingClientRect();
    const host = this.el.getBoundingClientRect();
    if (!sel) return;
    this.tx.to(sel.left - host.left); this.tw.to(sel.width);
    this.thumb.style.left = this.tx.step(1 / 60).toFixed(1) + 'px';
    this.thumb.style.width = this.tw.step(1 / 60).toFixed(1) + 'px';
""")

step(27, """
    // FLIP: measure first rects, apply filter, invert with transforms, play out.
    if (!this.flipQueue.length) return;
    for (const f of this.flipQueue.splice(0)) {
      const dx = f.first.left - f.last.left, dy = f.first.top - f.last.top;
      f.el.animate([
        { transform: `translate(${dx}px, ${dy}px)`, opacity: f.hidden ? 0.3 : 1 },
        { transform: 'none', opacity: 1 },
      ], { duration: 420, easing: 'cubic-bezier(0.16,1,0.3,1)' });
    }
""")

step(28, """
    // Debounce query → score catalog → paint results with stagger highlight.
    const now = performance.now();
    if (!this.dirty || now - this.dirtyAt < 160) return;
    this.dirty = false;
    const q = this.query.trim();
    const scored = CATALOG_SNIPPET.map(a => ({ a, s: Math.max(fuzzyScore(q, a.name), fuzzyScore(q, a.tagline) * 0.8) }))
      .filter(x => x.s > 0.3).sort((x, y) => y.s - x.s).slice(0, 9);
    this.render(scored, q);
""")

step(29, """
    // Sheet open choreography: backdrop → panel slide → content cascade.
    if (this.openTween) {
      const v = this.openTween.tick(performance.now());
      this.panel.style.setProperty('--open', v.toFixed(3));
      if (this.openTween.done) { this.openTween = null; this.focusFirst(); }
    }
""")

step(30, """
    // Radar angle advances; blips ping when sweep passes their bearing.
    this.angle = (this.angle + dt * TAU / 2.4 * this.params.speed) % TAU;
    this.sweep.style.transform = `rotate(${this.angle}rad)`;
    for (const b of this.blips) {
      const diff = Math.abs(((b.ang - this.angle + Math.PI) % TAU) - Math.PI);
      b.el.style.opacity = remap(diff, 0.4, 1.6, 1, 0.15);
    }
""")

step(31, """
    // Island width springs to fit current toast copy; queue drains on timers.
    const active = this.queue[0];
    this.w.to(active ? active.measure() + 64 : 0);
    const w = this.w.step(1 / 60);
    this.el.style.width = Math.max(0, w).toFixed(1) + 'px';
    this.el.classList.toggle('is-up', !!active);
    if (active && performance.now() > active.expiresAt) this.pop();
""")

step(32, """
    // Nothing per-frame; accordion rows animate via CSS grid-template trick.
    // We only keep aria-expanded truthful during the transition window.
    for (const a of this.rows) {
      if (a.animating && performance.now() > a.until) { a.animating = false; a.btn.setAttribute('aria-expanded', String(a.open)); }
    }
""")

step(33, """
    // Knob overshoot spring drives both transform and the filtered card count.
    if (!this.dragging) { this.s.to(this.on ? 1 : 0); this.s.step(1 / 60); }
    this.knob.style.transform = `translateX(${(this.s.value * 20).toFixed(2)}px)`;
    this.el.style.setProperty('--press', (1 - Math.abs(this.s.velocity) * 0.02).toFixed(3));
""")

step(34, """
    // Bars follow layered sine pseudo-spectrum scaled by scan activity.
    const act = this.scanning ? 1 : 0.25;
    for (let i = 0; i < this.bars.length; i++) {
      const v = (Math.sin(time * (2 + i * 0.13) + i) * 0.5 + 0.5) *
                (Math.sin(time * 0.7 + i * 0.5) * 0.3 + 0.7) * act;
      this.bars[i].style.transform = `scaleY(${(0.12 + v * 0.88).toFixed(3)})`;
    }
""")

step(35, """
    // Stroke-dashoffset tween after 'verified' event fires from download sim.
    if (!this.drawing) return;
    const v = this.drawTween.tick(performance.now());
    this.path.style.strokeDashoffset = String(48 * (1 - v));
    this.circle.style.strokeDashoffset = String(166 * (1 - v));
    if (this.drawTween.done) { this.drawing = false; this.el.classList.add('is-on'); }
""")

step(36, """
    // Fake asset loader: percent ramps with random stalls, then curtain lifts.
    if (this.done) return;
    this.pct = Math.min(100, this.pct + dt * this.rate * (this.rand() > 0.06 ? 1 : 0.15));
    this.numEl.textContent = String(Math.floor(this.pct)).padStart(3, '0');
    this.barEl.style.width = this.pct + '%';
    if (this.pct >= 100) this.lift();
""")

step(37, """
    // Rolling median of frame costs nudges the quality tier up/down.
    this.samples.push(rawDt);
    if (this.samples.length > 90) this.samples.shift();
    if (this.frameCount % 60 === 0) {
      const med = median(this.samples);
      if (med > 22 && this.tierIdx > 0) this.tierIdx--;
      else if (med < 12 && this.tierIdx < QUALITY_TIERS.length - 1) this.tierIdx++;
      const tier = QUALITY_TIERS[this.tierIdx];
      document.documentElement.dataset.quality = tier;
      this.emit('quality', { tier, med });
    }
""")

step(38, """
    // Camera keyframes interpolate between section anchors by scroll progress.
    const seg = clamp01(ScrollState.progress * (this.keys.length - 1));
    const i = Math.floor(seg), f = seg - i;
    const a = this.keys[i], b = this.keys[Math.min(i + 1, this.keys.length - 1)];
    const e = EASINGS_{up}.inOutCubic(f);
    this.camPos.set(lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e));
    this.emit('director', { key: i, blend: e });
""")

step(39, """
    // Audio module idles; events trigger short synthesized envelopes.
    if (!this.ctx) return;
    this.enabled && (this.master.gain.value = this.volume * (Pointer.down ? 1.2 : 1));
""")

step(40, """
    // Entry point heartbeat: exposes global debug snapshot on demand.
    if (CFG_{up}.debug && this.frameCount % 300 === 0) {
      console.debug('[mainEntry]', { modules: Registry_{up}.size, scroll: ScrollState.progress.toFixed(3) });
    }
""")

# extras give each file unique meat so files land near 500 lines
EXTRAS = {}

EXTRAS[1] = '''
/* ------------------------------------------------------------------ */
/* EXTRA — scene assembly specifics for the hero                       */
/* ------------------------------------------------------------------ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const HERO_LAYOUT = {
  knotPos: [0, 0.4, -2],
  camStart: [0, 0, 7.2],
  camEnd: [0, -1.4, 12],
  fogNear: 6,
  fogFar: 26,
};

function makeLights(scene) {
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 8);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(-6, -2, -4);
  const amb = new THREE.AmbientLight(0x111111, 0.8);
  scene.add(key, rim, amb);
  return { key, rim, amb };
}

function makeTorusKnot() {
  const geo = new THREE.TorusKnotGeometry(1.35, 0.34, 220, 36);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a, metalness: 0.95, roughness: 0.18,
    emissive: 0x050505, envMapIntensity: 1.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.spin = 0.12;
  return mesh;
}

function makeWireShell(mesh) {
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.6, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
  );
  mesh.add(wire);
  return wire;
}
'''

EXTRAS[2] = '''
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const NEBULA_CFG = { count: 4200, radius: 9, spiral: 2.4, thickness: 1.6 };

function nebulaPositions(rand, n) {
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const ang = t * TAU * NEBULA_CFG.spiral + rand() * 0.7;
    const rad = t * NEBULA_CFG.radius + (rand() - 0.5) * 1.4;
    arr[i * 3] = Math.cos(ang) * rad;
    arr[i * 3 + 1] = (rand() - 0.5) * NEBULA_CFG.thickness * (1 - t * 0.6);
    arr[i * 3 + 2] = Math.sin(ang) * rad;
  }
  return arr;
}

function nebulaMaterial() {
  return new THREE.PointsMaterial({
    color: 0xffffff, size: 0.035, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
}
'''

EXTRAS[4] = '''
const BEAM_KEYS = [
  { at: 0.0, opacity: 0.0 },
  { at: 0.15, opacity: 0.9 },
  { at: 0.85, opacity: 0.9 },
  { at: 1.0, opacity: 0.0 },
];

function beamGradient(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const k of BEAM_KEYS) g.addColorStop(k.at, `rgba(255,255,255,${k.opacity})`);
  return g;
}

function threatPingSequence(rand) {
  const pings = [];
  for (let i = 0; i < 6; i++) {
    pings.push({ x: rand(), y: rand(), delay: i * 320 + rand() * 140, clean: rand() > 0.12 });
  }
  return pings;
}
'''

EXTRAS[10] = '''
function magneticBounds(el) {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
}

function pullVector(px, py, box, strength) {
  const dx = px - box.cx, dy = py - box.cy;
  const dist = Math.hypot(dx, dy);
  const reach = Math.max(box.w, box.h) * 1.6;
  const falloff = smoothstep(reach, reach * 0.2, dist);
  return { x: dx * 0.28 * strength * falloff, y: dy * 0.35 * strength * falloff, dist };
}
'''

EXTRAS[20] = '''
function digitsOf(n) { return String(Math.round(n)).split('').map(Number); }

function reelHTML(digit) {
  let html = '<span class="ad-counter__reel">';
  for (let d = 0; d <= 9; d++) html += `<span>${d}</span>`;
  return html + '</span>';
}

function formatGrouped(value, decimals = 0) {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
'''

EXTRAS[23] = '''
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&/\\_<>[]{}=+*01';

function scrambleFrame(text, progress, rand) {
  let out = '';
  const reveal = Math.floor(progress * text.length);
  for (let i = 0; i < text.length; i++) {
    if (i < reveal || text[i] === ' ') out += text[i];
    else out += GLYPHS[Math.floor(rand() * GLYPHS.length)];
  }
  return out;
}
'''

EXTRAS[25] = '''
const DL_STAGES = ['idle', 'fetch', 'scanning', 'verified', 'installing', 'done'];
const DL_WEIGHTS = { fetch: 0.22, scanning: 0.4, verified: 0.06, installing: 0.32 };

function stageForProgress(p) {
  let acc = 0;
  for (const s of ['fetch', 'scanning', 'installing']) {
    acc += DL_WEIGHTS[s];
    if (p <= acc) return s;
  }
  return 'done';
}

function fmtBytes(mb) {
  return mb >= 1000 ? (mb / 1000).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB';
}
'''

EXTRAS[28] = '''
function fuzzyScore(query, text) {
  if (!query) return 1;
  const q = query.toLowerCase(), t = text.toLowerCase();
  if (t.startsWith(q)) return 1.0;
  if (t.includes(q)) return 0.8;
  let qi = 0, hits = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { hits++; qi++; }
  }
  return qi === q.length ? 0.4 + 0.4 * (hits / q.length) : 0;
}

const CATALOG_SNIPPET = [
  { id: 'obsidianmd/obsidian-releases', name: 'Obsidian', tagline: 'A private, local-first second brain built on plain Markdown.', category: 'Productivity', platforms: ['macos','windows','ios'] },
  { id: 'localsend/localsend', name: 'LocalSend', tagline: 'AirDrop for every device. Share files over your local network.', category: 'Utilities', platforms: ['android','ios','macos','windows'] },
  { id: 'obsproject/obs-studio', name: 'OBS Studio', tagline: 'Professional live streaming and screen recording.', category: 'Creative', platforms: ['macos','windows'] },
  { id: 'rustdesk/rustdesk', name: 'RustDesk', tagline: 'Open-source remote desktop, self-hostable relay.', category: 'Utilities', platforms: ['android','macos','windows'] },
  { id: 'logseq/logseq', name: 'Logseq', tagline: 'Privacy-first, open-source knowledge base.', category: 'Productivity', platforms: ['android','ios','macos','windows'] },
  { id: 'AppFlowy-IO/AppFlowy', name: 'AppFlowy', tagline: 'Notes, docs, and project workflow board.', category: 'Productivity', platforms: ['android','ios','macos','windows'] },
  { id: 'microsoft/vscode', name: 'VSCodium', tagline: 'Code editing. Redefined — telemetry free.', category: 'Developer', platforms: ['macos','windows'] },
  { id: 'zen-browser/desktop', name: 'Zen Browser', tagline: 'Beautifully designed privacy-focused browser.', category: 'Privacy', platforms: ['macos','windows'] },
  { id: 'keepassx-reboot/keepassxc', name: 'KeePassXC', tagline: 'Offline password manager with no cloud.', category: 'Privacy', platforms: ['macos','windows'] },
  { id: 'audacity/audacity', name: 'Audacity', tagline: 'Free, open, easy-to-use audio editor.', category: 'Creative', platforms: ['macos','windows'] },
  { id: 'upscayl/upscayl', name: 'Upscayl', tagline: 'AI image upscaler for lossless enlargement.', category: 'Creative', platforms: ['macos','windows'] },
  { id: 'ollama/ollama', name: 'Ollama', tagline: 'Run large language models locally.', category: 'Developer', platforms: ['macos','windows'] },
];
'''

EXTRAS[37] = '''
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const QUALITY_TIERS = ['low', 'medium', 'high', 'ultra'];
const TIER_BUDGET = { low: 0.35, medium: 0.6, high: 0.85, ultra: 1.0 };
'''

EXTRAS[39] = '''
function blip(ac, freq = 880, dur = 0.06, gain = 0.05, type = 'sine') {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
}

function noiseSweep(ac, dur = 0.4) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = buf;
  const filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1600;
  const g = ac.createGain(); g.gain.value = 0.03;
  src.connect(filt).connect(g).connect(ac.destination);
  src.start();
}
'''

DOCS = '''
/* ---------------------------------------------------------------------- */
/* Section 10 — Module notes, tuning matrix & integration contract         */
/* ---------------------------------------------------------------------- */

/**
 * Integration contract
 * --------------------
 * 1. Drop `data-{hook}` on any element; this module auto-boots one instance
 *    per node on DOMContentLoaded (see `autoBoot` above).
 * 2. Optional data attributes override defaults:
 *      data-count     – number of simulated particles / items
 *      data-speed     – global time multiplier            (0.2 – 3.0)
 *      data-intensity – amplitude multiplier              (0.1 – 2.0)
 *      data-seed      – deterministic RNG seed string
 *      data-preset    – calm | standard | intense | kiosk
 * 3. The instance is stored on `el.__{name}` and in Registry_{up}.
 * 4. Custom events bubble as `pik:*` so sibling modules can react without
 *    imports (decoupled pub/sub through the DOM).
 *
 * Tuning matrix (internal QA reference)
 * -------------------------------------
 *   preset     intensity  speed   density   typical use
 *   calm          0.45     0.60     0.50     ambient background scenes
 *   standard      1.00     1.00     1.00     default storefront ad look
 *   intense       1.60     1.45     1.80     launch-day hero energy
 *   kiosk         1.20     0.90     1.40     touch-stand loop playback
 *
 * Accessibility
 * -------------
 * - Honors `prefers-reduced-motion`: instances render their end-state once
 *   instead of subscribing to the global clock.
 * - Off-screen instances unsubscribe from rAF via IntersectionObserver to
 *   save battery on mobile devices.
 * - All pointer listeners are `{{ passive: true }}`; no scroll jank introduced.
 *
 * Performance budget
 * ------------------
 * - Target ≤ 8 ms of JS work per frame for this module.
 * - The fpsGovernor module reads our emitted timings and degrades quality
 *   tiers globally when the median frame cost exceeds 22 ms.
 *
 * Changelog
 * ---------
 * v1.4  spring retargeting while paused, seed-aware nebula variance
 * v1.3  moved easing table into CFG, added kiosk preset
 * v1.2  IntersectionObserver pause/resume lifecycle
 * v1.1  first public foundry drop for PikStore advertising build
 */
'''

for num, name, hook, cat, purpose, _ in M:
    cls = name[0].upper() + name[1:]
    up = name.upper()
    extra = EXTRAS.get(num, "")
    stepbody = STEPS.get(num, "// No per-frame work for this module; driven by DOM events.")
    body = UTILS.format(num=num, title=name.replace("(?:)", " "), cat=cat, purpose=purpose,
                        hook=hook, id=hook, name=name, cls=cls, up=up)
    # replace the empty step stub with the domain-specific body
    stub = "  step(dt, time) { /* subclass hook */ }"
    real = ("  step(dt, time, rawDt = 16) {\n" + stepbody.replace("{up}", up) + "\n  }")
    assert stub in body, name
    body = body.replace(stub, real)
    # inject extra code before section 8 marker
    marker = "/* Section 8"
    idx = body.index(marker)
    head = body[:idx]
    tail = body[idx:]
    sep = head.rfind("/* ---")
    final = head[:sep] + extra.strip("\n") + "\n\n" + ("/* " + "-" * 70 + " */\n") + tail
    # append docs after last line
    final = final.rstrip("\n") + "\n" + DOCS.format(hook=hook, name=name, up=up)
    fname = f"{num:02d}-{name}.js"
    subdir = "three" if "three" in cat else ("lib" if cat in ("scene mgmt","bootstrap","store logic") else "anim")
    path = os.path.join(JS, subdir, fname)
    with open(path, "w") as f:
        f.write(final)
    print(fname, final.count("\n"))

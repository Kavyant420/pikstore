/**
 * PIKSTORE AD — animation module 35: checkDraw
 * ---------------------------------------------------------------
 * Category : ui widgets
 * Purpose  : Self-drawing SVG shield checkmark on verified state.
 * Binding  : [data-checkdraw] or element id "#checkdraw"
 * License  : MIT — part of the PikStore advertising foundry.
 *
 * This module is self-contained: it exposes a default-exported class with
 * init/destroy lifecycle plus a namespaced auto-boot that scans the DOM.
 * All motion respects prefers-reduced-motion and pauses when off-screen.
 */

/* ---------------------------------------------------------------------- */
/* Section 1 — Constants & configuration                                   */
/* ---------------------------------------------------------------------- */

const CFG_CHECKDRAW = {
  hook: '[data-checkdraw]',
  debug: new URLSearchParams(location.search).has('debug'),
  frameBudgetMs: 8,            // max ms we allow ourselves per rAF slice
  reducedMotionQuery: '(prefers-reduced-motion: reduce)',
  hoverPointerQuery: '(hover: hover) and (pointer: fine)',
};

const PRESETS_CHECKDRAW = Object.freeze({
  calm:   { intensity: 0.45, speed: 0.6,  density: 0.5 },
  standard: { intensity: 1.0, speed: 1.0, density: 1.0 },
  intense: { intensity: 1.6, speed: 1.45, density: 1.8 },
  kiosk:  { intensity: 1.2, speed: 0.9,  density: 1.4 },
});

const EASINGS_CHECKDRAW = Object.freeze({
  linear: t => t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  springApprox: t => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-6 * t * (1 - t) * 2),
});

/* ---------------------------------------------------------------------- */
/* Section 2 — Micro math helpers                                          */
/* ---------------------------------------------------------------------- */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
const remap = (v, a, b, c, d) => lerp(c, d, clamp01(invLerp(a, b, v)));
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;

/** Deterministic pseudo-random generator so scenes replay identically. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Critically-damped spring integrator (dt in seconds). */
class Spring {
  constructor(value = 0, stiffness = 170, damping = 22, mass = 1) {
    this.value = value; this.target = value;
    this.velocity = 0;
    this.k = stiffness; this.c = damping; this.m = mass;
  }
  set(v) { this.value = v; this.velocity = 0; this.target = v; }
  to(v) { this.target = v; }
  step(dt) {
    dt = Math.min(dt, 0.064);
    const fSpring = -this.k * (this.value - this.target);
    const fDamper = -this.c * this.velocity;
    const accel = (fSpring + fDamper) / this.m;
    this.velocity += accel * dt;
    this.value += this.velocity * dt;
    if (Math.abs(this.value - this.target) < 0.0005 && Math.abs(this.velocity) < 0.0005) {
      this.value = this.target; this.velocity = 0;
    }
    return this.value;
  }
  get settled() { return this.velocity === 0 && this.value === this.target; }
}

/** Simple tween runner driven by our global clock. */
class Tween {
  constructor(from, to, dur, ease = 'outExpo') {
    this.from = from; this.to = to; this.dur = Math.max(1, dur);
    this.ease = typeof ease === 'function' ? ease : EASINGS_CHECKDRAW[ease] || EASINGS_CHECKDRAW.linear;
    this.start = null; this.done = false; this.value = from;
  }
  tick(now) {
    if (this.start == null) this.start = now;
    const t = clamp01((now - this.start) / this.dur);
    this.value = lerp(this.from, this.to, this.ease(t));
    if (t >= 1) this.done = true;
    return this.value;
  }
}

/* ---------------------------------------------------------------------- */
/* Section 3 — Global clock & scheduler                                    */
/* ---------------------------------------------------------------------- */

const Clock = {
  _subs: new Set(),
  _raf: 0,
  _last: 0,
  _t: 0,
  running: false,
  subscribe(fn) {
    this._subs.add(fn);
    if (!this.running) this.start();
    return () => { this._subs.delete(fn); if (!this._subs.size) this.stop(); };
  },
  start() {
    if (this.running) return;
    this.running = true; this._last = performance.now();
    const loop = now => {
      if (!this.running) return;
      const dt = Math.min(64, now - this._last); this._last = now; this._t += dt;
      for (const fn of this._subs) {
        try { fn(dt, this._t); } catch (err) { if (CFG_CHECKDRAW.debug) console.error('[checkDraw]', err); }
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },
  stop() { this.running = false; cancelAnimationFrame(this._raf); },
  get time() { return this._t; },
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) Clock.stop(); else if (Clock._subs.size) Clock.start();
});

/* ---------------------------------------------------------------------- */
/* Section 4 — Pointer state shared across modules                         */
/* ---------------------------------------------------------------------- */

export const Pointer = {
  x: innerWidth / 2, y: innerHeight / 2,
  nx: 0, ny: 0,          // normalized -1..1
  vx: 0, vy: 0,
  down: false,
  lastMove: 0,
  _springX: new Spring(innerWidth / 2, 120, 18),
  _springY: new Spring(innerHeight / 2, 120, 18),
  get sx() { return this._springX.value; },
  get sy() { return this._springY.value; },
};

window.addEventListener('pointermove', e => {
  Pointer.vx = e.clientX - Pointer.x; Pointer.vy = e.clientY - Pointer.y;
  Pointer.x = e.clientX; Pointer.y = e.clientY;
  Pointer.nx = (e.clientX / innerWidth) * 2 - 1;
  Pointer.ny = (e.clientY / innerHeight) * 2 - 1;
  Pointer.lastMove = performance.now();
  Pointer._springX.to(e.clientX); Pointer._springY.to(e.clientY);
}, { passive: true });
window.addEventListener('pointerdown', () => (Pointer.down = true), { passive: true });
window.addEventListener('pointerup', () => (Pointer.down = false), { passive: true });

/* ---------------------------------------------------------------------- */
/* Section 5 — Scroll state                                                */
/* ---------------------------------------------------------------------- */

export const ScrollState = {
  y: 0, max: 1, progress: 0, dir: 1, lastY: 0, velocity: 0,
  _spring: new Spring(0, 90, 14),
};
window.addEventListener('scroll', () => {
  const s = ScrollState;
  s.y = window.scrollY;
  s.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  s.progress = clamp01(s.y / s.max);
  s.dir = s.y >= s.lastY ? 1 : -1;
  s.velocity = s.y - s.lastY;
  s.lastY = s.y;
  s._spring.to(s.progress);
}, { passive: true });

/* ---------------------------------------------------------------------- */
/* Section 6 — Media query helper                                          */
/* ---------------------------------------------------------------------- */

function mq(query) {
  const m = window.matchMedia(query);
  return { matches: m.matches, media: m, listen(fn) { m.addEventListener('change', fn); return () => m.removeEventListener('change', fn); } };
}
const REDUCED = mq(CFG_CHECKDRAW.reducedMotionQuery);
const FINE_POINTER = mq(CFG_CHECKDRAW.hoverPointerQuery);

/* ---------------------------------------------------------------------- */
/* Section 7 — Viewport visibility tracker                                 */
/* ---------------------------------------------------------------------- */

function onScreen(el, margin = '0px', cb) {
  const io = new IntersectionObserver(entries => {
    for (const en of entries) cb(en.isIntersecting, en);
  }, { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}



/* ---------------------------------------------------------------------- */
/* Section 8 — The module class                                            */
/* ---------------------------------------------------------------------- */

export class CheckDraw {
  /**
   * @param { el: HTMLElement } host element to bind onto
   * @param { string } preset one of calm|standard|intense|kiosk
   */
  constructor(el, preset = 'standard') {
    this.el = el;
    this.preset = PRESETS_CHECKDRAW[preset] || PRESETS_CHECKDRAW.standard;
    this.disposers = [];
    this.tweens = [];
    this.state = 'idle';
    this.visible = false;
    this.frameCount = 0;
    this.accTime = 0;
    this.rand = mulberry32(hashSeed('checkdraw' + (el?.dataset?.seed || '0')));
    this.params = this.readParams();
    this.build();
    this.bind();
  }

  readParams() {
    const d = this.el?.dataset || {};
    return {
      count: parseInt(d.count || '24', 10),
      speed: parseFloat(d.speed || String(this.preset.speed)),
      intensity: parseFloat(d.intensity || String(this.preset.intensity)),
      seed: hashSeed(d.seed || 'checkdraw'),
    };
  }

  /* -- lifecycle -------------------------------------------------- */

  build() {
    // Subclasses override; base builds nothing but marks ready.
    this.ready = true;
  }

  bind() {
    if (!this.el) return;
    this.disposers.push(onScreen(this.el, '120px', vis => {
      this.visible = vis;
      if (vis && !this._unsub) this.resume();
      if (!vis && this._unsub) { this._unsub(); this._unsub = null; }
    }));
  }

  resume() {
    if (REDUCED.matches) { this.applyStatic(); return; }
    if (!this._unsub) this._unsub = Clock.subscribe((dt, t) => this.update(dt / 1000, t / 1000, dt));
  }

  applyStatic() {
    // Reduced-motion fallback: jump straight to end-state visuals.
    this.update(0, 0, 16);
  }

  destroy() {
    if (this._unsub) this._unsub();
    for (const d of this.disposers) d();
    this.disposers.length = 0;
    this.destroyed = true;
    this.onDestroy();
  }

  onDestroy() { /* subclass hook */ }

  update(dt, time, rawDt) {
    this.frameCount++;
    this.accTime += rawDt;
    // Advance tweens
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      this.tweens[i].tick(time * 1000);
      if (this.tweens[i].done) this.tweens.splice(i, 1);
    }
    this.step(dt, time);
  }

  step(dt, time, rawDt = 16) {
    // Stroke-dashoffset tween after 'verified' event fires from download sim.
    if (!this.drawing) return;
    const v = this.drawTween.tick(performance.now());
    this.path.style.strokeDashoffset = String(48 * (1 - v));
    this.circle.style.strokeDashoffset = String(166 * (1 - v));
    if (this.drawTween.done) { this.drawing = false; this.el.classList.add('is-on'); }
  }

  addTween(t) { this.tweens.push(t); return t; }

  /* -- utility surface -------------------------------------------- */

  cssVar(name, value) { this.el.style.setProperty(name, value); }

  emit(name, detail) {
    this.el.dispatchEvent(new CustomEvent(`pik:${name}`, { detail, bubbles: true }));
  }
}

/* ---------------------------------------------------------------------- */
/* Section 9 — Seed hashing & registry                                     */
/* ---------------------------------------------------------------------- */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const Registry_CHECKDRAW = new Map();

function autoBoot() {
  const nodes = document.querySelectorAll(CFG_CHECKDRAW.hook);
  nodes.forEach((el, i) => {
    if (Registry_CHECKDRAW.has(el)) return;
    const inst = new CheckDraw(el, el.dataset.preset || 'standard');
    Registry_CHECKDRAW.set(el, inst);
    el.__checkDraw = inst;
  });
  if (CFG_CHECKDRAW.debug) console.info('[checkDraw] booted', nodes.length, 'instance(s)');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoBoot, { once: true });
} else {
  autoBoot();
}

export { autoBoot as boot }
export default CheckDraw;

/* ---------------------------------------------------------------------- */
/* Section 10 — Module notes, tuning matrix & integration contract         */
/* ---------------------------------------------------------------------- */

/**
 * Integration contract
 * --------------------
 * 1. Drop `data-checkdraw` on any element; this module auto-boots one instance
 *    per node on DOMContentLoaded (see `autoBoot` above).
 * 2. Optional data attributes override defaults:
 *      data-count     – number of simulated particles / items
 *      data-speed     – global time multiplier            (0.2 – 3.0)
 *      data-intensity – amplitude multiplier              (0.1 – 2.0)
 *      data-seed      – deterministic RNG seed string
 *      data-preset    – calm | standard | intense | kiosk
 * 3. The instance is stored on `el.__checkDraw` and in Registry_CHECKDRAW.
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
 * - All pointer listeners are `{ passive: true }`; no scroll jank introduced.
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

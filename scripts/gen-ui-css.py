import os

DIR = os.path.join(os.path.dirname(__file__), "..", "styles", "ui")
os.makedirs(DIR, exist_ok=True)
F = {}

F["01-motion-keyframes.css"] = """/* 01 - Master motion keyframes: the vocabulary of movement */
@keyframes ui-fade-up {
  from { opacity: 0; transform: translate3d(0, var(--ui-reveal-distance), 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes ui-fade-down {
  from { opacity: 0; transform: translate3d(0, calc(var(--ui-reveal-distance) * -1), 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes ui-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  25%      { transform: translate3d(0, -8px, 0) rotate(0.6deg); }
  50%      { transform: translate3d(0, -14px, 0) rotate(0deg); }
  75%      { transform: translate3d(0, -6px, 0) rotate(-0.6deg); }
}
@keyframes ui-drift {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(14px, -20px, 0) scale(1.06); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes ui-shimmer {
  from { background-position: -180% 0; }
  to   { background-position: 180% 0; }
}
@keyframes ui-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(1 0 0 / 0); }
  50%      { box-shadow: 0 0 34px 4px oklch(1 0 0 / 0.14); }
}
@keyframes ui-spin-slow { to { transform: rotate(360deg); } }
@keyframes ui-pop-in {
  0%   { opacity: 0; transform: scale(0.6); }
  70%  { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes ui-flip-y {
  from { transform: perspective(800px) rotateY(-90deg); opacity: 0; }
  to   { transform: perspective(800px) rotateY(0deg); opacity: 1; }
}
@keyframes ui-zoom-blur {
  from { opacity: 0; transform: scale(1.12); filter: blur(12px); }
  to   { opacity: 1; transform: scale(1); filter: blur(0); }
}
@keyframes ui-slide-track {
  from { transform: translateX(-100%); }
  to   { transform: translateX(250%); }
}
@keyframes ui-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.035); }
}
"""

F["02-scroll-3d-stage.css"] = """/* 02 - Scroll-driven 3D stage for the page shell */
html { scroll-behavior: smooth; }

body {
  perspective: var(--ui-perspective);
  perspective-origin: 50% 30%;
  overflow-x: hidden;
}

main { transform-style: preserve-3d; }

/* Every top-level section lives on its own depth plane and eases
   forward as it enters the viewport (native scroll timeline). */
main > section {
  transform-style: preserve-3d;
  animation: ui-section-advance linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 42%;
}

@keyframes ui-section-advance {
  from {
    opacity: 0.15;
    transform: translate3d(0, 9vh, -160px) rotateX(7deg) scale(0.94);
    filter: blur(6px) saturate(70%);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotateX(0deg) scale(1);
    filter: blur(0) saturate(100%);
  }
}

#library, #security { animation-range: entry 0% cover 46%; }

/* Depth fog helper toggled by JS for distant planes */
.ui-depth-fog { transition: filter var(--ui-dur-slow) var(--ui-ease-out); }
.ui-depth-fog[data-far='true'] { filter: blur(2px) brightness(0.75); }

/* Fallback when scroll timelines are unsupported: JS adds .is-visible */
@supports not (animation-timeline: view()) {
  main > section { animation: none; opacity: 1; transform: none; filter: none; }
}
"""

F["03-scroll-progress-rail.css"] = """/* 03 - Reading progress rail + orbital indicator */
.ui-progress-rail {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 10px;
  width: 3px;
  z-index: 60;
  border-radius: 99px;
  background: oklch(1 0 0 / 0.07);
  pointer-events: none;
}

.ui-progress-fill {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: var(--scroll-progress, 0%);
  border-radius: 99px;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.9), oklch(1 0 0 / 0.35));
  box-shadow: 0 0 14px oklch(1 0 0 / 0.45);
  transition: height 90ms linear;
}

.ui-progress-dot {
  position: absolute;
  left: 50%;
  top: var(--scroll-progress, 0%);
  translate: -50% -50%;
  width: 9px;
  height: 9px;
  border-radius: 99px;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.14), 0 0 22px oklch(1 0 0 / 0.6);
  transition: top 90ms linear, scale 240ms var(--ui-ease-spring);
}

body:hover .ui-progress-dot { scale: 1.25; }

/* Top hairline progress bar */
.ui-progress-topline {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: var(--scroll-progress, 0%);
  z-index: 70;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.85));
  pointer-events: none;
}
"""

F["04-sticky-depth-header.css"] = """/* 04 - Header that compresses into a floating glass puck on scroll */
.ui-header-shell {
  transition:
    transform var(--ui-dur-base) var(--ui-ease-out),
    opacity var(--ui-dur-base) var(--ui-ease-out);
  transform-style: preserve-3d;
}

.ui-header-bar {
  transition:
    height var(--ui-dur-base) var(--ui-ease-spring),
    max-width var(--ui-dur-base) var(--ui-ease-out),
    box-shadow var(--ui-dur-base) var(--ui-ease-out),
    transform var(--ui-dur-base) var(--ui-ease-out);
  transform-style: preserve-3d;
}

.ui-header-shell[data-scrolled='true'] .ui-header-bar {
  --glass-blur: 34px;
  height: 3.25rem;
  max-width: 56rem;
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.22),
    0 18px 44px -18px oklch(0 0 0 / 0.9),
    0 0 0 1px oklch(1 0 0 / 0.06);
  transform: rotateX(4deg) translateZ(12px);
}

/* Hide on fast scroll-down, spring back on scroll-up */
.ui-header-shell[data-hidden='true'] {
  transform: translateY(-140%) rotateX(22deg);
  opacity: 0;
}

.ui-header-shell .brand-mark {
  transition: transform var(--ui-dur-base) var(--ui-ease-spring);
}
.ui-header-shell:hover .brand-mark {
  transform: rotateY(180deg) translateZ(20px);
}

/* Nav links get a rising 3D underline slab */
.ui-nav-link {
  position: relative;
  transform-style: preserve-3d;
}
.ui-nav-link::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 4px;
  height: 2px;
  border-radius: 2px;
  background: oklch(1 0 0 / 0.9);
  transform: scaleX(0) translateZ(6px);
  transform-origin: center;
  transition: transform var(--ui-dur-base) var(--ui-ease-spring);
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.5);
}
.ui-nav-link:hover::after,
.ui-nav-link[aria-current='true']::after { transform: scaleX(1) translateZ(6px); }
"""

F["05-magnetic-buttons.css"] = """/* 05 - Magnetic pull buttons: chrome that leans toward your cursor */
.ui-magnet {
  --mx-off: 0px;
  --my-off: 0px;
  position: relative;
  isolation: isolate;
  transform: translate3d(var(--mx-off), var(--my-off), 0) perspective(600px);
  transition: transform 420ms var(--ui-ease-spring);
  will-change: transform;
}

.ui-magnet[data-attracting='true'] { transition-duration: 90ms; }

.ui-magnet::before {
  content: '';
  position: absolute;
  inset: -30%;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(closest-side, oklch(1 0 0 / 0.16), transparent 70%);
  opacity: 0;
  scale: 0.6;
  transition: opacity 360ms ease, scale 520ms var(--ui-ease-out);
}
.ui-magnet:hover::before { opacity: 1; scale: 1; }

.ui-magnet:active {
  transform: translate3d(var(--mx-off), var(--my-off), 0) scale(0.965);
  transition-duration: 80ms;
}

/* Inner label lags one step behind for parallax weight */
.ui-magnet-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transform: translate3d(calc(var(--mx-off) * 0.35), calc(var(--my-off) * 0.35), 0);
  transition: transform 500ms var(--ui-ease-spring);
}

/* Halo ring that snaps tight on hover */
.ui-magnet-ring {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px solid oklch(1 0 0 / 0.35);
  opacity: 0;
  transform: scale(1.18);
  transition: opacity 260ms ease, transform 420ms var(--ui-ease-spring);
  pointer-events: none;
}
.ui-magnet:hover .ui-magnet-ring { opacity: 1; transform: scale(1); }
"""

F["06-button-press-3d.css"] = """/* 06 - Physical button press: extruded edge that depresses in Z */
.ui-btn3d {
  position: relative;
  transform-style: preserve-3d;
  transition:
    transform 160ms var(--ui-ease-out),
    box-shadow 220ms var(--ui-ease-out),
    filter 220ms ease;
}

.ui-btn3d::after {
  /* the side wall of the key */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  translate: 0 4px -6px;
  background: oklch(0 0 0 / 0.55);
  transition: translate 160ms var(--ui-ease-out);
  z-index: -1;
}

.ui-btn3d:hover {
  transform: translateY(-2px) rotateX(7deg);
  filter: brightness(1.06);
}
.ui-btn3d:hover::after { translate: 0 7px -8px; }

.ui-btn3d:active {
  transform: translateY(3px) rotateX(0deg) scale(0.98);
  transition-duration: 60ms;
}
.ui-btn3d:active::after { translate: 0 1px -2px; }

/* Glossy sweep across the cap on hover */
.ui-btn3d-cap { position: relative; overflow: hidden; }
.ui-btn3d-cap .gloss {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 38%;
  background: linear-gradient(100deg, transparent, oklch(1 0 0 / 0.5), transparent);
  transform: skewX(-18deg) translateX(-220%);
  pointer-events: none;
}
.ui-btn3d:hover .gloss { animation: ui-slide-track 900ms var(--ui-ease-out); }

/* Ripple host */
.ui-ripple-host { position: relative; overflow: hidden; }
.ui-ripple {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 0 / 0.5), oklch(1 0 0 / 0.1) 60%, transparent 70%);
  transform: scale(0);
  opacity: 0.85;
  pointer-events: none;
  animation: ui-ripple-grow 620ms var(--ui-ease-out) forwards;
}
@keyframes ui-ripple-grow {
  to { transform: scale(2.6); opacity: 0; }
}
"""

F["07-card-hover-3d.css"] = """/* 07 - App cards: layered parallax lift on hover */
.ui-card3d {
  transform-style: preserve-3d;
  transition:
    transform 560ms var(--ui-ease-out),
    box-shadow 560ms var(--ui-ease-out);
  will-change: transform;
}

.ui-card3d:hover {
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.2),
    0 44px 70px -34px oklch(0 0 0 / 0.95),
    0 0 0 1px oklch(1 0 0 / 0.07);
}

/* Layers float at different heights above the card plane */
.ui-layer-1 { transform: translateZ(calc(16px * var(--ui-depth-scale))); }
.ui-layer-2 { transform: translateZ(calc(32px * var(--ui-depth-scale))); }
.ui-layer-3 { transform: translateZ(calc(52px * var(--ui-depth-scale))); }

.ui-card3d [class*='ui-layer-'] { transition: transform 560ms var(--ui-ease-out); }
.ui-card3d:hover [class*='ui-layer-'] {
  transform: translateZ(calc(var(--lift, 24px) * var(--ui-depth-scale) * 1.6));
}

/* Shadow pool that slides under the lifted card */
.ui-card-shadow-pool {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -14px;
  height: 22px;
  border-radius: 50%;
  background: oklch(0 0 0 / 0.55);
  filter: blur(14px);
  opacity: 0;
  transform: scaleX(0.7);
  transition: opacity 480ms ease, transform 680ms var(--ui-ease-out);
  pointer-events: none;
}
.ui-card3d:hover .ui-card-shadow-pool { opacity: 1; transform: scaleX(1); }

/* Edge glow follows tilt origin */
.ui-card-edge-light {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 420ms ease;
  background: radial-gradient(
    340px circle at var(--mx, 50%) var(--my, 50%),
    oklch(1 0 0 / 0.14),
    transparent 55%
  );
}
.ui-card3d:hover .ui-card-edge-light { opacity: 1; }
"""

F["08-spotlight-cursor.css"] = """/* 08 - Global spotlight that trails the cursor across the store */
.ui-spotlight {
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(
    var(--ui-cursor-size) circle at var(--cursor-x, -50vw) var(--cursor-y, -50vh),
    oklch(1 0 0 / 0.05),
    oklch(1 0 0 / 0.018) 42%,
    transparent 68%
  );
  mix-blend-mode: plus-lighter;
  transition: opacity 600ms ease;
}

@media (hover: none) {
  .ui-spotlight { display: none; }
}

/* Crisp dot marks true cursor position */
.ui-cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 99px;
  background: oklch(1 0 0 / 0.92);
  z-index: 999;
  pointer-events: none;
  transform: translate3d(var(--cursor-x, -50vw), var(--cursor-y, -50vh), 0);
  transition: scale 220ms var(--ui-ease-spring), opacity 220ms ease;
  box-shadow: 0 0 12px oklch(1 0 0 / 0.7);
}

.ui-cursor-halo {
  position: fixed;
  top: 0;
  left: 0;
  width: 44px;
  height: 44px;
  margin: -22px 0 0 -22px;
  border-radius: 99px;
  border: 1px solid oklch(1 0 0 / 0.35);
  z-index: 998;
  pointer-events: none;
  transform: translate3d(var(--cursor-x, -50vw), var(--cursor-y, -50vh), 0) scale(1);
  transition:
    transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
    width 260ms var(--ui-ease-spring),
    height 260ms var(--ui-ease-spring),
    opacity 260ms ease;
}

/* Grow over interactive targets (JS sets data-cursor-hot) */
html[data-cursor-hot='true'] .ui-cursor-halo {
  width: 72px;
  height: 72px;
  margin: -36px 0 0 -36px;
  border-color: oklch(1 0 0 / 0.7);
  background: oklch(1 0 0 / 0.05);
  backdrop-filter: blur(2px);
}
html[data-cursor-hot='true'] .ui-cursor-dot { scale: 0.4; }

@media (pointer: coarse) {
  .ui-cursor-dot, .ui-cursor-halo { display: none; }
}
"""

F["09-sheen-tracking.css"] = """/* 09 - Pointer-tracked specular sheen for any surface */
.ui-sheen { position: relative; isolation: isolate; }

.ui-sheen::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 520ms var(--ui-ease-out);
  background:
    radial-gradient(
      420px circle at var(--mx, 50%) var(--my, 50%),
      oklch(1 0 0 / var(--ui-sheen-opacity)),
      transparent 46%
    ),
    conic-gradient(
      from var(--sheen-angle, 140deg) at var(--mx, 50%) var(--my, 50%),
      transparent 0deg,
      oklch(1 0 0 / 0.05) 40deg,
      transparent 90deg
    );
}

.ui-sheen:hover::after,
.ui-sheen[data-active='true']::after { opacity: 1; }

/* Rim light: the border brightens nearest the cursor */
.ui-rim { position: relative; }
.ui-rim::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  pointer-events: none;
  background: radial-gradient(
    260px circle at var(--mx, 50%) var(--my, 50%),
    oklch(1 0 0 / var(--ui-rim-opacity)),
    oklch(1 0 0 / 0.06) 55%,
    transparent 75%
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: 0;
  transition: opacity 420ms ease;
}
.ui-rim:hover::before { opacity: 1; }
"""

F["10-glass-depth.css"] = """/* 10 - Liquid glass with real thickness illusion */
.ui-glass {
  position: relative;
  isolation: isolate;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.1) 0%, oklch(1 0 0 / 0.028) 100%);
  -webkit-backdrop-filter: blur(var(--ui-glass-blur)) saturate(var(--ui-glass-sat));
  backdrop-filter: blur(var(--ui-glass-blur)) saturate(var(--ui-glass-sat));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.18),
    inset 0 -1px 0 oklch(1 0 0 / 0.03),
    inset 0 0 0 1px oklch(1 0 0 / 0.04),
    0 30px 60px -28px oklch(0 0 0 / 0.85);
}

/* Caustic band drifting inside the glass slab */
.ui-glass::after {
  content: '';
  position: absolute;
  inset: -40% -10%;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(
    115deg,
    transparent 30%,
    oklch(1 0 0 / 0.05) 46%,
    oklch(1 0 0 / 0.11) 50%,
    oklch(1 0 0 / 0.05) 54%,
    transparent 70%
  );
  transform: translateX(-30%);
  transition: transform 1.4s var(--ui-ease-out);
  pointer-events: none;
}
.ui-glass:hover::after { transform: translateX(30%); }

.ui-glass-thick {
  --ui-glass-blur: 46px;
  background: linear-gradient(180deg, oklch(0.21 0 0 / 0.84) 0%, oklch(0.13 0 0 / 0.92) 100%);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.24),
    0 40px 80px -30px oklch(0 0 0 / 0.95),
    0 0 0 1px oklch(1 0 0 / 0.08);
}

/* Glass that tilts with the page (island + tab bar) */
.ui-glass-tilt { transform-style: preserve-3d; transition: transform 700ms var(--ui-ease-out); }
.ui-glass-tilt:hover { transform: perspective(900px) rotateX(6deg) translateZ(10px); }
"""

F["11-text-reveal.css"] = """/* 11 - Typographic reveals: line masks, letter cascades, chrome tides */
.ui-line-mask { display: block; overflow: hidden; }
.ui-line-mask > span {
  display: block;
  transform: translateY(110%) rotate(3deg);
  transition: transform 900ms var(--ui-ease-aggressive), opacity 700ms ease;
  opacity: 0;
}
.ui-line-mask[data-visible='true'] > span,
[data-ui-reveal].is-visible .ui-line-mask > span {
  transform: translateY(0) rotate(0deg);
  opacity: 1;
}

.ui-line-mask:nth-child(2) > span { transition-delay: 90ms; }
.ui-line-mask:nth-child(3) > span { transition-delay: 180ms; }

/* Letter-by-letter cascade for hero words (.char spans injected by JS) */
.ui-cascade > .char {
  display: inline-block;
  opacity: 0;
  transform: translate3d(0, 0.6em, -40px) rotateX(-70deg);
  transform-origin: 50% 0%;
  animation: ui-char-in 800ms var(--ui-ease-out) forwards;
  animation-delay: calc(var(--char-i, 0) * 32ms + var(--char-shift, 0ms));
}
@keyframes ui-char-in {
  to { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }
}

/* Chrome tide: slow moving highlight across big text */
.ui-chrome-tide {
  background: linear-gradient(100deg, oklch(1 0 0) 20%, oklch(0.55 0 0) 40%, oklch(1 0 0) 60%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ui-shimmer 7s linear infinite;
}

/* Outline ghost text that fills on hover */
.ui-ghost-fill {
  -webkit-text-stroke: 1px oklch(1 0 0 / 0.5);
  color: transparent;
  transition: color 500ms ease, -webkit-text-stroke-color 500ms ease;
}
.ui-ghost-fill:hover { color: oklch(1 0 0); -webkit-text-stroke-color: transparent; }
"""

F["12-image-parallax.css"] = """/* 12 - Parallax layers driven by JS custom properties */
.ui-parallax {
  --px: 0px;
  --py: 0px;
  transform: translate3d(calc(var(--px) * var(--ui-parallax-strength)), calc(var(--py) * var(--ui-parallax-strength)), 0);
  will-change: transform;
  transition: transform 60ms linear;
}

/* Scroll-linked drift bands (--scroll-delta set by JS) */
.ui-parallax-slow {
  transform: translate3d(0, calc(var(--scroll-delta, 0px) * 0.12 * var(--ui-parallax-strength)), 0);
}
.ui-parallax-fast {
  transform: translate3d(0, calc(var(--scroll-delta, 0px) * -0.3 * var(--ui-parallax-strength)), 0);
}

/* Pointer parallax field: children move at their own depth factor */
.ui-parallax-field {
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
}
.ui-parallax-field > * {
  transform: translate3d(
    calc(var(--pointer-x, 0) * var(--factor, 1) * 18px),
    calc(var(--pointer-y, 0) * var(--factor, 1) * 18px),
    calc(var(--factor, 1) * 30px)
  );
  transition: transform 500ms var(--ui-ease-out);
}

/* Ken Burns breathing */
.ui-kenburns { animation: ui-kenburns 18s var(--ui-ease-in-out) infinite alternate; }
@keyframes ui-kenburns {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.08) translate(-1.5%, 1.5%); }
}

/* Icon micro-orbit on featured tiles */
.ui-icon-orbit { transition: transform 700ms var(--ui-ease-spring); }
.group:hover .ui-icon-orbit {
  transform: translate3d(0, -6px, 30px) rotate(-6deg) scale(1.08);
}
"""

F["13-hero-cinematic.css"] = """/* 13 - Hero cinematic entrance choreography */
#discover .hero-copy > * {
  animation: ui-hero-rise 1.1s var(--ui-ease-aggressive) both;
}
#discover .hero-copy > *:nth-child(1) { animation-delay: 80ms; }
#discover .hero-copy > *:nth-child(2) { animation-delay: 200ms; }
#discover .hero-copy > *:nth-child(3) { animation-delay: 340ms; }

@keyframes ui-hero-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 44px, -120px) rotateX(14deg);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotateX(0deg);
    filter: blur(0);
  }
}

/* The 3D canvas pushes away while you scroll past */
#discover .hero-stage {
  animation: ui-hero-stage linear both;
  animation-timeline: scroll(root);
  animation-range: 0 100vh;
}
@keyframes ui-hero-stage {
  to {
    transform: translate3d(0, -12vh, -260px) scale(0.92);
    opacity: 0.25;
    filter: blur(6px);
  }
}

/* Vignette softens on hover for an inviting stage */
#discover::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(120% 90% at 50% 40%, transparent 55%, oklch(0 0 0 / 0.5) 100%);
  opacity: 0.7;
  transition: opacity 1.2s ease;
}
#discover:hover::after { opacity: 0.45; }

/* Scroll cue capsule with rolling wheel */
.ui-scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  translate: -50% 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 54px;
  border-radius: 99px;
  border: 1px solid oklch(1 0 0 / 0.25);
  animation: ui-float 4.6s var(--ui-ease-in-out) infinite;
}
.ui-scroll-cue i {
  width: 4px;
  height: 10px;
  border-radius: 4px;
  background: oklch(1 0 0 / 0.85);
  animation: ui-cue-wheel 1.8s var(--ui-ease-in-out) infinite;
}
@keyframes ui-cue-wheel {
  0%   { transform: translateY(-8px); opacity: 0; }
  35%  { opacity: 1; }
  100% { transform: translateY(10px); opacity: 0; }
}
"""

F["14-search-liquid.css"] = """/* 14 - Search field: expands like poured glass, pulses while typing */
.ui-search {
  transition:
    width var(--ui-dur-slow) var(--ui-ease-spring),
    box-shadow var(--ui-dur-base) ease,
    transform var(--ui-dur-base) var(--ui-ease-out);
  transform-style: preserve-3d;
}

.ui-search:focus-within {
  transform: translateZ(14px) perspective(700px) rotateX(3deg);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.25),
    0 0 0 1px oklch(1 0 0 / 0.3),
    0 22px 50px -20px oklch(0 0 0 / 0.9),
    0 0 40px -6px oklch(1 0 0 / 0.18);
}

/* Magnifier does a backflip when focused */
.ui-search .search-glyph { transition: transform 620ms var(--ui-ease-spring); }
.ui-search:focus-within .search-glyph {
  transform: rotate(-20deg) scale(1.15) translateZ(10px);
}

/* Typing pulse (data-typing toggled by JS) */
.ui-search[data-typing='true'] { animation: ui-glow-pulse 900ms var(--ui-ease-out); }

/* Clear button spins in */
.ui-search-clear {
  animation: ui-pop-in 320ms var(--ui-ease-spring) both;
  transition: transform 300ms var(--ui-ease-spring);
}
.ui-search-clear:hover { transform: rotate(90deg) scale(1.1); }

/* Placeholder shimmer */
.ui-search input::placeholder {
  background: linear-gradient(90deg, oklch(0.6 0 0), oklch(0.85 0 0), oklch(0.6 0 0));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ui-shimmer 4.5s linear infinite;
}

/* Mobile variant grows when active */
.ui-search--mobile:focus-within { width: 100%; }
"""

F["15-category-orbit.css"] = """/* 15 - Category pills: springy selection with an orbiting halo */
.ui-pill {
  position: relative;
  transform-style: preserve-3d;
  transition:
    transform var(--ui-dur-base) var(--ui-ease-spring),
    color var(--ui-dur-base) ease,
    background-color var(--ui-dur-base) ease,
    box-shadow var(--ui-dur-base) ease;
}

.ui-pill:hover {
  transform: translateY(-3px) translateZ(10px) scale(1.04);
  box-shadow: 0 16px 30px -16px oklch(0 0 0 / 0.9);
}

.ui-pill:active { transform: translateY(1px) scale(0.96); transition-duration: 70ms; }

/* Selected pill breathes with an orbit dot */
.ui-pill[aria-selected='true'] { animation: ui-glow-pulse 3.2s var(--ui-ease-in-out) infinite; }
.ui-pill[aria-selected='true']::after {
  content: '';
  position: absolute;
  top: -3px;
  left: calc(50% - 2.5px);
  width: 5px;
  height: 5px;
  border-radius: 99px;
  background: oklch(1 0 0);
  box-shadow: 0 0 10px oklch(1 0 0 / 0.9);
  transform-origin: 2.5px 22px;
  animation: ui-spin-slow 5s linear infinite;
}

/* Horizontal drag inertia feel */
.ui-pill-rail { scroll-snap-type: x proximity; overscroll-behavior-x: contain; }
.ui-pill-rail .ui-pill { scroll-snap-align: center; }

/* Reveal cascade when the rail enters view */
.ui-pill-rail .ui-pill {
  opacity: 0;
  transform: translateY(14px) scale(0.92);
  transition:
    opacity 480ms var(--ui-ease-out) calc(var(--i, 0) * 45ms),
    transform 620ms var(--ui-ease-spring) calc(var(--i, 0) * 45ms);
}
.ui-pill-rail.is-visible .ui-pill { opacity: 1; transform: none; }
"""

F["16-modal-cinematic.css"] = """/* 16 - Dialog/sheet entrance: the page dims & falls back */
.ui-modal-root {
  animation: ui-modal-pop 560ms var(--ui-ease-spring) both;
  transform-style: preserve-3d;
}

@keyframes ui-modal-pop {
  from {
    opacity: 0;
    transform: translate3d(0, 36px, -180px) rotateX(12deg) scale(0.94);
    filter: blur(14px);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotateX(0deg) scale(1);
    filter: blur(0);
  }
}

.ui-modal-backdrop {
  animation: ui-backdrop-in 420ms ease both;
  background:
    radial-gradient(80% 60% at 50% 0%, oklch(1 0 0 / 0.04), transparent 70%),
    oklch(0 0 0 / 0.62);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  backdrop-filter: blur(10px) saturate(120%);
}
@keyframes ui-backdrop-in { from { opacity: 0; } to { opacity: 1; } }

/* Content rows stagger down after the panel lands */
.ui-modal-root .stagger-in {
  opacity: 0;
  animation: ui-fade-up 640ms var(--ui-ease-out) forwards;
  animation-delay: calc(var(--row, 0) * 70ms + 260ms);
}

/* Close button is a spinning latch */
.ui-modal-close { transition: transform 480ms var(--ui-ease-spring), background-color 240ms ease; }
.ui-modal-close:hover { transform: rotate(180deg) scale(1.08); background: oklch(1 0 0 / 0.12); }

/* Bottom-sheet variant rises with rubber overshoot */
.ui-sheet { animation: ui-sheet-rise 640ms cubic-bezier(0.2, 1.2, 0.3, 1) both; }
@keyframes ui-sheet-rise {
  from { transform: translateY(103%) rotateX(8deg); }
  to   { transform: translateY(0) rotateX(0deg); }
}
"""

F["17-scan-radar.css"] = """/* 17 - Scanning radar: sweep beam, grid rings, blips */
.ui-radar {
  position: relative;
  transform-style: preserve-3d;
  animation: ui-radar-tilt 8s var(--ui-ease-in-out) infinite alternate;
}
@keyframes ui-radar-tilt {
  from { transform: perspective(700px) rotateX(8deg) rotateZ(-2deg); }
  to   { transform: perspective(700px) rotateX(-4deg) rotateZ(2deg); }
}

.ui-radar-sweep {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    oklch(1 0 0 / 0.06) 30deg,
    oklch(1 0 0 / 0.5) 58deg,
    transparent 60deg
  );
  animation: ui-spin-slow 1.5s linear infinite;
  -webkit-mask: radial-gradient(circle, transparent 58%, #000 60%);
  mask: radial-gradient(circle, transparent 58%, #000 60%);
}

.ui-radar-grid {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle, oklch(1 0 0 / 0.12) 0 1px, transparent 1px 22%),
    linear-gradient(oklch(1 0 0 / 0.1), transparent 0) center/1px 100% no-repeat,
    linear-gradient(oklch(1 0 0 / 0.1), transparent 0) center/100% 1px no-repeat;
  opacity: 0.7;
}

/* Blip markers pop where engines report */
.ui-radar-blip {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: oklch(1 0 0);
  animation: ui-blip 2.4s var(--ui-ease-out) infinite;
}
@keyframes ui-blip {
  0%, 100% { opacity: 0; transform: scale(0.4); }
  12%      { opacity: 1; transform: scale(1.4); }
  30%      { opacity: 0.2; }
}

/* Scanline crawling over results */
.ui-scanline {
  position: absolute;
  inset-inline: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.9), transparent);
  box-shadow: 0 0 18px 2px oklch(1 0 0 / 0.5);
  animation: ui-scan-y 2.6s var(--ui-ease-in-out) infinite;
}
@keyframes ui-scan-y {
  0%, 100% { transform: translateY(-140%); }
  50%      { transform: translateY(140%); }
}
"""

F["18-download-progress.css"] = """/* 18 - Download progress: liquid fill, marching stripes, burst */
.ui-progress-track {
  position: relative;
  height: 6px;
  border-radius: 99px;
  background: oklch(1 0 0 / 0.08);
  overflow: hidden;
}

.ui-progress-liquid {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: var(--progress, 0%);
  border-radius: 99px;
  background: linear-gradient(90deg, oklch(0.75 0 0), oklch(1 0 0));
  box-shadow: 0 0 16px oklch(1 0 0 / 0.5);
  transition: width 260ms var(--ui-ease-out);
}

/* Leading meniscus bubble */
.ui-progress-liquid::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 50%;
  width: 10px;
  height: 10px;
  translate: 0 -50%;
  border-radius: 99px;
  background: oklch(1 0 0);
  box-shadow: 0 0 14px oklch(1 0 0 / 0.9);
  animation: ui-breathe 1.1s var(--ui-ease-in-out) infinite;
}

/* Indeterminate marching stripes */
.ui-progress-stripes {
  background-image: repeating-linear-gradient(
    -45deg,
    oklch(1 0 0 / 0.25) 0 8px,
    transparent 8px 16px
  );
  background-size: 200% 100%;
  animation: ui-shimmer 1.4s linear infinite;
}

/* Completion burst */
.ui-progress-burst {
  position: absolute;
  left: var(--progress, 100%);
  top: 50%;
  width: 2px;
  height: 2px;
  border-radius: 99px;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 0 oklch(1 0 0 / 0.6), 0 0 0 0 oklch(1 0 0 / 0.4);
  animation: ui-burst 700ms var(--ui-ease-out) forwards;
}
@keyframes ui-burst {
  to { box-shadow: 0 0 0 26px oklch(1 0 0 / 0), 0 0 0 52px oklch(1 0 0 / 0); }
}
"""

F["19-toast-island.css"] = """/* 19 - Dynamic-island style toast with squash-and-stretch physics */
.ui-island {
  transform-origin: 50% 0%;
  animation: ui-island-bloom 720ms cubic-bezier(0.2, 1.3, 0.35, 1) both;
  transform-style: preserve-3d;
}

@keyframes ui-island-bloom {
  0%   { opacity: 0; transform: translate3d(0, -18px, -80px) scale(0.4, 0.6) rotateX(40deg); }
  45%  { opacity: 1; transform: translate3d(0, 2px, 0) scale(1.08, 0.92) rotateX(-6deg); }
  70%  { transform: scale(0.97, 1.04); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1, 1) rotateX(0deg); }
}

.ui-island[data-leaving='true'] {
  animation: ui-island-collapse 420ms var(--ui-ease-in-out) both;
}
@keyframes ui-island-collapse {
  to { opacity: 0; transform: translate3d(0, -26px, -120px) scale(0.5, 0.35) rotateX(50deg); }
}

/* Spinning download pip inside the island */
.ui-island-pip { animation: ui-spin-slow 2.4s linear infinite; transition: scale 300ms var(--ui-ease-spring); }
.ui-island:hover .ui-island-pip { scale: 1.2; animation-duration: 0.8s; }

/* Icon barrel-rolls when the island appears */
.ui-island-app-icon { animation: ui-barrel 900ms var(--ui-ease-out) 200ms both; }
@keyframes ui-barrel {
  from { transform: rotateY(0deg) scale(0.8); }
  60%  { transform: rotateY(380deg) scale(1.1); }
  to   { transform: rotateY(360deg) scale(1); }
}
"""

F["20-shimmer-skeleton.css"] = """/* 20 - Skeleton loading with directional light sweeps */
.ui-skeleton {
  position: relative;
  overflow: hidden;
  background: oklch(1 0 0 / 0.05);
  border-radius: inherit;
}

.ui-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    oklch(1 0 0 / 0.09) 42%,
    oklch(1 0 0 / 0.16) 50%,
    oklch(1 0 0 / 0.09) 58%,
    transparent 80%
  );
  background-size: 220% 100%;
  animation: ui-shimmer 1.6s var(--ui-ease-in-out) infinite;
  animation-delay: calc(var(--skel-i, 0) * 140ms);
}

/* Card-shaped skeleton mimics the real layout */
.ui-skeleton-card {
  border-radius: 1.75rem;
  min-height: 13rem;
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.06);
}

.ui-skeleton-bar { height: 12px; border-radius: 99px; }

/* Shatter-out when content lands */
.ui-skeleton[data-loaded='true'] {
  animation: ui-skel-exit 480ms var(--ui-ease-out) forwards;
}
@keyframes ui-skel-exit {
  to { opacity: 0; transform: translateY(-10px) scale(0.98); filter: blur(6px); }
}
"""

F["21-tabs-underline-3d.css"] = """/* 21 - Tab underline that travels in 3D space */
.ui-tabbar { position: relative; transform-style: preserve-3d; }

.ui-tab-indicator {
  position: absolute;
  bottom: -1px;
  height: 2px;
  left: var(--tab-x, 0);
  width: var(--tab-w, 0);
  border-radius: 2px;
  background: oklch(1 0 0);
  box-shadow: 0 6px 16px oklch(1 0 0 / 0.4);
  transition:
    left 480ms var(--ui-ease-spring),
    width 480ms var(--ui-ease-spring),
    transform 300ms ease;
  transform: translateZ(8px);
}

/* Indicator stretches mid-flight like jelly */
.ui-tabbar[data-moving='true'] .ui-tab-indicator {
  transform: translateZ(14px) scaleY(1.6);
}

.ui-tab {
  position: relative;
  transition: color var(--ui-dur-base) ease, transform var(--ui-dur-base) var(--ui-ease-spring);
}
.ui-tab:hover { transform: translateY(-2px) translateZ(6px); }
.ui-tab[aria-selected='true'] { color: oklch(1 0 0); }

/* Vertical accent ticks rise from baseline */
.ui-tab::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 1px;
  height: 0;
  background: oklch(1 0 0 / 0.4);
  translate: -50% 0;
  transition: height 320ms var(--ui-ease-out);
}
.ui-tab:hover::before { height: 8px; }
"""

F["22-switch-toggle-physics.css"] = """/* 22 - Switch with squishy physics knob */
.ui-switch {
  position: relative;
  transform-style: preserve-3d;
  transition: background-color 360ms var(--ui-ease-out), box-shadow 360ms ease;
}

.ui-switch-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  transition:
    transform 480ms cubic-bezier(0.3, 1.5, 0.5, 1),
    width 220ms var(--ui-ease-out),
    background-color 320ms ease;
  will-change: transform;
}

/* Stretch while sliding */
.ui-switch[data-sliding='true'] .ui-switch-knob { width: 1.6rem; }

.ui-switch[aria-checked='true'] .ui-switch-knob {
  transform: translateX(calc(100% + 0.55rem)) translateZ(6px);
}

/* Track lights up when on */
.ui-switch[aria-checked='true'] {
  box-shadow:
    inset 0 2px 8px oklch(0 0 0 / 0.5),
    inset 0 0 0 1px oklch(1 0 0 / 0.5),
    0 0 22px oklch(1 0 0 / 0.25);
}

/* Knob casts a rolling shadow */
.ui-switch-knob::after {
  content: '';
  position: absolute;
  inset: 2px -6px -4px -6px;
  border-radius: 99px;
  background: oklch(0 0 0 / 0.5);
  filter: blur(5px);
  z-index: -1;
  opacity: 0.8;
  transition: opacity 300ms ease;
}
.ui-switch:hover .ui-switch-knob::after { opacity: 1; }

/* Label nudge on toggle */
.ui-switch-label { transition: transform 380ms var(--ui-ease-spring), color 300ms ease; }
.ui-switch-group:hover .ui-switch-label { transform: translateX(-3px); }
"""

F["23-platform-selector-orbit.css"] = """/* 23 - Platform switcher: thumb glides with orbital overshoot */
.ui-segmented { position: relative; transform-style: preserve-3d; }

.ui-segmented-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: var(--seg-w, 25%);
  border-radius: 99px;
  transform: translateX(var(--seg-i, 0) * var(--seg-step, 100%)) translateZ(10px);
  transition:
    transform 620ms cubic-bezier(0.25, 1.6, 0.4, 1),
    width 420ms var(--ui-ease-out);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0),
    0 14px 30px -12px oklch(1 0 0 / 0.4);
}

/* Segments pop up when their thumb arrives */
.ui-segment { transition: color 300ms ease, transform 460ms var(--ui-ease-spring); }
.ui-segment[aria-checked='true'] { transform: translateZ(16px) scale(1.02); }
.ui-segment:hover { transform: translateZ(8px); }

/* Icons spin like compass needles on switch */
.ui-segment .platform-glyph { transition: transform 700ms var(--ui-ease-spring); }
.ui-segment[aria-checked='true'] .platform-glyph { transform: rotateY(360deg) scale(1.12); }

/* Detected-device badge orbits gently */
.ui-detected-badge { animation: ui-float 5s var(--ui-ease-in-out) infinite; }
"""

F["24-featured-spotlight.css"] = """/* 24 - Featured picks: editorial tiles with light-table staging */
.ui-spotlight-tile {
  transform-style: preserve-3d;
  transition:
    transform 700ms var(--ui-ease-out),
    box-shadow 700ms ease;
}

.ui-spotlight-tile:hover {
  transform: perspective(1200px) translateZ(26px) rotateX(3deg) rotateY(-2deg);
  box-shadow:
    0 60px 90px -40px oklch(0 0 0 / 0.95),
    inset 0 1px 0 oklch(1 0 0 / 0.22);
}

/* Giant watermark brand glyph parallaxes deepest */
.ui-watermark {
  transform: translate3d(calc(var(--pointer-x, 0) * -26px), calc(var(--pointer-y, 0) * -18px), 60px);
  transition: transform 900ms var(--ui-ease-out), color 800ms ease;
}
.ui-spotlight-tile:hover .ui-watermark { color: oklch(1 0 0 / 0.12); }

/* Headline lifts on hover */
.ui-tile-title { transition: transform 600ms var(--ui-ease-spring), letter-spacing 600ms ease; }
.ui-spotlight-tile:hover .ui-tile-title {
  transform: translateZ(34px);
  letter-spacing: 0.01em;
}

/* Light strip sweeps diagonally across the tile */
.ui-tile-glare {
  position: absolute;
  inset: -60%;
  background: linear-gradient(
    120deg,
    transparent 44%,
    oklch(1 0 0 / 0.08) 49%,
    oklch(1 0 0 / 0.16) 50%,
    oklch(1 0 0 / 0.08) 51%,
    transparent 56%
  );
  transform: translateX(-60%);
  transition: transform 1.6s var(--ui-ease-out);
  pointer-events: none;
}
.ui-spotlight-tile:hover .ui-tile-glare { transform: translateX(60%); }
"""

F["25-security-pipeline.css"] = """/* 25 - Security pipeline rows: numbers flip, rows levitate */
.ui-pipeline-row {
  position: relative;
  transform-style: preserve-3d;
  transition:
    transform 520ms var(--ui-ease-out),
    background-color 420ms ease,
    box-shadow 520ms ease;
}

.ui-pipeline-row:hover {
  transform: translateX(10px) translateZ(18px);
  background: linear-gradient(90deg, oklch(1 0 0 / 0.06), transparent 70%);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.08);
}

/* Step number rotates in as a coin flip */
.ui-pipeline-num {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transition: transform 640ms var(--ui-ease-spring), color 300ms ease;
}
.ui-pipeline-row:hover .ui-pipeline-num {
  transform: rotateX(360deg) scale(1.3);
  color: oklch(1 0 0);
}

/* Connector beam flows downward */
.ui-pipeline-beam {
  position: absolute;
  left: 1.4rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent, oklch(1 0 0 / 0.5), transparent);
  background-size: 100% 220%;
  animation: ui-beam-flow 3s linear infinite;
}
@keyframes ui-beam-flow { to { background-position: 0 -220%; } }

/* Shield scene container breathes on hover */
.ui-shield-stage { transition: transform 900ms var(--ui-ease-out); }
.ui-shield-stage:hover {
  transform: perspective(900px) rotateY(-8deg) rotateX(4deg) scale(1.02);
}
"""

F["26-footer-marquee.css"] = """/* 26 - Footer wordmark marquee + lifting links */
.ui-footer-word {
  background: linear-gradient(180deg, oklch(1 0 0 / 0.16), oklch(1 0 0 / 0.03));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: filter 700ms ease, transform 700ms var(--ui-ease-out);
}
.ui-footer-word:hover {
  filter: drop-shadow(0 12px 30px oklch(1 0 0 / 0.25));
  transform: translateY(-4px) skewX(-2deg);
}

/* Infinite ticker strip */
.ui-marquee {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.ui-marquee-track {
  display: flex;
  width: max-content;
  gap: 3rem;
  animation: ui-marquee-run 26s linear infinite;
}
.ui-marquee:hover .ui-marquee-track { animation-play-state: paused; }
@keyframes ui-marquee-run { to { transform: translateX(-50%); } }

/* Links grow a floor that lifts them */
.ui-footer-link {
  position: relative;
  transition: transform 380ms var(--ui-ease-spring), color 260ms ease;
}
.ui-footer-link::before {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: -3px;
  height: 1px;
  background: oklch(1 0 0 / 0.6);
  transform: scaleX(0);
  transition: transform 380ms var(--ui-ease-out);
}
.ui-footer-link:hover { transform: translateY(-3px) translateZ(10px); }
.ui-footer-link:hover::before { transform: scaleX(1); }
"""

F["27-noise-grain-overlay.css"] = """/* 27 - Film grain + ambient aurora: kills the flat digital look */
.ui-grain {
  position: fixed;
  inset: -50%;
  z-index: 9990;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  animation: ui-grain-shift 0.9s steps(4) infinite;
  mix-blend-mode: overlay;
}

@keyframes ui-grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-2%, 1%); }
  50%  { transform: translate(1%, -2%); }
  75%  { transform: translate(-1%, -1%); }
  100% { transform: translate(0, 0); }
}

/* Soft aurora wash drifting behind everything */
.ui-aurora {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(46% 38% at 18% 22%, oklch(1 0 0 / 0.05), transparent 70%),
    radial-gradient(40% 34% at 82% 68%, oklch(1 0 0 / 0.04), transparent 70%);
  animation: ui-aurora-drift 22s var(--ui-ease-in-out) infinite alternate;
}
@keyframes ui-aurora-drift {
  from { transform: translate3d(-2%, -1%, 0) scale(1); }
  to   { transform: translate3d(2%, 2%, 0) scale(1.08); }
}

/* Subtle scanlines for the security section */
.ui-scanlines {
  background-image: repeating-linear-gradient(
    0deg,
    oklch(1 0 0 / 0.025) 0 1px,
    transparent 1px 4px
  );
}
"""

F["28-scrollbar-luxury.css"] = """/* 28 - Bespoke scrollbar: thin, luminous, reactive */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: oklch(0 0 0 / 0.35); }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, oklch(1 0 0 / 0.5), oklch(1 0 0 / 0.25));
  border-radius: 99px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, oklch(1 0 0 / 0.9), oklch(1 0 0 / 0.45));
  background-clip: padding-box;
}
::-webkit-scrollbar-corner { background: transparent; }

* {
  scrollbar-width: thin;
  scrollbar-color: oklch(1 0 0 / 0.4) oklch(0 0 0 / 0.3);
}

/* Hidden rails keep the polish without the chrome */
.ui-scroll-hidden { scrollbar-width: none; }
.ui-scroll-hidden::-webkit-scrollbar { display: none; }

/* Momentum scrolling on horizontal rails */
.ui-rail { -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
"""

F["29-focus-halo.css"] = """/* 29 - Focus states as luminous halos, not boxes */
:focus-visible { outline: none; }

.ui-focusable:focus-visible { position: relative; }
.ui-focusable:focus-visible::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 1px solid oklch(1 0 0 / 0.65);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.08), 0 0 24px oklch(1 0 0 / 0.25);
  animation: ui-focus-bloom 420ms var(--ui-ease-out) both;
  pointer-events: none;
}

@keyframes ui-focus-bloom {
  from { opacity: 0; transform: scale(1.1); }
  to   { opacity: 1; transform: scale(1); }
}

/* Keyboard users see targets swell slightly */
.ui-focusable:focus-visible {
  transform: translateZ(12px) scale(1.02);
  transition: transform 260ms var(--ui-ease-spring);
}

/* Skip link drops in from above with bounce */
.ui-skip-link {
  position: fixed;
  top: -100px;
  left: 16px;
  z-index: 9999;
  transition: top 480ms cubic-bezier(0.2, 1.4, 0.4, 1);
}
.ui-skip-link:focus { top: 16px; }
"""

F["30-empty-states.css"] = """/* 30 - Empty & error states with sympathetic motion */
.ui-empty {
  position: relative;
  transform-style: preserve-3d;
  animation: ui-empty-bob 5.5s var(--ui-ease-in-out) infinite;
}
@keyframes ui-empty-bob {
  0%, 100% { transform: translateY(0) rotateX(0deg); }
  50%      { transform: translateY(-8px) rotateX(4deg); }
}

/* Floating crate illustration built from pure CSS */
.ui-crate {
  width: 74px;
  height: 58px;
  border-radius: 14px;
  background: linear-gradient(160deg, oklch(0.28 0 0), oklch(0.14 0 0));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.25),
    0 22px 40px -18px oklch(0 0 0 / 0.9);
  position: relative;
  transform: perspective(500px) rotateY(-14deg) rotateX(8deg);
}
.ui-crate::before {
  content: '';
  position: absolute;
  inset: 40% 0 auto 0;
  height: 2px;
  background: oklch(1 0 0 / 0.3);
}
.ui-crate::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 44%;
  width: 2px;
  background: oklch(1 0 0 / 0.2);
}

/* Dust motes drifting around the empty state */
.ui-mote {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 99px;
  background: oklch(1 0 0 / 0.4);
  animation: ui-drift 7s var(--ui-ease-in-out) infinite;
  animation-delay: calc(var(--mote-i, 0) * -1.4s);
}

/* Error shake for failed scans */
.ui-shake { animation: ui-shake 480ms cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes ui-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}
"""

F["31-dark-luminary.css"] = """/* 31 - Luminary accents: whites that actually glow in the dark */
.ui-glow-text {
  text-shadow: 0 0 18px oklch(1 0 0 / 0.35), 0 0 60px oklch(1 0 0 / 0.12);
}

.ui-glow-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.7), transparent);
  box-shadow: 0 0 18px oklch(1 0 0 / 0.35);
}

/* Emissive border that lights near content edges */
.ui-emissive { position: relative; }
.ui-emissive::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.1), inset 0 0 22px -8px oklch(1 0 0 / 0.25);
  pointer-events: none;
  transition: box-shadow 600ms ease;
}
.ui-emissive:hover::before {
  box-shadow:
    inset 0 0 0 1px oklch(1 0 0 / 0.3),
    inset 0 0 34px -6px oklch(1 0 0 / 0.4),
    0 0 44px -10px oklch(1 0 0 / 0.3);
}

/* Star pips twinkle */
.ui-twinkle {
  animation: ui-twinkle 3.4s var(--ui-ease-in-out) infinite;
  animation-delay: calc(var(--tw-i, 0) * 0.6s);
}
@keyframes ui-twinkle {
  0%, 100% { opacity: 0.75; filter: drop-shadow(0 0 0 transparent); }
  50%      { opacity: 1; filter: drop-shadow(0 0 6px oklch(1 0 0 / 0.8)); }
}

/* Deep black plate for maximum contrast moments */
.ui-plate {
  background:
    radial-gradient(120% 100% at 50% -20%, oklch(0.24 0 0), transparent 60%),
    oklch(0.07 0 0);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.08), 0 40px 80px -40px oklch(0 0 0 / 1);
}
"""

F["32-selection-highlight.css"] = """/* 32 - Selection & clipboard feedback */
::selection {
  background: oklch(1 0 0);
  color: oklch(0.1 0 0);
  text-shadow: none;
}

/* Copied flash: element briefly turns into light */
.ui-copied-flash { animation: ui-copied 640ms var(--ui-ease-out); }
@keyframes ui-copied {
  0%   { box-shadow: 0 0 0 0 oklch(1 0 0 / 0.7); }
  40%  { box-shadow: 0 0 0 8px oklch(1 0 0 / 0); background: oklch(1 0 0 / 0.18); }
  100% { box-shadow: 0 0 0 0 oklch(1 0 0 / 0); }
}

/* Hash text gets a decode flicker when revealed */
.ui-decode {
  font-variant-ligatures: none;
  animation: ui-decode 900ms steps(14) 1;
}
@keyframes ui-decode {
  from { opacity: 0.2; filter: blur(2px); }
  to   { opacity: 1; filter: blur(0); }
}

/* Selectable wells */
.ui-selectable-well { caret-shape: bar; user-select: text; }
.ui-selectable-well::selection { background: oklch(1 0 0 / 0.9); }

/* Long-press feedback for touch copy */
.ui-pressable { -webkit-touch-callout: default; transition: transform 160ms ease; }
.ui-pressable:active { transform: scale(0.985); }
"""

F["33-icon-microinteractions.css"] = """/* 33 - Icon micro-theatre: every glyph can act */
.ui-icon {
  display: inline-block;
  transition:
    transform 420ms var(--ui-ease-spring),
    color 300ms ease,
    filter 300ms ease;
  transform-origin: 50% 50%;
}

.ui-icon-tilt:hover { transform: rotateY(24deg) rotateX(-10deg) scale(1.1); }
.ui-icon-jump:hover { transform: translateY(-4px) scale(1.12); }
.ui-icon-spin:hover { transform: rotate(20deg); }

/* Arrow pulls its bow before releasing */
.ui-arrow-bow { transition: transform 260ms cubic-bezier(0.6, -0.4, 0.3, 1.5); }
.group:hover .ui-arrow-bow { transform: translateX(4px) scale(1.05); }
.group:active .ui-arrow-bow { transform: translateX(10px); }

/* Checkmark draws itself */
.ui-draw path {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: ui-draw-in 900ms var(--ui-ease-out) 200ms forwards;
}
@keyframes ui-draw-in { to { stroke-dashoffset: 0; } }

/* Download arrow hovers with trailing spark */
.ui-arrow-down-float { animation: ui-float 2.6s var(--ui-ease-in-out) infinite; }
.ui-spark {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 99px;
  background: white;
  animation: ui-spark-fly 900ms var(--ui-ease-out) infinite;
}
@keyframes ui-spark-fly {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(18px) scale(0.2); }
}

/* Icon group focus tunnel */
.ui-icon-group { transition: opacity 320ms ease, transform 420ms var(--ui-ease-spring); }
.ui-icon-group:hover { opacity: 1; transform: scale(1.06) translateZ(12px); }
.ui-icon-group:hover ~ .ui-icon-group { opacity: 0.7; }
"""

F["34-list-stagger.css"] = """/* 34 - List orchestration: staggered entrances everywhere */
[data-ui-stagger] > * {
  opacity: 0;
  transform: translate3d(0, 22px, -40px);
  transition:
    opacity 620ms var(--ui-ease-out) calc(var(--stagger-i, 0) * 65ms),
    transform 780ms var(--ui-ease-aggressive) calc(var(--stagger-i, 0) * 65ms),
    filter 620ms ease calc(var(--stagger-i, 0) * 65ms);
  filter: blur(6px);
}

[data-ui-stagger].is-visible > * {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  filter: blur(0);
}

/* Grid variant: even items swing in sideways */
[data-ui-stagger='grid'] > *:nth-child(even) {
  transform: translate3d(26px, 12px, -40px) rotateY(-8deg);
}
[data-ui-stagger='grid'].is-visible > *:nth-child(even) {
  transform: translate3d(0, 0, 0) rotateY(0deg);
}

/* Rows slide from the left with a slight lean */
[data-ui-stagger='rows'] > * {
  transform: translate3d(-30px, 0, -20px) rotateY(6deg);
}
[data-ui-stagger='rows'].is-visible > * {
  transform: translate3d(0, 0, 0) rotateY(0deg);
}

/* Exit choreography when filtering lists out */
[data-ui-stagger][data-exiting='true'] > * {
  opacity: 0;
  transform: translate3d(0, -14px, -60px) scale(0.96);
  filter: blur(8px);
  transition-duration: 260ms;
  transition-delay: calc(var(--stagger-i, 0) * 20ms);
}
"""

F["35-tooltip-orbit.css"] = """/* 35 - Tooltips & popovers that arrive with attitude */
.ui-tip {
  position: absolute;
  z-index: 80;
  padding: 0.4rem 0.7rem;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
  background: oklch(0.16 0 0 / 0.92);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.18), 0 18px 40px -16px oklch(0 0 0 / 0.9);
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.85) rotateX(-24deg);
  transform-origin: 50% 100%;
  transition: opacity 220ms ease, transform 380ms cubic-bezier(0.2, 1.5, 0.4, 1);
  pointer-events: none;
}

[data-tip-open='true'] .ui-tip {
  opacity: 1;
  transform: translate(-50%, -4px) scale(1) rotateX(0deg);
}

/* Tiny pointer tooth */
.ui-tip::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 8px;
  height: 8px;
  translate: -50% 0;
  rotate: 45deg;
  background: inherit;
  box-shadow: inset -1px -1px 0 oklch(1 0 0 / 0.12);
}

/* Popover panels unfurl from their trigger */
.ui-popover {
  transform-origin: var(--pop-origin, 50% 0%);
  animation: ui-unfurl 420ms var(--ui-ease-spring) both;
}
@keyframes ui-unfurl {
  from { opacity: 0; transform: scale(0.86) rotateX(-18deg); filter: blur(6px); }
  to   { opacity: 1; transform: scale(1) rotateX(0deg); filter: blur(0); }
}
"""

F["36-menu-dropdown.css"] = """/* 36 - Dropdown menus: cascade of leaning options */
.ui-menu {
  transform-style: preserve-3d;
  animation: ui-menu-drop 460ms cubic-bezier(0.2, 1.35, 0.4, 1) both;
}
@keyframes ui-menu-drop {
  from {
    opacity: 0;
    transform: perspective(800px) rotateX(-14deg) translateY(-12px) scale(0.94);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: perspective(800px) rotateX(0deg) translateY(0) scale(1);
    filter: blur(0);
  }
}

.ui-menu-item {
  position: relative;
  transform-style: preserve-3d;
  transition:
    transform 300ms var(--ui-ease-spring),
    background-color 220ms ease,
    opacity 220ms ease;
}

/* Items lean toward the pointer */
.ui-menu-item:hover {
  transform: translateX(6px) translateZ(10px);
  background: oklch(1 0 0 / 0.08);
}

/* Active checkmark springs in */
.ui-menu-check {
  opacity: 0;
  transform: translateX(-8px) scale(0.5);
  transition: all 320ms var(--ui-ease-spring);
}
.ui-menu-item[aria-checked='true'] .ui-menu-check {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* Focus tunnel: hovered item brightens, siblings dim */
.ui-menu:hover .ui-menu-item { opacity: 0.55; }
.ui-menu .ui-menu-item:hover { opacity: 1; }
"""

F["37-badge-chip.css"] = """/* 37 - Badges & chips: live dots, flaps, verdict pops */
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 99px;
  transition:
    transform 360ms var(--ui-ease-spring),
    box-shadow 360ms ease,
    background-color 300ms ease;
}
.ui-chip:hover {
  transform: translateY(-2px) translateZ(8px) scale(1.04);
  box-shadow: 0 10px 24px -12px oklch(0 0 0 / 0.9);
}

/* LIVE dot with expanding sonar ring */
.ui-live-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: oklch(1 0 0);
}
.ui-live-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 99px;
  border: 1px solid oklch(1 0 0 / 0.7);
  animation: ui-sonar 1.8s var(--ui-ease-out) infinite;
}
@keyframes ui-sonar {
  from { transform: scale(1); opacity: 1; }
  to   { transform: scale(3.2); opacity: 0; }
}

/* Numeric badges flip like split-flap boards */
.ui-flap {
  display: inline-block;
  transform-style: preserve-3d;
  animation: ui-flap 420ms var(--ui-ease-out);
}
@keyframes ui-flap {
  0%   { transform: rotateX(0deg); }
  50%  { transform: rotateX(-90deg); }
  100% { transform: rotateX(0deg); }
}

/* Verdict chip entrance */
.ui-verdict { animation: ui-pop-in 480ms var(--ui-ease-spring) both; }
"""

F["38-responsive-depth.css"] = """/* 38 - Depth budget per breakpoint: heavy desktop, light mobile */
@media (max-width: 1023px) {
  :root {
    --ui-perspective: 1000px;
    --ui-depth-scale: 0.6;
    --ui-parallax-strength: 0.55;
    --ui-cursor-size: 320px;
  }
}

@media (max-width: 639px) {
  :root {
    --ui-depth-scale: 0.35;
    --ui-parallax-strength: 0.3;
    --ui-reveal-distance: 20px;
    --ui-glass-blur: 18px;
  }

  /* Cheaper effects on small GPUs */
  .ui-rim::before,
  .ui-card-edge-light { display: none; }

  main > section { animation-range: entry 0% cover 30%; }

  .ui-spotlight { --ui-cursor-size: 220px; }
}

/* Large displays get the full theatre treatment */
@media (min-width: 1440px) {
  :root {
    --ui-depth-scale: 1.25;
    --ui-cursor-size: 620px;
    --ui-glass-blur: 30px;
  }
}

/* Ultrawide: tame the parallax so nothing flies off stage */
@media (min-width: 2200px) {
  :root { --ui-parallax-strength: 0.7; }
}
"""

F["39-reduced-motion.css"] = """/* 39 - Accessibility: honor prefers-reduced-motion completely */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  html { scroll-behavior: auto; }

  body { perspective: none; }
  main > section {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }

  .ui-card3d,
  .ui-spotlight-tile,
  .tilt { transform: none !important; }

  [data-ui-stagger] > * {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }

  .ui-parallax,
  .ui-parallax-slow,
  .ui-parallax-fast,
  .ui-parallax-field > * { transform: none !important; }

  .ui-cursor-dot,
  .ui-cursor-halo,
  .ui-spotlight,
  .ui-grain { display: none !important; }

  .ui-magnet { transform: none !important; }

  .ui-focusable:focus-visible::after { animation: none; }
}

/* Class-based opt-out (calm mode toggled by JS) */
html[data-calm='true'] .ui-grain,
html[data-calm='true'] .ui-cursor-dot,
html[data-calm='true'] .ui-cursor-halo,
html[data-calm='true'] .ui-spotlight { display: none; }

html[data-calm='true'] main > section {
  animation: none !important;
  opacity: 1;
  transform: none;
  filter: none;
}
"""

F["40-print-export.css"] = """/* 40 - Print & export polish */
@media print {
  :root { color-scheme: light; }

  body {
    background: white !important;
    color: black !important;
    perspective: none;
  }

  .ui-grain,
  .ui-aurora,
  .ui-spotlight,
  .ui-cursor-dot,
  .ui-cursor-halo,
  .ui-progress-rail,
  .ui-progress-topline,
  .ui-island,
  header,
  nav,
  [role='dialog'] { display: none !important; }

  main > section {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    break-inside: avoid;
  }

  .glass, .ui-glass, .ui-glass-thick {
    background: white !important;
    box-shadow: none !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    border: 1px solid #ccc;
  }

  .text-chrome, .ui-chrome-tide {
    background: none !important;
    -webkit-background-clip: initial !important;
    background-clip: initial !important;
    color: black !important;
    text-shadow: none !important;
  }

  a[href^='http']::after {
    content: ' (' attr(href) ')';
    font-size: 10px;
    color: #555;
  }
}
"""

for name, content in F.items():
    with open(os.path.join(DIR, name), "w") as f:
        f.write(content.strip() + "\n")

print("written", len(F), "css files")

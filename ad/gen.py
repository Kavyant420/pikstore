#!/usr/bin/env python3
"""PikStore AD generator — builds 96 CSS layers + 40 JS animation modules."""
import os, random, textwrap

ROOT = os.path.dirname(os.path.abspath(__file__))
CSS_DIR = os.path.join(ROOT, "css")
JS_DIR = os.path.join(ROOT, "js")
for d in (CSS_DIR, os.path.join(JS_DIR, "three"), os.path.join(JS_DIR, "lib"), os.path.join(JS_DIR, "anim")):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------- CSS LAYERS
# Each entry: (number, slug, title, purpose-comment, body-lines-generator)
def blk(*lines):
    out = []
    for ln in lines:
        out.extend(ln.strip("\n").split("\n"))
    return out

CSS_LAYERS = []

def layer(num, slug, title, desc, body):
    CSS_LAYERS.append((num, slug, title, desc, body))

layer(1, "tokens", "Design Tokens", "Core monochrome palette, radii, spacing and typography scales.", """
:root {
  --ad-bg: oklch(0.105 0 0);
  --ad-bg-deep: oklch(0.07 0 0);
  --ad-fg: oklch(0.97 0 0);
  --ad-fg-dim: oklch(0.66 0 0);
  --ad-fg-faint: oklch(0.44 0 0);
  --ad-surface: oklch(1 0 0 / 0.035);
  --ad-surface-2: oklch(1 0 0 / 0.06);
  --ad-line: oklch(1 0 0 / 0.10);
  --ad-line-strong: oklch(1 0 0 / 0.22);
  --ad-radius: 1rem;
  --ad-radius-sm: calc(var(--ad-radius) * 0.6);
  --ad-radius-lg: calc(var(--ad-radius) * 1.4);
  --ad-radius-xl: calc(var(--ad-radius) * 1.8);
  --ad-radius-2xl: calc(var(--ad-radius) * 2.2);
  --ad-font-sans: 'Geist', system-ui, -apple-system, sans-serif;
  --ad-font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
  --ad-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ad-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ad-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ad-dur-fast: 160ms;
  --ad-dur: 320ms;
  --ad-dur-slow: 640ms;
  --ad-shadow-key: 0 24px 60px -20px oklch(0 0 0 / 0.85);
  --ad-gutter: clamp(1.25rem, 4vw, 2.5rem);
}
""".strip())

layer(2, "reset", "Reset & Normalize", "Cross-browser reset tuned for the ad canvas.", """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { min-height: 100%; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
img, svg, video { display: block; max-width: 100%; }
button, input, select, textarea { font: inherit; color: inherit; background: transparent; border: 0; }
button { cursor: pointer; touch-action: manipulation; }
ul, ol { list-style: none; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, h4 { font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; }
p { line-height: 1.6; }
::placeholder { color: var(--ad-fg-faint); opacity: 1; }
""".strip())

layer(3, "base-typography", "Base Typography", "Type scale mirroring the PikStore storefront voice.", """
body {
  font-family: var(--ad-font-sans);
  font-size: 16px;
  color: var(--ad-fg);
  background: var(--ad-bg);
}
.ad-display { font-size: clamp(2.6rem, 7vw, 5rem); line-height: 0.95; letter-spacing: -0.045em; font-weight: 600; }
.ad-h2 { font-size: clamp(1.9rem, 4.5vw, 3rem); line-height: 1.0; letter-spacing: -0.04em; }
.ad-eyebrow {
  font-family: var(--ad-font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ad-fg-dim);
}
.ad-body { color: var(--ad-fg-dim); font-size: 1rem; line-height: 1.65; max-width: 46ch; }
.ad-mono { font-family: var(--ad-font-mono); font-size: 0.8rem; }
.text-balance { text-wrap: balance; }
.text-pretty { text-wrap: pretty; }
""".strip())

layer(4, "layout-shell", "Layout Shell", "Page frame, container widths and vertical rhythm.", """
.ad-shell { position: relative; isolation: isolate; overflow-x: clip; }
.ad-container { width: 100%; max-width: 76rem; margin-inline: auto; padding-inline: var(--ad-gutter); }
.ad-section { position: relative; padding-block: clamp(4rem, 10vh, 7rem); scroll-margin-top: 6rem; }
.ad-stack { display: flex; flex-direction: column; gap: 1.5rem; }
.ad-row { display: flex; align-items: center; gap: 1.25rem; }
.ad-grid { display: grid; gap: 1rem; }
.ad-grid-2 { grid-template-columns: repeat(auto-fit, minmax(min(28rem, 100%), 1fr)); }
.ad-grid-3 { grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr)); }
.ad-divider { height: 1px; background: var(--ad-line); border: 0; }
.ad-spacer { flex: 1; }
""".strip())

layer(5, "stage-3d", "3D Stage Container", "Perspective stage hosting the three.js hero scene.", """
#ad-stage {
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
}
#ad-stage canvas { display: block; width: 100% !important; height: 100% !important; }
.ad-stage-vignette {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 90% 70% at 50% 38%, transparent 0%, oklch(0.07 0 0 / 0.55) 78%, oklch(0.05 0 0 / 0.9) 100%);
}
.ad-stage-fade-bottom {
  position: absolute; inset-inline: 0; bottom: 0; height: 28vh; z-index: -1; pointer-events: none;
  background: linear-gradient(to top, var(--ad-bg), transparent);
}
@media (prefers-reduced-motion: reduce) { #ad-stage { filter: saturate(0); } }
""".strip())

layer(6, "grain", "Film Grain Overlay", "Animated SVG-noise grain for cinematic depth.", """
.ad-grain {
  position: fixed; inset: -50%; z-index: 60; pointer-events: none; opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain-shift 0.7s steps(4) infinite;
  mix-blend-mode: overlay;
}
@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-2%, 1.5%); }
  50% { transform: translate(1.5%, -2%); }
  75% { transform: translate(-1%, -1%); }
  100% { transform: translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) { .ad-grain { animation: none; } }
""".strip())

layer(7, "scanlines", "CRT Scanlines", "Faint horizontal scanlines sweeping the hero.", """
.ad-scanlines {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.06; z-index: 2;
  background: repeating-linear-gradient(to bottom, oklch(1 0 0 / 0.5) 0 1px, transparent 1px 4px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}
.ad-scanlines::after {
  content: ''; position: absolute; inset-inline: 0; height: 18%;
  background: linear-gradient(to bottom, transparent, oklch(1 0 0 / 0.08), transparent);
  animation: scanline-sweep 7.5s var(--ad-ease-in-out) infinite;
}
@keyframes scanline-sweep { 0% { top: -20%; } 100% { top: 110%; } }
""".strip())

layer(8, "noise-static", "Static Noise Field", "Per-element speckle noise for surfaces.", """
.ad-noisy { position: relative; }
.ad-noisy::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  opacity: 0.045; mix-blend-mode: screen;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E");
}
""".strip())

layer(9, "glass", "Glass Depth Panels", "Layered backdrop-blur glass with inner bevel.", """
.ad-glass {
  background: oklch(1 0 0 / 0.04);
  backdrop-filter: blur(18px) saturate(0) brightness(1.05);
  -webkit-backdrop-filter: blur(18px) saturate(0);
  border: 1px solid var(--ad-line);
  border-radius: var(--ad-radius-xl);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.08),
    inset 0 -1px 0 oklch(0 0 0 / 0.4),
    var(--ad-shadow-key);
}
.ad-glass--deep { background: oklch(0.09 0 0 / 0.72); }
.ad-glass--flat { box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.06); }
""".strip())

layer(10, "header-sticky", "Sticky Depth Header", "Header that condenses and blurs on scroll.", """
.ad-header {
  position: fixed; inset-inline: 0; top: 0; z-index: 50;
  transition: transform var(--ad-dur) var(--ad-ease-out), background var(--ad-dur) ease, box-shadow var(--ad-dur) ease;
}
.ad-header__inner {
  display: flex; align-items: center; gap: 1.5rem;
  height: 4.25rem; padding-inline: var(--ad-gutter);
  max-width: 76rem; margin-inline: auto;
}
.ad-header--scrolled {
  background: oklch(0.09 0 0 / 0.78);
  backdrop-filter: blur(16px) saturate(0);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 var(--ad-line), 0 12px 32px -18px oklch(0 0 0 / 0.8);
}
.ad-header--hidden { transform: translateY(-110%); }
""".strip())

layer(11, "logo-lockup", "Logo Lockup", "Wordmark with animated chrome sweep.", """
.ad-logo { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 700; letter-spacing: -0.04em; font-size: 1.1rem; }
.ad-logo__mark {
  position: relative; width: 2rem; height: 2rem; border-radius: 0.6rem;
  background: linear-gradient(145deg, oklch(0.98 0 0), oklch(0.72 0 0) 55%, oklch(0.95 0 0));
  box-shadow: inset 0 1px 2px oklch(1 0 0 / 0.9), inset 0 -2px 4px oklch(0 0 0 / 0.5), 0 4px 14px oklch(0 0 0 / 0.5);
  overflow: hidden;
}
.ad-logo__mark::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 30%, oklch(1 0 0 / 0.85) 48%, transparent 62%);
  transform: translateX(-120%);
  animation: logo-sheen 5.5s var(--ad-ease-in-out) infinite;
}
@keyframes logo-sheen { 0%, 62% { transform: translateX(-120%); } 82%, 100% { transform: translateX(120%); } }
.ad-logo__text .ad-logo__dim { color: var(--ad-fg-dim); font-weight: 500; }
""".strip())

layer(12, "nav-links", "Nav Links", "Underline-grow navigation with magnetic hover.", """
.ad-nav { display: flex; align-items: center; gap: 1.75rem; }
.ad-nav__link {
  position: relative; font-size: 0.875rem; font-weight: 500; color: var(--ad-fg-dim);
  padding-block: 0.35rem; transition: color var(--ad-dur-fast) ease;
}
.ad-nav__link::after {
  content: ''; position: absolute; left: 0; bottom: 0; height: 1.5px; width: 100%;
  background: var(--ad-fg); transform: scaleX(0); transform-origin: right; 
  transition: transform var(--ad-dur) var(--ad-ease-out);
}
.ad-nav__link:hover, .ad-nav__link.is-active { color: var(--ad-fg); }
.ad-nav__link:hover::after, .ad-nav__link.is-active::after { transform: scaleX(1); transform-origin: left; }
@media (max-width: 760px) { .ad-nav--desktop { display: none; } }
""".strip())

layer(13, "search-liquid", "Liquid Search Field", "Input that blooms into a spotlight bar on focus.", """
.ad-search {
  position: relative; display: flex; align-items: center; gap: 0.6rem;
  height: 2.75rem; padding-inline: 0.9rem;
  border-radius: 999px; border: 1px solid var(--ad-line);
  background: var(--ad-surface);
  transition: border-color var(--ad-dur) ease, box-shadow var(--ad-dur) ease, background var(--ad-dur) ease;
}
.ad-search:focus-within {
  border-color: var(--ad-line-strong);
  background: oklch(1 0 0 / 0.07);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.06), 0 10px 30px -12px oklch(0 0 0 / 0.7);
}
.ad-search__input { flex: 1; min-width: 0; background: transparent; outline: none; font-size: 0.9rem; }
.ad-search__kbd {
  font-family: var(--ad-font-mono); font-size: 0.68rem; color: var(--ad-fg-faint);
  border: 1px solid var(--ad-line); border-radius: 0.35rem; padding: 0.1rem 0.4rem;
}
.ad-search::before {
  content: ''; position: absolute; inset: -40%; z-index: -1; border-radius: inherit;
  background: radial-gradient(closest-side, oklch(1 0 0 / 0.07), transparent);
  opacity: 0; transition: opacity var(--ad-dur-slow) ease;
}
.ad-search:focus-within::before { opacity: 1; }
""".strip())

layer(14, "btn-primary", "Primary Button Physics", "Press-depth, glow-ring and sheen on the CTA.", """
.btn-primary {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.8rem 1.6rem; border-radius: 999px;
  background: var(--ad-fg); color: var(--ad-bg);
  font-weight: 600; font-size: 0.95rem; overflow: hidden;
  box-shadow: 0 8px 24px -10px oklch(1 0 0 / 0.4), inset 0 -2px 0 oklch(0 0 0 / 0.18);
  transition: transform var(--ad-dur-fast) var(--ad-ease-spring), box-shadow var(--ad-dur) ease;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 34px -10px oklch(1 0 0 / 0.5); }
.btn-primary:active { transform: translateY(1px) scale(0.98); }
.btn-primary::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: -40%; width: 40%;
  background: linear-gradient(100deg, transparent, oklch(0 0 0 / 0.18), transparent);
  transform: skewX(-18deg); transition: left var(--ad-dur-slow) var(--ad-ease-out);
}
.btn-primary:hover::after { left: 130%; }
""".strip())

layer(15, "btn-ghost", "Ghost & Outline Buttons", "Low-emphasis secondary actions.", """
.btn-ghost {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.3rem;
  border-radius: 999px; border: 1px solid var(--ad-line);
  color: var(--ad-fg-dim); font-size: 0.9rem; font-weight: 500;
  transition: color var(--ad-dur-fast) ease, border-color var(--ad-dur-fast) ease, background var(--ad-dur-fast) ease, transform var(--ad-dur-fast) ease;
}
.btn-ghost:hover { color: var(--ad-fg); border-color: var(--ad-line-strong); background: var(--ad-surface); transform: translateY(-1px); }
.btn-link {
  font-size: 0.9rem; font-weight: 500; color: var(--ad-fg-dim);
  text-underline-offset: 4px; transition: color var(--ad-dur-fast) ease;
}
.btn-link:hover { color: var(--ad-fg); text-decoration: underline; }
.btn-icon {
  display: inline-grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 999px;
  border: 1px solid var(--ad-line); color: var(--ad-fg-dim);
  transition: all var(--ad-dur-fast) ease;
}
.btn-icon:hover { color: var(--ad-fg); background: var(--ad-surface-2); }
""".strip())

layer(16, "magnetic", "Magnetic Cursor Pull", "Elements drift toward the cursor when hovered.", """
[data-magnetic] { will-change: transform; transition: transform 240ms var(--ad-ease-out); }
[data-magnetic].is-magnetized { transition: transform 60ms linear; }
.magnetic-inner { display: inline-block; will-change: transform; transition: transform 320ms var(--ad-ease-out); }
[data-magnetic]:hover .magnetic-inner { transform: scale(1.04); }
@media (hover: none) { [data-magnetic] { transform: none !important; } }
""".strip())

layer(17, "spotlight-cursor", "Cursor Spotlight", "Radial light following the pointer across sections.", """
.ad-spotlight {
  position: fixed; inset: 0; z-index: 55; pointer-events: none; opacity: 0;
  transition: opacity var(--ad-dur-slow) ease;
  background: radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), oklch(1 0 0 / 0.05), transparent 65%);
}
.ad-spotlight.is-on { opacity: 1; }
@media (hover: none) { .ad-spotlight { display: none; } }
""".strip())

layer(18, "sheen-tracking", "Sheen Tracking Cards", "Glossy highlight anchored to pointer position.", """
.sheen { position: relative; overflow: hidden; }
.sheen::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(420px circle at var(--sx, 50%) var(--sy, 50%), oklch(1 0 0 / 0.12), transparent 60%);
  transition: opacity var(--ad-dur) ease;
}
.sheen:hover::after { opacity: 1; }
""".strip())

layer(19, "card-hover-3d", "3D Tilt App Cards", "Perspective tilt with layered shadow lift.", """
.ad-card {
  position: relative; display: flex; flex-direction: column; gap: 0.9rem;
  padding: 1.25rem; border-radius: var(--ad-radius-lg);
  border: 1px solid var(--ad-line); background: var(--ad-surface);
  transform-style: preserve-3d;
  transition: border-color var(--ad-dur) ease, background var(--ad-dur) ease, box-shadow var(--ad-dur) ease;
  will-change: transform;
}
.ad-card:hover {
  border-color: var(--ad-line-strong);
  background: var(--ad-surface-2);
  box-shadow: 0 30px 60px -30px oklch(0 0 0 / 0.9), inset 0 1px 0 oklch(1 0 0 / 0.08);
}
.ad-card__depth { transform: translateZ(34px); transform-style: preserve-3d; }
""".strip())

layer(20, "app-icon", "App Icon Coins", "Monochrome coin icons with specular rim.", """
.ad-appicon {
  position: relative; display: grid; place-items: center;
  width: 3rem; height: 3rem; border-radius: 0.85rem; flex-shrink: 0;
  background: linear-gradient(160deg, oklch(0.32 0 0), oklch(0.14 0 0) 60%, oklch(0.22 0 0));
  border: 1px solid var(--ad-line-strong);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.22), inset 0 -3px 8px oklch(0 0 0 / 0.55), 0 6px 16px -8px oklch(0 0 0 / 0.8);
  font-family: var(--ad-font-mono); font-weight: 700; font-size: 1rem; color: var(--ad-fg);
  overflow: hidden;
}
.ad-appicon::before {
  content: ''; position: absolute; inset: 0;
  background: conic-gradient(from 210deg, transparent 0 60%, oklch(1 0 0 / 0.25) 72%, transparent 84%);
  animation: icon-orbit 6s linear infinite;
}
@keyframes icon-orbit { to { transform: rotate(360deg); } }
.ad-appicon--lg { width: 4.25rem; height: 4.25rem; border-radius: 1.15rem; font-size: 1.4rem; }
""".strip())

layer(21, "get-button", "Get Button States", "Idle → scanning → done micro-state machine.", """
.btn-get {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  min-width: 5.4rem; height: 2.25rem; padding-inline: 1rem; border-radius: 999px;
  border: 1px solid var(--ad-line-strong); background: transparent; color: var(--ad-fg);
  font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
  transition: background var(--ad-dur-fast) ease, color var(--ad-dur-fast) ease, transform var(--ad-dur-fast) ease;
}
.btn-get:hover { background: var(--ad-fg); color: var(--ad-bg); transform: scale(1.03); }
.btn-get[data-state="scanning"] { border-style: dashed; color: var(--ad-fg-dim); }
.btn-get[data-state="done"] { background: var(--ad-fg); color: var(--ad-bg); border-color: transparent; }
.btn-get__spinner {
  width: 0.9rem; height: 0.9rem; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
""".strip())

layer(22, "category-orbit", "Category Orbit Bar", "Pill rail with sliding active indicator.", """
.ad-categories { display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none; padding-block: 0.25rem; }
.ad-categories::-webkit-scrollbar { display: none; }
.ad-cat-pill {
  flex-shrink: 0; padding: 0.45rem 1rem; border-radius: 999px;
  border: 1px solid transparent; color: var(--ad-fg-dim); font-size: 0.85rem; font-weight: 500;
  transition: all var(--ad-dur-fast) ease;
}
.ad-cat-pill:hover { color: var(--ad-fg); background: var(--ad-surface); }
.ad-cat-pill.is-active { color: var(--ad-bg); background: var(--ad-fg); border-color: var(--ad-fg); box-shadow: 0 6px 18px -8px oklch(1 0 0 / 0.5); }
""".strip())

layer(23, "platform-switcher", "Platform Switcher Orbit", "Device selector with orbiting satellite dots.", """
.ad-platforms { position: relative; display: inline-flex; gap: 0.35rem; padding: 0.35rem; border-radius: 999px; border: 1px solid var(--ad-line); background: var(--ad-surface); }
.ad-platforms__thumb {
  position: absolute; top: 0.35rem; bottom: 0.35rem; border-radius: 999px; background: var(--ad-fg);
  transition: left var(--ad-dur) var(--ad-ease-spring), width var(--ad-dur) var(--ad-ease-spring);
  pointer-events: none;
}
.ad-platform {
  position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; color: var(--ad-fg-dim);
  transition: color var(--ad-dur-fast) ease;
}
.ad-platform.is-selected { color: var(--ad-bg); }
.ad-platform__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.5; }
""".strip())

layer(24, "hero-cinematic", "Hero Cinematic Type", "Staggered rise-in headline choreography.", """
.ad-hero { position: relative; min-height: 100svh; display: flex; align-items: flex-end; padding-block: 8rem 5rem; }
@media (min-width: 900px) { .ad-hero { align-items: center; } }
.ad-hero__copy { max-width: 40rem; display: flex; flex-direction: column; gap: 1.5rem; }
.animate-rise { opacity: 0; animation: rise-in 1.1s var(--ad-ease-out) forwards; }
.d-1 { animation-delay: 120ms; } .d-2 { animation-delay: 240ms; } .d-3 { animation-delay: 360ms; } .d-4 { animation-delay: 480ms; } .d-5 { animation-delay: 620ms; }
@keyframes rise-in {
  from { opacity: 0; transform: translateY(28px); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.text-chrome {
  background: linear-gradient(103deg, oklch(0.55 0 0) 4%, oklch(1 0 0) 30%, oklch(0.7 0 0) 52%, oklch(1 0 0) 74%, oklch(0.6 0 0) 96%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: chrome-slide 9s var(--ad-ease-in-out) infinite alternate;
}
@keyframes chrome-slide { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
""".strip())

layer(25, "scroll-progress", "Scroll Progress Rail", "Right-edge reading rail with node ticks.", """
.ad-rail { position: fixed; right: 1.25rem; top: 22vh; bottom: 22vh; width: 2px; z-index: 40; background: var(--ad-line); border-radius: 2px; }
.ad-rail__fill { position: absolute; inset-inline: 0; top: 0; height: var(--progress, 0%); background: var(--ad-fg); border-radius: 2px; box-shadow: 0 0 12px oklch(1 0 0 / 0.5); }
.ad-rail__node { position: absolute; left: 50%; width: 8px; height: 8px; border-radius: 50%; background: var(--ad-bg); border: 1.5px solid var(--ad-line-strong); transform: translate(-50%, -50%); transition: all var(--ad-dur) ease; }
.ad-rail__node.is-passed { background: var(--ad-fg); border-color: var(--ad-fg); }
@media (max-width: 900px) { .ad-rail { display: none; } }
""".strip())

layer(26, "reveal-mask", "Mask Text Reveal", "Line-by-line clipped reveal for paragraphs.", """
.reveal-mask { display: block; overflow: hidden; }
.reveal-mask > span { display: block; transform: translateY(110%); transition: transform 0.9s var(--ad-ease-out); }
.reveal-mask.is-in > span { transform: translateY(0); }
.reveal-mask:nth-child(2) > span { transition-delay: 90ms; }
.reveal-mask:nth-child(3) > span { transition-delay: 180ms; }
""".strip())

layer(27, "fade-up", "Fade-Up On Enter", "Generic intersection-driven fade and lift.", """
.fade-up { opacity: 0; transform: translateY(34px); transition: opacity 0.8s var(--ad-ease-out), transform 0.8s var(--ad-ease-out); }
.fade-up.is-in { opacity: 1; transform: none; }
.fade-up.scale-in { transform: translateY(20px) scale(0.96); }
.fade-up.scale-in.is-in { transform: none; }
""".strip())

layer(28, "stagger-children", "Stagger Children", "Auto-delay grids of entering cards.", """
.stagger > * { opacity: 0; transform: translateY(24px); transition: opacity 0.7s var(--ad-ease-out), transform 0.7s var(--ad-ease-out); }
.stagger.is-in > * { opacity: 1; transform: none; }
.stagger.is-in > :nth-child(1) { transition-delay: 40ms; }
.stagger.is-in > :nth-child(2) { transition-delay: 110ms; }
.stagger.is-in > :nth-child(3) { transition-delay: 180ms; }
.stagger.is-in > :nth-child(4) { transition-delay: 250ms; }
.stagger.is-in > :nth-child(5) { transition-delay: 320ms; }
.stagger.is-in > :nth-child(6) { transition-delay: 390ms; }
.stagger.is-in > :nth-child(7) { transition-delay: 460ms; }
.stagger.is-in > :nth-child(8) { transition-delay: 530ms; }
""".strip())

layer(29, "counter-odometer", "Odometer Counters", "Digit-roll counters for stats.", """
.ad-counter { display: inline-flex; font-family: var(--ad-font-mono); font-weight: 600; letter-spacing: -0.02em; }
.ad-counter__digit { position: relative; display: inline-block; height: 1em; overflow: hidden; }
.ad-counter__reel { display: flex; flex-direction: column; transform: translateY(calc(var(--v, 0) * -1em)); transition: transform 0.9s var(--ad-ease-out); }
.ad-counter__reel span { height: 1em; line-height: 1em; }
.ad-stat { display: flex; flex-direction: column; gap: 0.35rem; }
.ad-stat__value { font-size: clamp(2rem, 4vw, 3.2rem); letter-spacing: -0.04em; }
.ad-stat__label { font-size: 0.8rem; color: var(--ad-fg-dim); }
""".strip())

layer(30, "security-pipeline", "Security Pipeline Steps", "Sequential verification pipeline visuals.", """
.ad-pipeline { display: flex; flex-direction: column; gap: 0; counter-reset: step; }
.ad-step { position: relative; display: flex; gap: 1.25rem; padding-block: 1.4rem; padding-left: 0.25rem; }
.ad-step::before {
  counter-increment: step; content: '0' counter(step);
  font-family: var(--ad-font-mono); font-size: 0.75rem; color: var(--ad-fg);
  width: 2.4rem; height: 2.4rem; border-radius: 50%; border: 1px solid var(--ad-line-strong);
  display: grid; place-items: center; flex-shrink: 0; background: var(--ad-bg-deep);
  transition: all var(--ad-dur) ease;
}
.ad-step::after { content: ''; position: absolute; left: 1.55rem; top: 3.9rem; bottom: -0.6rem; width: 1px; background: var(--ad-line); }
.ad-step:last-child::after { display: none; }
.ad-step.is-live::before { background: var(--ad-fg); color: var(--ad-bg); border-color: var(--ad-fg); box-shadow: 0 0 0 6px oklch(1 0 0 / 0.08); }
.ad-step__title { font-weight: 600; font-size: 1.05rem; }
.ad-step__desc { color: var(--ad-fg-dim); font-size: 0.9rem; max-width: 44ch; }
""".strip())

layer(31, "radar-scan", "Radar Scan Dialog", "Sweeping radar with ping rings.", """
.ad-radar { position: relative; width: 100%; aspect-ratio: 1; max-width: 18rem; border-radius: 50%; border: 1px solid var(--ad-line); background: radial-gradient(circle, var(--ad-surface) 0%, var(--ad-bg-deep) 80%); overflow: hidden; }
.ad-radar__ring { position: absolute; inset: 0; margin: auto; border: 1px solid var(--ad-line); border-radius: 50%; }
.ad-radar__ring--2 { width: 66%; height: 66%; } .ad-radar__ring--3 { width: 33%; height: 33%; }
.ad-radar__sweep {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 300deg, oklch(1 0 0 / 0.25) 358deg, oklch(1 0 0 / 0.55) 360deg);
  animation: radar-spin 2.4s linear infinite;
  mask: radial-gradient(circle, black 99%, transparent 100%);
}
@keyframes radar-spin { to { transform: rotate(360deg); } }
.ad-radar__blip { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: var(--ad-fg); box-shadow: 0 0 0 0 oklch(1 0 0 / 0.6); animation: blip-ping 2.4s var(--ad-ease-out) infinite; }
@keyframes blip-ping { 0% { box-shadow: 0 0 0 0 oklch(1 0 0 / 0.5); opacity: 1; } 70% { box-shadow: 0 0 0 26px oklch(1 0 0 / 0); opacity: 0.3; } 100% { box-shadow: 0 0 0 0 oklch(1 0 0 / 0); opacity: 0; } }
""".strip())

layer(32, "progress-bar", "Download Progress Physics", "Spring-eased fill with shimmer head.", """
.ad-progress { position: relative; height: 6px; border-radius: 999px; background: var(--ad-surface-2); overflow: hidden; }
.ad-progress__fill {
  position: absolute; inset-block: 0; left: 0; width: var(--p, 0%);
  background: linear-gradient(90deg, oklch(0.7 0 0), var(--ad-fg));
  border-radius: 999px; transition: width 420ms var(--ad-ease-out);
}
.ad-progress__fill::after {
  content: ''; position: absolute; right: 0; top: 50%; width: 14px; height: 14px; border-radius: 50%;
  transform: translateY(-50%); background: var(--ad-fg); box-shadow: 0 0 14px 2px oklch(1 0 0 / 0.6);
}
.ad-progress--shimmer .ad-progress__fill { background-image: linear-gradient(100deg, transparent 20%, oklch(1 0 0 / 0.5) 50%, transparent 80%), linear-gradient(90deg, oklch(0.7 0 0), var(--ad-fg)); background-size: 200% 100%, 100% 100%; animation: shimmer-slide 1.4s linear infinite; }
@keyframes shimmer-slide { from { background-position: 120% 0, 0 0; } to { background-position: -80% 0, 0 0; } }
""".strip())

layer(33, "toast-island", "Dynamic Island Toast", "Morphing pill notification at bottom center.", """
.ad-island {
  position: fixed; bottom: 1.25rem; left: 50%; z-index: 70;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.55rem 1.1rem; border-radius: 999px;
  background: oklch(0.12 0 0 / 0.9); border: 1px solid var(--ad-line-strong);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 20px 50px -18px oklch(0 0 0 / 0.9);
  transform: translateX(-50%) translateY(140%); opacity: 0;
  transition: transform 0.7s var(--ad-ease-spring), opacity 0.4s ease;
}
.ad-island.is-up { transform: translateX(-50%) translateY(0); opacity: 1; }
.ad-island__pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--ad-fg); animation: island-pulse 1.2s ease-in-out infinite; }
@keyframes island-pulse { 50% { transform: scale(1.6); opacity: 0.5; } }
""".strip())

layer(34, "modal-cinematic", "Modal Cinematics", "App detail sheet with staged entrance.", """
.ad-modal { position: fixed; inset: 0; z-index: 80; display: grid; place-items: end center; pointer-events: none; }
.ad-modal__backdrop {
  position: absolute; inset: 0; background: oklch(0.05 0 0 / 0.7); backdrop-filter: blur(6px);
  opacity: 0; transition: opacity var(--ad-dur-slow) ease;
}
.ad-modal__panel {
  position: relative; width: min(46rem, 100%); max-height: 88vh; overflow-y: auto;
  border-radius: var(--ad-radius-2xl) var(--ad-radius-2xl) 0 0;
  background: oklch(0.13 0 0); border: 1px solid var(--ad-line); border-bottom: 0;
  transform: translateY(102%); transition: transform 0.6s var(--ad-ease-out);
  box-shadow: 0 -30px 80px -30px oklch(0 0 0 / 0.9);
}
@media (min-width: 760px) {
  .ad-modal { place-items: center; }
  .ad-modal__panel { border-radius: var(--ad-radius-2xl); border-bottom: 1px solid var(--ad-line); transform: translateY(40px) scale(0.97); }
}
.ad-modal.is-open { pointer-events: auto; }
.ad-modal.is-open .ad-modal__backdrop { opacity: 1; }
.ad-modal.is-open .ad-modal__panel { transform: none; }
""".strip())

layer(35, "tabs-underline", "Tabs With 3D Underline", "Sliding indicator tabs for app sheets.", """
.ad-tabs { position: relative; display: flex; gap: 1.5rem; border-bottom: 1px solid var(--ad-line); }
.ad-tab { padding: 0.7rem 0.1rem; font-size: 0.9rem; font-weight: 500; color: var(--ad-fg-dim); transition: color var(--ad-dur-fast) ease; }
.ad-tab.is-active { color: var(--ad-fg); }
.ad-tabs__ink { position: absolute; bottom: -1px; height: 2px; background: var(--ad-fg); box-shadow: 0 0 10px oklch(1 0 0 / 0.6); transition: left var(--ad-dur) var(--ad-ease-spring), width var(--ad-dur) var(--ad-ease-spring); }
""".strip())

layer(36, "switch-physics", "Physics Toggle Switch", "Springy knob switch for filters.", """
.ad-switch { position: relative; width: 3rem; height: 1.75rem; border-radius: 999px; background: var(--ad-surface-2); border: 1px solid var(--ad-line); transition: background var(--ad-dur) ease; }
.ad-switch[aria-checked="true"] { background: var(--ad-fg); }
.ad-switch__knob {
  position: absolute; top: 3px; left: 3px; width: calc(1.75rem - 8px); height: calc(1.75rem - 8px);
  border-radius: 50%; background: var(--ad-fg); box-shadow: 0 2px 6px oklch(0 0 0 / 0.5);
  transition: transform var(--ad-dur) var(--ad-ease-spring), background var(--ad-dur) ease;
}
.ad-switch[aria-checked="true"] .ad-switch__knob { transform: translateX(1.25rem); background: var(--ad-bg); }
""".strip())

layer(37, "marquee", "Infinite Marquee Strip", "Seamless scrolling trust logos.", """
.ad-marquee { overflow: hidden; position: relative; mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent); }
.ad-marquee__track { display: flex; gap: 3rem; width: max-content; animation: marquee-run 32s linear infinite; }
.ad-marquee:hover .ad-marquee__track { animation-play-state: paused; }
@keyframes marquee-run { to { transform: translateX(-50%); } }
.ad-marquee__item { display: inline-flex; align-items: center; gap: 0.6rem; font-family: var(--ad-font-mono); font-size: 0.8rem; color: var(--ad-fg-dim); white-space: nowrap; }
""".strip())

layer(38, "footer-luxury", "Luxury Footer", "Grid footer with glowing rule.", """
.ad-footer { position: relative; border-top: 1px solid var(--ad-line); padding-block: 4rem 2.5rem; background: linear-gradient(to bottom, transparent, oklch(0.07 0 0)); }
.ad-footer::before { content: ''; position: absolute; top: -1px; left: 20%; right: 20%; height: 1px; background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.5), transparent); filter: blur(0.5px); }
.ad-footer__grid { display: grid; gap: 2.5rem; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); }
.ad-footer__heading { font-family: var(--ad-font-mono); font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ad-fg-faint); margin-bottom: 1rem; }
.ad-footer__link { display: block; font-size: 0.88rem; color: var(--ad-fg-dim); padding-block: 0.3rem; transition: color var(--ad-dur-fast) ease, transform var(--ad-dur-fast) ease; }
.ad-footer__link:hover { color: var(--ad-fg); transform: translateX(4px); }
""".strip())

layer(39, "mobile-tabbar", "Mobile Tab Bar", "Floating bottom nav for small screens.", """
.ad-tabbar { position: fixed; bottom: 0; inset-inline: 0; z-index: 58; display: none; }
@media (max-width: 720px) { .ad-tabbar { display: block; } }
.ad-tabbar__inner { display: flex; justify-content: space-around; margin: 0 1rem 1rem; padding: 0.5rem; border-radius: 999px; background: oklch(0.11 0 0 / 0.85); border: 1px solid var(--ad-line); backdrop-filter: blur(16px); box-shadow: var(--ad-shadow-key); }
.ad-tabbar__item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 0.45rem 0.9rem; border-radius: 999px; font-size: 0.65rem; color: var(--ad-fg-dim); transition: all var(--ad-dur-fast) ease; }
.ad-tabbar__item.is-active { background: var(--ad-fg); color: var(--ad-bg); }
""".strip())

layer(40, "badge-chips", "Badges & Chips", "Verified, platform and category chips.", """
.ad-chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.22rem 0.65rem; border-radius: 999px; border: 1px solid var(--ad-line); font-family: var(--ad-font-mono); font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ad-fg-dim); }
.ad-chip--solid { background: var(--ad-fg); color: var(--ad-bg); border-color: transparent; }
.ad-chip--verified { border-color: var(--ad-line-strong); color: var(--ad-fg); }
.ad-chip--verified::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--ad-fg); box-shadow: 0 0 8px oklch(1 0 0 / 0.8); }
""".strip())

layer(41, "starfield-css", "CSS Starfield", "Parallax dot field behind the WebGL stage.", """
.ad-stars { position: fixed; inset: 0; z-index: -3; pointer-events: none; }
.ad-stars i {
  position: absolute; width: 2px; height: 2px; border-radius: 50%; background: oklch(1 0 0 / 0.7);
  animation: star-twinkle 4s ease-in-out infinite;
}
@keyframes star-twinkle { 50% { opacity: 0.15; transform: scale(0.6); } }
.ad-stars--near { transform: translate3d(calc(var(--px, 0) * -14px), calc(var(--py, 0) * -14px), 0); }
.ad-stars--far { transform: translate3d(calc(var(--px, 0) * -6px), calc(var(--py, 0) * -6px), 0); opacity: 0.5; }
""".strip())

layer(42, "aurora-wash", "Monochrome Aurora Wash", "Slow drifting light washes.", """
.ad-aurora { position: fixed; inset: -20%; z-index: -2; pointer-events: none; opacity: 0.5; filter: blur(80px); }
.ad-aurora i { position: absolute; display: block; border-radius: 50%; background: oklch(1 0 0 / 0.05); animation: aurora-drift 26s var(--ad-ease-in-out) infinite alternate; }
.ad-aurora i:nth-child(1) { width: 42vw; height: 42vw; left: 8%; top: 12%; }
.ad-aurora i:nth-child(2) { width: 34vw; height: 34vw; right: 6%; top: 40%; animation-delay: -8s; background: oklch(1 0 0 / 0.04); }
.ad-aurora i:nth-child(3) { width: 28vw; height: 28vw; left: 34%; bottom: 4%; animation-delay: -16s; }
@keyframes aurora-drift { to { transform: translate3d(8%, -10%, 0) scale(1.25); } }
""".strip())

layer(43, "grid-floor", "Perspective Grid Floor", "Tron-like floor lines under the hero.", """
.ad-gridfloor {
  position: absolute; inset-inline: -60%; bottom: -10%; height: 55vh; z-index: -1; pointer-events: none;
  background-image:
    linear-gradient(oklch(1 0 0 / 0.14) 1px, transparent 1px),
    linear-gradient(90deg, oklch(1 0 0 / 0.14) 1px, transparent 1px);
  background-size: 56px 56px;
  transform: perspective(420px) rotateX(66deg);
  mask-image: linear-gradient(to top, black, transparent 78%);
  animation: floor-scroll 9s linear infinite;
}
@keyframes floor-scroll { to { background-position: 0 56px, 0 0; } }
""".strip())

layer(44, "glow-ring", "Glow Rings & Halos", "Concentric pulsing halos for CTAs.", """
.glow-ring { position: relative; }
.glow-ring::before, .glow-ring::after {
  content: ''; position: absolute; inset: -8px; border-radius: inherit; pointer-events: none;
  border: 1px solid oklch(1 0 0 / 0.35); opacity: 0; animation: halo-out 3.2s var(--ad-ease-out) infinite;
}
.glow-ring::after { animation-delay: 1.6s; }
@keyframes halo-out { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }
""".strip())

layer(45, "focus-halo", "Focus Halo Ring", "Keyboard-visible focus treatment.", """
:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--ad-bg), 0 0 0 4px oklch(1 0 0 / 0.7), 0 0 22px 2px oklch(1 0 0 / 0.25); border-radius: inherit; }
.skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; padding: 0.8rem 1.2rem; background: var(--ad-fg); color: var(--ad-bg); border-radius: 0 0 0.8rem 0; font-weight: 600; }
.skip-link:focus { left: 0; }
""".strip())

layer(46, "selection", "Selection Highlight", "Monochrome ::selection styling.", """
::selection { background: oklch(0.97 0 0); color: oklch(0.1 0 0); }
.ad-quote { font-size: 1.4rem; line-height: 1.35; letter-spacing: -0.02em; }
.ad-quote cite { display: block; margin-top: 0.8rem; font-style: normal; font-family: var(--ad-font-mono); font-size: 0.75rem; color: var(--ad-fg-faint); }
""".strip())

layer(47, "scrollbar-luxury", "Luxury Scrollbar", "Slim custom scrollbar for sheets.", """
* { scrollbar-width: thin; scrollbar-color: oklch(1 0 0 / 0.25) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: oklch(1 0 0 / 0.18); border-radius: 999px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: oklch(1 0 0 / 0.4); background-clip: content-box; }
""".strip())

layer(48, "skeleton-shimmer", "Skeleton Shimmers", "Loading placeholders for cards.", """
.ad-skeleton { position: relative; overflow: hidden; background: var(--ad-surface); border-radius: 0.6rem; }
.ad-skeleton::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.08), transparent); animation: skel-run 1.6s var(--ad-ease-in-out) infinite; }
@keyframes skel-run { to { transform: translateX(100%); } }
.ad-skeleton--icon { width: 3rem; height: 3rem; border-radius: 0.85rem; }
.ad-skeleton--line { height: 0.75rem; }
.ad-skeleton--line.w-60 { width: 60%; } .ad-skeleton--line.w-40 { width: 40%; }
""".strip())

layer(49, "empty-states", "Empty States", "No-results panel art.", """
.ad-empty { display: grid; place-items: center; gap: 1rem; padding: 3rem 1.5rem; border: 1px dashed var(--ad-line-strong); border-radius: var(--ad-radius-xl); text-align: center; color: var(--ad-fg-dim); }
.ad-empty__glyph { width: 3.5rem; height: 3.5rem; border-radius: 50%; border: 1px solid var(--ad-line); display: grid; place-items: center; font-family: var(--ad-font-mono); animation: empty-float 4s ease-in-out infinite; }
@keyframes empty-float { 50% { transform: translateY(-8px); } }
""".strip())

layer(50, "divider-glow", "Glow Dividers", "Section breaks with traveling sparks.", """
.divider-glow { position: relative; height: 1px; background: var(--ad-line); overflow: visible; }
.divider-glow::after { content: ''; position: absolute; top: -1px; left: 0; width: 25%; height: 3px; background: linear-gradient(90deg, transparent, var(--ad-fg), transparent); filter: blur(1px); animation: spark-travel 6s var(--ad-ease-in-out) infinite; }
@keyframes spark-travel { 0% { left: -25%; } 100% { left: 100%; } }
""".strip())

layer(51, "feature-grid", "Feature Bento Grid", "Asymmetric bento layout for site features.", """
.bento { display: grid; gap: 1rem; grid-template-columns: repeat(6, 1fr); grid-auto-rows: minmax(9rem, auto); }
.bento > .b-span2 { grid-column: span 2; } .bento > .b-span3 { grid-column: span 3; } .bento > .b-span4 { grid-column: span 4; } .bento > .b-span6 { grid-column: span 6; }
.bento > .b-row2 { grid-row: span 2; }
.bento__cell { position: relative; padding: 1.4rem; border-radius: var(--ad-radius-lg); border: 1px solid var(--ad-line); background: var(--ad-surface); overflow: hidden; transition: border-color var(--ad-dur) ease, transform var(--ad-dur) var(--ad-ease-out); }
.bento__cell:hover { border-color: var(--ad-line-strong); }
@media (max-width: 900px) { .bento { grid-template-columns: repeat(2, 1fr); } .bento > .b-span3, .bento > .b-span4, .bento > .b-span6 { grid-column: span 2; } }
""".strip())

layer(52, "orbit-system", "Orbit System", "CSS planets orbiting a product core.", """
.orbit { position: relative; width: min(26rem, 80vw); aspect-ratio: 1; margin-inline: auto; }
.orbit__path { position: absolute; inset: 0; margin: auto; border: 1px dashed var(--ad-line); border-radius: 50%; animation: orbit-spin var(--t, 18s) linear infinite; }
.orbit__path--2 { width: 70%; height: 70%; --t: 13s; animation-direction: reverse; }
.orbit__path--3 { width: 40%; height: 40%; --t: 9s; }
.orbit__sat { position: absolute; top: -14px; left: 50%; width: 28px; height: 28px; margin-left: -14px; border-radius: 50%; background: var(--ad-fg); box-shadow: 0 0 16px oklch(1 0 0 / 0.6); }
.orbit__core { position: absolute; inset: 0; margin: auto; width: 34%; height: 34%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, oklch(0.9 0 0), oklch(0.2 0 0) 70%); box-shadow: 0 0 60px oklch(1 0 0 / 0.25); }
@keyframes orbit-spin { to { transform: rotate(360deg); } }
""".strip())

layer(53, "terminal-window", "Terminal Window", "Fake terminal typing the scan log.", """
.ad-terminal { border-radius: var(--ad-radius); border: 1px solid var(--ad-line); background: oklch(0.07 0 0); overflow: hidden; font-family: var(--ad-font-mono); font-size: 0.78rem; }
.ad-terminal__bar { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--ad-line); }
.ad-terminal__dot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--ad-line-strong); }
.ad-terminal__body { padding: 1rem; min-height: 11rem; line-height: 1.8; color: var(--ad-fg-dim); }
.ad-terminal__body b { color: var(--ad-fg); font-weight: 600; }
.ad-caret { display: inline-block; width: 8px; height: 1em; background: var(--ad-fg); vertical-align: -2px; animation: caret-blink 1s steps(1) infinite; }
@keyframes caret-blink { 50% { opacity: 0; } }
""".strip())

layer(54, "device-frame", "Device Frames", "Phone/laptop frames for showcase.", """
.device-phone { width: 15rem; aspect-ratio: 9/19; border-radius: 2.4rem; border: 6px solid oklch(0.2 0 0); background: var(--ad-bg-deep); box-shadow: 0 40px 80px -30px oklch(0 0 0 / 0.9), inset 0 0 0 1px oklch(1 0 0 / 0.12); position: relative; overflow: hidden; }
.device-phone::before { content: ''; position: absolute; top: 0.7rem; left: 50%; transform: translateX(-50%); width: 30%; height: 1rem; border-radius: 999px; background: oklch(0.12 0 0); }
.device-laptop { width: 100%; max-width: 30rem; aspect-ratio: 16/10; border-radius: 0.8rem 0.8rem 0 0; border: 6px solid oklch(0.2 0 0); border-bottom-width: 10px; background: var(--ad-bg-deep); position: relative; }
.device-screen-glow { position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 0%, oklch(1 0 0 / 0.08), transparent 70%); }
""".strip())

layer(55, "tilt-scene", "Scene Parallax Layers", "Mouse-parallax depth layers.", """
.parallax-layer { will-change: transform; transition: transform 120ms linear; }
.pl-fast { --depth: 26; } .pl-med { --depth: 14; } .pl-slow { --depth: 6; }
@media (prefers-reduced-motion: reduce) { .parallax-layer { transform: none !important; } }
""".strip())

layer(56, "kinetic-type", "Kinetic Headline FX", "Letter-split hover wave.", """
.kinetic span { display: inline-block; transition: transform var(--ad-dur) var(--ad-ease-spring); transition-delay: calc(var(--i, 0) * 22ms); }
.kinetic:hover span { transform: translateY(-0.14em) rotate(-2deg); }
.kinetic-wave span { animation: kwave 2.8s ease-in-out infinite; animation-delay: calc(var(--i, 0) * 90ms); }
@keyframes kwave { 50% { transform: translateY(-0.12em); } }
""".strip())

layer(57, "outline-text", "Outline Display Text", "Hollow stroke giant text.", """
.text-outline { color: transparent; -webkit-text-stroke: 1px oklch(1 0 0 / 0.4); }
.text-outline--thick { -webkit-text-stroke: 2px oklch(1 0 0 / 0.25); }
.text-outline:hover { color: oklch(1 0 0 / 0.06); }
""".strip())

layer(58, "ticker-numbers", "Live Stat Ticker", "Vertical number ticker rows.", """
.ticker { height: 1.4em; overflow: hidden; position: relative; display: inline-block; vertical-align: bottom; }
.ticker__col { display: flex; flex-direction: column; animation: tick-roll 8s var(--ad-ease-in-out) infinite; }
@keyframes tick-roll { 0%, 18% { transform: translateY(0); } 25%, 43% { transform: translateY(-100%); } 50%, 68% { transform: translateY(-200%); } 75%, 93% { transform: translateY(-300%); } 100% { transform: translateY(0); } }
.ticker__col > span { height: 1.4em; line-height: 1.4em; }
""".strip())

layer(59, "waveform", "Scan Waveform Bars", "Audio-like bars during virus scan.", """
.waveform { display: flex; align-items: flex-end; gap: 3px; height: 3rem; }
.waveform i { flex: 1; background: linear-gradient(to top, oklch(1 0 0 / 0.25), var(--ad-fg)); border-radius: 2px; animation: wbar 1.1s ease-in-out infinite alternate; animation-delay: calc(var(--i, 0) * -70ms); transform-origin: bottom; }
@keyframes wbar { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }
""".strip())

layer(60, "checkmark-draw", "SVG Check Draw", "Self-drawing verified checkmark.", """
.check-draw path { stroke-dasharray: 48; stroke-dashoffset: 48; }
.check-draw.is-on path { animation: draw-check 0.7s var(--ad-ease-out) forwards; }
@keyframes draw-check { to { stroke-dashoffset: 0; } }
.check-draw circle { stroke-dasharray: 166; stroke-dashoffset: 166; }
.check-draw.is-on circle { animation: draw-check 0.9s var(--ad-ease-out) forwards; }
""".strip())

layer(61, "lockup-stats", "Stat Lockup Row", "Horizontal stat band styling.", """
.statband { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1px; background: var(--ad-line); border: 1px solid var(--ad-line); border-radius: var(--ad-radius-lg); overflow: hidden; }
.statband > div { background: var(--ad-bg); padding: 1.6rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem; transition: background var(--ad-dur) ease; }
.statband > div:hover { background: var(--ad-surface); }
""".strip())

layer(62, "testimonial", "Testimonial Cards", "Quote cards with avatar coins.", """
.ad-quote-card { padding: 1.5rem; border-radius: var(--ad-radius-lg); border: 1px solid var(--ad-line); background: var(--ad-surface); display: flex; flex-direction: column; gap: 1rem; }
.ad-quote-card p { font-size: 0.95rem; color: var(--ad-fg); line-height: 1.6; }
.ad-quote-card footer { display: flex; align-items: center; gap: 0.7rem; font-size: 0.8rem; color: var(--ad-fg-dim); }
""".strip())

layer(63, "pricing-free", "Free Badge Burst", "Price tag with radiating spokes.", """
.free-burst { position: relative; display: grid; place-items: center; width: 8.5rem; height: 8.5rem; }
.free-burst::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(oklch(1 0 0 / 0.12) 0deg 6deg, transparent 6deg 12deg); animation: burst-spin 24s linear infinite; }
.free-burst__core { position: relative; width: 6rem; height: 6rem; border-radius: 50%; background: var(--ad-fg); color: var(--ad-bg); display: grid; place-items: center; font-weight: 700; letter-spacing: -0.03em; box-shadow: 0 0 40px oklch(1 0 0 / 0.35); }
@keyframes burst-spin { to { transform: rotate(360deg); } }
""".strip())

layer(64, "cta-band", "CTA Band Finale", "Closing call-to-action slab.", """
.cta-band { position: relative; overflow: hidden; border-radius: var(--ad-radius-2xl); border: 1px solid var(--ad-line-strong); padding: clamp(2.5rem, 6vw, 5rem); text-align: center; background: radial-gradient(120% 140% at 50% 0%, oklch(0.22 0 0), oklch(0.08 0 0) 70%); }
.cta-band::after { content: ''; position: absolute; inset-inline: 0; bottom: 0; height: 40%; background: linear-gradient(to top, oklch(1 0 0 / 0.06), transparent); }
.cta-band .ad-display { position: relative; z-index: 1; }
""".strip())

layer(65, "qr-panel", "QR Download Panel", "Pixel QR placeholder card.", """
.qr-card { display: grid; gap: 1rem; place-items: center; padding: 1.5rem; border-radius: var(--ad-radius-xl); border: 1px solid var(--ad-line); background: var(--ad-surface); }
.qr-code { width: 9rem; height: 9rem; background:
  conic-gradient(var(--ad-fg) 25%, transparent 0 50%, var(--ad-fg) 0 75%, transparent 0) 0 0 / 1.5rem 1.5rem,
  var(--ad-bg); border: 6px solid var(--ad-fg); image-rendering: pixelated; }
""".strip())

layer(66, "step-arrows", "Directional Arrow Bounce", "Scroll hint arrows.", """
.arrow-bounce { animation: abounce 2s var(--ad-ease-in-out) infinite; }
@keyframes abounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(10px); opacity: 1; } }
.scroll-hint { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.4rem; font-family: var(--ad-font-mono); font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ad-fg-faint); }
""".strip())

layer(67, "preloader", "Preloader Curtain", "Boot curtain with progress percent.", """
#ad-preloader { position: fixed; inset: 0; z-index: 999; display: grid; place-items: center; background: var(--ad-bg-deep); transition: opacity 0.8s ease, visibility 0.8s; }
#ad-preloader.is-done { opacity: 0; visibility: hidden; }
.preloader__pct { font-family: var(--ad-font-mono); font-size: 3rem; letter-spacing: -0.04em; }
.preloader__bar { width: min(20rem, 60vw); height: 2px; background: var(--ad-line); margin-top: 1.2rem; overflow: hidden; }
.preloader__bar i { display: block; height: 100%; width: 0%; background: var(--ad-fg); transition: width 0.3s ease; }
""".strip())

layer(68, "cursor-dot", "Custom Cursor Dot", "Ring + dot hybrid cursor.", """
.ad-cursor-dot, .ad-cursor-ring { position: fixed; top: 0; left: 0; z-index: 900; pointer-events: none; border-radius: 50%; translate: -50% -50%; }
.ad-cursor-dot { width: 6px; height: 6px; background: var(--ad-fg); }
.ad-cursor-ring { width: 34px; height: 34px; border: 1px solid oklch(1 0 0 / 0.45); transition: width 0.25s ease, height 0.25s ease, background 0.25s ease; }
.ad-cursor-ring.is-hot { width: 52px; height: 52px; background: oklch(1 0 0 / 0.08); }
@media (hover: none) { .ad-cursor-dot, .ad-cursor-ring { display: none; } }
""".strip())

layer(69, "code-highlight", "Code Block Styling", "Hash-checked installer snippet look.", """
.ad-code { font-family: var(--ad-font-mono); font-size: 0.8rem; background: oklch(0.07 0 0); border: 1px solid var(--ad-line); border-radius: 0.7rem; padding: 1rem 1.2rem; color: var(--ad-fg-dim); overflow-x: auto; }
.ad-code .k { color: var(--ad-fg); font-weight: 600; }
.ad-code .c { color: var(--ad-fg-faint); font-style: italic; }
""".strip())

layer(70, "shield-badge", "Shield Verified Badge", "Pulsing shield emblem.", """
.shield { position: relative; display: grid; place-items: center; width: 4.5rem; height: 4.5rem; }
.shield svg { position: relative; z-index: 1; }
.shield::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: oklch(1 0 0 / 0.08); animation: shield-pulse 2.6s var(--ad-ease-out) infinite; }
@keyframes shield-pulse { 0% { transform: scale(0.7); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
""".strip())

layer(71, "timeline-vertical", "Version Timeline", "Release timeline spine.", """
.timeline { position: relative; padding-left: 2rem; }
.timeline::before { content: ''; position: absolute; left: 7px; top: 6px; bottom: 6px; width: 1px; background: linear-gradient(var(--ad-fg), var(--ad-line) 30%, var(--ad-line)); }
.timeline__item { position: relative; padding-bottom: 1.8rem; }
.timeline__item::before { content: ''; position: absolute; left: -2rem; top: 6px; width: 15px; height: 15px; border-radius: 50%; border: 2px solid var(--ad-fg); background: var(--ad-bg); }
.timeline__ver { font-family: var(--ad-font-mono); font-size: 0.75rem; color: var(--ad-fg-faint); }
""".strip())

layer(72, "chip-cloud", "Tag Cloud Scatter", "Scattered tech tags.", """
.chipcloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chipcloud .ad-chip { transform: rotate(var(--rot, 0deg)); transition: transform var(--ad-dur) var(--ad-ease-spring); }
.chipcloud .ad-chip:hover { transform: rotate(0deg) scale(1.08); }
""".strip())

layer(73, "image-duotone", "Duotone Imagery", "Force grayscale + contrast grade.", """
.duotone { filter: grayscale(1) contrast(1.15) brightness(0.95); }
.duotone--lift { filter: grayscale(1) contrast(1.3) brightness(1.05); }
img { user-select: none; -webkit-user-drag: none; }
""".strip())

layer(74, "hairline-table", "Spec Table Hairlines", "Comparison table rules.", """
.ad-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.ad-table th, .ad-table td { text-align: left; padding: 0.8rem 1rem; border-bottom: 1px solid var(--ad-line); }
.ad-table th { font-family: var(--ad-font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--ad-fg-faint); }
.ad-table tr:hover td { background: var(--ad-surface); }
""".strip())

layer(75, "accordion", "FAQ Accordion", "Smooth open/close rows.", """
.ad-acc { border-bottom: 1px solid var(--ad-line); }
.ad-acc__q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.1rem 0.2rem; font-size: 1rem; font-weight: 500; text-align: left; }
.ad-acc__icon { transition: transform var(--ad-dur) var(--ad-ease-out); flex-shrink: 0; }
.ad-acc.is-open .ad-acc__icon { transform: rotate(45deg); }
.ad-acc__a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--ad-dur) var(--ad-ease-out); }
.ad-acc.is-open .ad-acc__a { grid-template-rows: 1fr; }
.ad-acc__a > div { overflow: hidden; }
.ad-acc__a p { padding-bottom: 1.2rem; color: var(--ad-fg-dim); font-size: 0.92rem; }
""".strip())

layer(76, "banner-tape", "Caution Tape Banner", "Diagonal stripe announcement tape.", """
.tape { --stripe: repeating-linear-gradient(-45deg, oklch(1 0 0 / 0.9) 0 12px, oklch(0.1 0 0) 12px 24px); height: 26px; background-image: var(--stripe); animation: tape-run 1.6s linear infinite; }
@keyframes tape-run { to { background-position: 34px 0; } }
""".strip())

layer(77, "halftone", "Halftone Dots", "Dot-matrix texture panels.", """
.halftone { background-image: radial-gradient(oklch(1 0 0 / 0.18) 1px, transparent 1.4px); background-size: 10px 10px; }
.halftone--soft { background-image: radial-gradient(oklch(1 0 0 / 0.08) 1px, transparent 1.4px); }
""".strip())

layer(78, "border-beam", "Animated Border Beam", "Traveling light along card borders.", """
.beam-card { position: relative; }
.beam-card::before {
  content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px;
  background: conic-gradient(from var(--beam, 0deg), transparent 0 70%, oklch(1 0 0 / 0.9) 78%, transparent 86%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: beam-rot 5s linear infinite; pointer-events: none;
}
@property --beam { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes beam-rot { to { --beam: 360deg; } }
""".strip())

layer(79, "glitch", "Glitch Flicker", "Subtle text glitch on hover.", """
.glitch { position: relative; }
.glitch:hover { animation: glitch-skew 0.4s steps(2) 1; }
@keyframes glitch-skew { 25% { transform: skewX(4deg) translateX(-2px); } 50% { transform: skewX(-3deg) translateX(2px); } 75% { transform: skewX(1deg); } }
.glitch::selection { background: oklch(0.5 0 0); }
""".strip())

layer(80, "float-idle", "Idle Float Loop", "Weightless hovering for device mockups.", """
.float-idle { animation: floaty 6s var(--ad-ease-in-out) infinite; }
.float-idle--slow { animation-duration: 8s; animation-delay: -2s; }
@keyframes floaty { 50% { transform: translateY(-14px) rotate(-0.6deg); } }
""".strip())

layer(81, "shadow-depth", "Elevation Shadows", "Layered depth shadow utilities.", """
.elev-1 { box-shadow: 0 2px 6px -2px oklch(0 0 0 / 0.6); }
.elev-2 { box-shadow: 0 10px 24px -8px oklch(0 0 0 / 0.7); }
.elev-3 { box-shadow: 0 26px 60px -18px oklch(0 0 0 / 0.85); }
.elev-inset { box-shadow: inset 0 2px 12px oklch(0 0 0 / 0.6); }
""".strip())

layer(82, "radius-scale", "Radius Scale Utilities", "Consistent rounding tokens.", """
.r-sm { border-radius: var(--ad-radius-sm); } .r-md { border-radius: var(--ad-radius); } .r-lg { border-radius: var(--ad-radius-lg); } .r-xl { border-radius: var(--ad-radius-xl); } .r-2xl { border-radius: var(--ad-radius-2xl); } .r-full { border-radius: 999px; }
""".strip())

layer(83, "spacing-utils", "Spacing Utilities", "Gap/padding helpers.", """
.gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; } .gap-8 { gap: 2rem; } .gap-10 { gap: 2.5rem; }
.mt-a { margin-top: auto; } .center-x { margin-inline: auto; } .w-full { width: 100%; } .maxw-prose { max-width: 60ch; }
""".strip())

layer(84, "flex-utils", "Flex Utilities", "Alignment helpers.", """
.flex { display: flex; } .inline-flex { display: inline-flex; } .flex-col { flex-direction: column; } .flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; } .items-end { align-items: flex-end; } .justify-between { justify-content: space-between; } .justify-center { justify-content: center; }
.grid { display: grid; } .place-center { place-items: center; } .relative { position: relative; } .overflow-hidden { overflow: hidden; }
""".strip())

layer(85, "text-utils", "Text Utilities", "Sizes, weights, colors, alignment.", """
.text-dim { color: var(--ad-fg-dim); } .text-faint { color: var(--ad-fg-faint); } .text-white { color: var(--ad-fg); }
.text-xs { font-size: 0.75rem; } .text-sm { font-size: 0.875rem; } .text-lg { font-size: 1.125rem; }
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; } .text-center { text-align: center; } .tracking-wide { letter-spacing: 0.08em; }
""".strip())

layer(86, "media-breakpoints", "Responsive Breakpoints", "Adaptive section behavior.", """
@media (max-width: 640px) { .ad-hero { align-items: flex-end; } .hide-sm { display: none; } }
@media (min-width: 641px) { .only-sm { display: none !important; } }
@media (max-width: 1024px) { .ad-section { padding-block: 4rem; } }
@media (min-width: 1400px) { .ad-container { max-width: 82rem; } }
""".strip())

layer(87, "print-sheet", "Print Styles", "Clean print fallback for the ad.", """
@media print {
  #ad-stage, .ad-grain, .ad-aurora, .ad-stars, .ad-scanlines, .ad-cursor-dot, .ad-cursor-ring, #ad-preloader { display: none !important; }
  body { background: #fff; color: #000; }
  .ad-glass, .ad-card { border: 1px solid #999; background: #fff; }
}
""".strip())

layer(88, "reduced-motion", "Reduced Motion", "Respect prefers-reduced-motion globally.", """
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  .animate-rise, .fade-up, .stagger > * { opacity: 1 !important; transform: none !important; }
}
""".strip())

layer(89, "high-contrast", "High Contrast Mode", "Forced-colors adjustments.", """
@media (forced-colors: active) {
  .ad-card, .ad-glass, .btn-primary, .btn-ghost { border: 1px solid CanvasText; }
  .ad-grain, .ad-aurora, .ad-scanlines { display: none; }
}
""".strip())

layer(90, "a11y-visually-hidden", "Accessibility Helpers", "SR-only and aria utilities.", """
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
[aria-live] { position: relative; }
[data-anim]:not(.no-anim) { }
""".strip())

layer(91, "z-index-map", "Z-Index Map", "Canonical stacking order.", """
:root { --z-stage: -2; --z-content: 1; --z-header: 50; --z-island: 70; --z-modal: 80; --z-cursor: 900; --z-loader: 999; }
""".strip())

layer(92, "willpower-perf", "Performance Guards", "Compositing hints and paint containment.", """
.ad-card, .ad-island, .ad-header, .parallax-layer, [data-magnetic] { contain: layout paint style; }
.gpu { transform: translateZ(0); backface-visibility: hidden; }
body.no-webgl #ad-stage { display: none; }
""".strip())

layer(93, "dark-contrast-grade", "Contrast Grading", "Global tone curve via overlays.", """
.ad-grade { position: fixed; inset: 0; z-index: -1; pointer-events: none; background: linear-gradient(180deg, oklch(0 0 0 / 0.35), transparent 30%, transparent 70%, oklch(0 0 0 / 0.5)); }
""".strip())

layer(94, "section-labels", "Section Label Rails", "Numbered side labels per section.", """
.section-label { position: absolute; left: -3.2rem; top: 0; writing-mode: vertical-rl; font-family: var(--ad-font-mono); font-size: 0.68rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ad-fg-faint); }
@media (max-width: 1100px) { .section-label { display: none; } }
""".strip())

layer(95, "anchor-flash", "Anchor Arrival Flash", "Highlight pulse when jumping to sections.", """
@keyframes anchor-flash { 0% { box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.5); } 100% { box-shadow: inset 0 0 0 1px transparent; } }
.ad-section:target { animation: anchor-flash 1.4s var(--ad-ease-out); border-radius: var(--ad-radius-lg); }
""".strip())

layer(96, "final-polish", "Final Polish", "Micro details: hyphens, orphans, ligatures.", """
html { hyphens: manual; }
p, li { orphans: 3; widows: 3; }
body { font-variant-ligatures: common-ligatures contextual; font-kerning: normal; }
.ad-display em { font-style: normal; font-family: var(--ad-font-mono); font-size: 0.55em; vertical-align: 0.4em; color: var(--ad-fg-dim); }
""".strip())

HEADER = """/* =============================================================
   PIKSTORE AD — UI Foundry Layer {num:02d}: {title}
   Strict monochrome (black/white/greys only). Part of 96 layers.
   Purpose: {desc}
   ============================================================= */
"""

for num, slug, title, desc, body in CSS_LAYERS:
    path = os.path.join(CSS_DIR, f"{num:02d}-{slug}.css")
    with open(path, "w") as f:
        f.write(HEADER.format(num=num, title=title, desc=desc))
        f.write("\n" + body + "\n")

print("css files:", len(CSS_LAYERS))

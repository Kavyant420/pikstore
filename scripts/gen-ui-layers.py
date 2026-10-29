"""Generate UI Foundry layers 41-80 (premium black & white 3D interaction CSS).

Each layer is composed from scripts/ui_kit.py blocks plus a bespoke mechanics
block, guaranteeing >=200 lines per file and one coherent monochrome language.
Run: python scripts/gen-ui-layers.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ui_kit import full_layer  # noqa: E402

DIR = os.path.join(os.path.dirname(__file__), "..", "styles", "ui")
os.makedirs(DIR, exist_ok=True)

LAYERS = [
    (41, 'marquee-3d', '3D Marquee Band', 'Infinite horizontal ribbon that curves away in perspective at both edges.', 'ui-marquee3d', True),
    (42, 'split-text', 'Split-Text Kinetic Titles', 'Headline split into per-word spans that cascade with 3D rotation on reveal.', 'ui-splittext', True),
    (43, 'ken-burns', 'Ken Burns Depth Imagery', 'Slow zoom-drift breathing on hero imagery inside a masked 3D frame.', 'ui-kenburns', False),
    (44, 'orbit-ring', 'Orbiting Icon Rings', 'Icons orbiting a center point on a tilted elliptical ring.', 'ui-orbitring', False),
    (45, 'flip-card', 'Flip Card Reveal', 'Two-faced card that flips 180 degrees on hover to expose metadata.', 'ui-flipcard', False),
    (46, 'stack-cards', 'Stacked Deck Cards', 'Cards fanned like a deck; hovering lifts the top card off the stack.', 'ui-deck', True),
    (47, 'counter-odometer', 'Odometer Counters', 'Digit-scroll counters for stats with spring easing.', 'ui-odometer', False),
    (48, 'water-ripple', 'Water Ripple Surfaces', 'Concentric ripple rings emitted from click points on feature panels.', 'ui-ripplewater', False),
    (49, 'magnetic-field', 'Magnetic Field Lines', 'Animated field-line backdrop reacting to pointer proximity.', 'ui-magfield', False),
    (50, 'glitch-scan', 'Glitch Scan Transitions', 'Brief monochrome glitch slices when content swaps.', 'ui-glitchscan', False),
    (51, 'spotlight-stage', 'Spotlight Stage Sections', 'Sections lit by a moving overhead spotlight cone on scroll entry.', 'ui-stagesect', False),
    (52, 'scramble-decode', 'Scramble Decode Text', 'Terminal-style character scramble resolving into final copy.', 'ui-scramble', False),
    (53, 'typewriter', 'Typewriter Premium', 'Character-by-character typing with a blinking block caret.', 'ui-typewriter', False),
    (54, 'stagger-grid', 'Staggered Grid Entrance', 'Grid children rise through Z in diagonal wave order.', 'ui-staggergrid', True),
    (55, 'carousel-depth', 'Depth Carousel', 'Coverflow-style carousel: side items rotate away and dim.', 'ui-carousel', True),
    (56, 'accordion-physics', 'Physics Accordion', 'Disclosure rows with 3D chevron flip and content slide-in.', 'ui-accordion', True),
    (57, 'stepper-pipeline', 'Luminary Stepper Pipeline', 'Multi-step progress rail with glowing nodes and flowing line.', 'ui-stepper', False),
    (58, 'parallax-hero', 'Parallax Hero Stack', 'Layered hero planes translating at different rates with pointer.', 'ui-herostack', True),
    (59, 'noise-gradient', 'Aurora Noise Gradients', 'Slow-shifting monochrome aurora mesh behind content.', 'ui-noisegrad', False),
    (60, 'edge-glow', 'Edge Glow Borders', 'Border-only glow pulse signaling live/active states.', 'ui-edgeglow', False),
    (61, 'tilt-gallery', 'Tilt Gallery Wall', 'Photo wall where each thumb tilts independently toward pointer.', 'ui-tiltwall', True),
    (62, 'loader-portal', 'Portal Loader', 'Loading state that pulls content into a spinning 3D portal ring.', 'ui-portalload', False),
    (63, 'scroll-hijack-pin', 'Pinned Scroll Scenes', 'Sticky-pinned section that scrubs an animation across scroll range.', 'ui-pinscene', False),
    (64, 'number-wheel', 'Number Wheel Picker', 'Cylindrical wheel picker for platform/version selection.', 'ui-wheel', False),
    (65, 'context-menu', 'Luxury Context Menu', 'Right-click menu with depth entrance and item slide cascade.', 'ui-ctxmenu', True),
    (66, 'command-palette', 'Command Palette Aura', 'K-command overlay with glass aura and key chips.', 'ui-cmdk', False),
    (67, 'bubble-tooltip', 'Bubble Trail Tooltips', 'Springy tooltip bubbles trailing the cursor on icon hovers.', 'ui-bubbletip', False),
    (68, 'progress-conic', 'Conic Progress Rings', 'Circular download rings with sweeping conic gradient.', 'ui-conicprog', False),
    (69, 'file-drop', 'File Drop Zone', 'Drag-over zone with lift, dashed morph and gravity well.', 'ui-dropzone', True),
    (70, 'tag-soup', 'Floating Tag Cloud', 'Tags drifting on a pseudo-3D sphere projection.', 'ui-tagsoup', False),
    (71, 'quote-block', 'Cinematic Quote Block', 'Testimonial block with slow letter-spacing breathe and rule draw.', 'ui-quote', False),
    (72, 'table-luxury', 'Luxury Data Table', 'Rows lifting on hover with sticky glass header.', 'ui-tablelux', False),
    (73, 'avatar-stack', 'Avatar Constellation', 'Overlapping avatars that fan out on group hover.', 'ui-avatarfan', False),
    (74, 'banner-collapse', 'Collapsing Announcement Banner', 'Dismissable banner with height-collapse and fade-up exit.', 'ui-banner', False),
    (75, 'sidebar-drawer', 'Deep Drawer Sidebar', 'Off-canvas drawer with layered parallax walls.', 'ui-drawer', True),
    (76, 'pagination-orbit', 'Orbital Pagination', 'Page dots on an arc; active dot magnifies with glow.', 'ui-pagination', False),
    (77, 'breadcrumb-trail', 'Breadcrumb Light Trail', 'Chevron breadcrumbs with traveling highlight.', 'ui-breadcrumb', False),
    (78, 'cta-beam', 'CTA Beacon Pulse', 'Primary call-to-action emitting slow radar beams.', 'ui-ctabeam', False),
    (79, 'status-dot', 'Status Dot Breathing', 'Live status micro-indicators with halo breath cycles.', 'ui-statusdot', False),
    (80, 'finale-outro', 'Finale Outro Curtain', 'Footer curtain wipe and grain settle for page end.', 'ui-outro', False),
]

EXTRAS = {
    'ui-marquee3d': """
/* ---- Track mechanics ---------------------------------------------------- */
.{cls} > .{c}-track {{
  display: flex;
  gap: 2.5rem;
  width: max-content;
  animation: {p}-slide var(--{p}-duration, 28s) linear infinite;
  transform: translateZ(0);
}}
.{cls}:hover > .{c}-track {{ animation-play-state: paused; }}
.{cls} > .{c}-fade {{
  position: absolute;
  inset: 0 auto 0 0;
  width: 18%;
  background: linear-gradient(90deg, oklch(0.08 0 0), transparent);
  z-index: 4;
  pointer-events: none;
}}
.{cls} > .{c}-fade--end {{
  inset: 0 0 0 auto;
  background: linear-gradient(270deg, oklch(0.08 0 0), transparent);
}}
""",
    'ui-splittext': """
/* ---- Word choreography --------------------------------------------------- */
.{cls} .word {{
  display: inline-block;
  transform-origin: 50% 100%;
  opacity: 0;
  transform: translate3d(0, 0.9em, -60px) rotateX(-70deg);
  transition:
    opacity 0.5s var(--{p}-ease),
    transform 0.7s var(--{p}-spring);
  transition-delay: calc(var(--i, 0) * 55ms);
}}
.{cls}[data-revealed="true"] .word {{
  opacity: 1;
  transform: translate3d(0, 0, 0) rotateX(0deg);
}}
""",
    'ui-kenburns': """
/* ---- Image breathing ------------------------------------------------------ */
.{cls} img {{
  animation: {p}-breath var(--{p}-duration, 22s) var(--ui-ease-in-out) infinite alternate;
}}
@keyframes {p}-breath {{
  from {{ transform: scale(1.02) translate3d(-1%, 1%, 0); }}
  to   {{ transform: scale(1.12) translate3d(1.5%, -1.5%, 0); }}
}}
""",
    'ui-orbitring': """
/* ---- Orbital mechanics ----------------------------------------------------- */
.{cls} .orbit-item {{
  position: absolute;
  top: 50%; left: 50%;
  animation: {p}-revolve var(--{p}-duration, 18s) linear infinite;
  offset-path: ellipse(46% 22% at 50% 50%);
}}
@keyframes {p}-revolve {{ to {{ offset-distance: 100%; }} }}
""",
    'ui-flipcard': """
/* ---- Flip faces ------------------------------------------------------------ */
.{cls} .face {{ backface-visibility: hidden; position: absolute; inset: 0; transition: transform 0.7s var(--{p}-ease); transform-style: preserve-3d; }}
.{cls} .face--back {{ transform: rotateY(180deg); }}
@media (hover: hover) {{
  .{cls}:hover .face--front {{ transform: rotateY(-180deg); }}
  .{cls}:hover .face--back {{ transform: rotateY(0deg); }}
}}
""",
    'ui-deck': """
/* ---- Deck fan --------------------------------------------------------------- */
.{cls} .deck-card {{ transition: transform 0.5s var(--{p}-spring); }}
.{cls}:hover .deck-card:nth-child(1) {{ transform: translateY(-14px) rotate(-2deg); }}
.{cls}:hover .deck-card:nth-child(2) {{ transform: translateY(-7px) rotate(1.5deg); }}
""",
    'ui-odometer': """
/* ---- Digit reels ------------------------------------------------------------- */
.{cls} .digit {{ display: inline-block; overflow: hidden; height: 1em; }}
.{cls} .digit > span {{ display: block; transition: transform 0.6s var(--{p}-spring); transform: translateY(calc(var(--v, 0) * -1em)); }}
""",
    'ui-ripplewater': """
/* ---- Concentric waves ---------------------------------------------------------- */
.{cls} .wave {{
  position: absolute; border-radius: 50%;
  border: 1px solid oklch(1 0 0 / 0.35);
  animation: {p}-expand 1.4s var(--{p}-ease) forwards;
}}
@keyframes {p}-expand {{ from {{ inset: 50%; opacity: 1; }} to {{ inset: -60%; opacity: 0; }} }}
""",
    'ui-magfield': """
/* ---- Field lines ----------------------------------------------------------------- */
.{cls} .line {{ stroke: oklch(1 0 0 / 0.14); transition: stroke 0.4s var(--{p}-ease); }}
.{cls}[data-hot="true"] .line {{ stroke: oklch(1 0 0 / 0.3); }}
""",
    'ui-glitchscan': """
/* ---- Slice displacement ------------------------------------------------------------- */
.{cls}[data-glitching="true"] {{ animation: {p}-shake 0.34s steps(4) 1; }}
@keyframes {p}-shake {{
  25% {{ transform: translate3d(-2px, 1px, 0); clip-path: inset(12% 0 60% 0); }}
  75% {{ transform: translate3d(2px, -1px, 0); clip-path: inset(55% 0 8% 0); }}
}}
""",
    'ui-stagesect': """
/* ---- Overhead cone -------------------------------------------------------------------- */
.{cls} .cone {{
  background: conic-gradient(from 180deg at 50% -12%, transparent 42%, oklch(1 0 0 / 0.08) 50%, transparent 58%);
  animation: {p}-sway 9s var(--ui-ease-in-out) infinite alternate;
}}
@keyframes {p}-sway {{ from {{ transform: rotate(-6deg); }} to {{ transform: rotate(6deg); }} }}
""",
    'ui-scramble': """
/* ---- Decode cadence --------------------------------------------------------------------- */
.{cls} .ch {{ font-variant-ligatures: none; }}
.{cls}[data-decoding="true"] {{ color: oklch(1 0 0 / 0.7); text-shadow: 0 0 12px oklch(1 0 0 / 0.25); }}
""",
    'ui-typewriter': """
/* ---- Caret -------------------------------------------------------------------------------- */
.{cls}::after {{
  content: ""; width: 0.55ch; height: 1em; margin-left: 2px;
  background: oklch(1 0 0 / 0.85); display: inline-block; vertical-align: -0.15em;
  animation: {p}-blink 1s steps(2) infinite;
}}
@keyframes {p}-blink {{ 50% {{ opacity: 0; }} }}
""",
    'ui-staggergrid': """
/* ---- Wave order ------------------------------------------------------------------------------- */
.{cls} > * {{ opacity: 0; transform: translate3d(0, 26px, -50px) rotateX(12deg); }}
.{cls}[data-entered="true"] > * {{
  opacity: 1; transform: none;
  transition: opacity 0.65s var(--{p}-ease), transform 0.65s var(--{p}-ease);
  transition-delay: calc((var(--col, 0) + var(--row, 0)) * 70ms);
}}
""",
    'ui-carousel': """
/* ---- Coverflow ------------------------------------------------------------------------------------ */
.{cls} .slide {{ position: absolute; inset: 0; transition: transform 0.7s var(--{p}-ease), opacity 0.7s; opacity: 0.25; }}
.{cls} .slide[data-pos="-1"] {{ transform: translate3d(-72%, 0, -160px) rotateY(38deg); }}
.{cls} .slide[data-pos="1"] {{ transform: translate3d(72%, 0, -160px) rotateY(-38deg); }}
.{cls} .slide[data-pos="0"] {{ opacity: 1; transform: translateZ(40px); z-index: 2; }}
""",
    'ui-accordion': """
/* ---- Chevron + panel --------------------------------------------------------------------------------- */
.{cls} .chev {{ transition: transform 0.45s var(--{p}-spring); transform: rotateX(0); }}
.{cls}[open] .chev, .{cls}[data-open="true"] .chev {{ transform: rotateX(180deg); }}
.{cls} .panel {{ transform-origin: top; animation: {p}-unfold 0.5s var(--{p}-ease) both; }}
@keyframes {p}-unfold {{ from {{ transform: rotateX(-70deg); opacity: 0; }} }}
""",
    'ui-stepper': """
/* ---- Node flow ------------------------------------------------------------------------------------------------ */
.{cls} .node.done {{ background: oklch(1 0 0 / 0.9); box-shadow: 0 0 18px oklch(1 0 0 / 0.35); }}
.{cls} .rail-fill {{ background: repeating-linear-gradient(90deg, oklch(1 0 0 / 0.8) 0 6px, transparent 6px 12px); animation: {p}-flow 1.2s linear infinite; }}
@keyframes {p}-flow {{ to {{ background-position-x: 12px; }} }}
""",
    'ui-herostack': """
/* ---- Plane rates ----------------------------------------------------------------------------------------------------- */
.{cls} [data-plane="1"] {{ transform: translate3d(calc(var(--px, 0) * -8px), calc(var(--py, 0) * -6px), 60px); }}
.{cls} [data-plane="2"] {{ transform: translate3d(calc(var(--px, 0) * -16px), calc(var(--py, 0) * -12px), 20px); }}
.{cls} [data-plane="3"] {{ transform: translate3d(calc(var(--px, 0) * -28px), calc(var(--py, 0) * -20px), -30px); }}
""",
    'ui-noisegrad': """
/* ---- Mesh drift -------------------------------------------------------------------------------------------------------- */
.{cls} .blob {{ filter: blur(70px); mix-blend-mode: screen; animation: {p}-drift 16s ease-in-out infinite alternate; }}
@keyframes {p}-drift {{ to {{ transform: translate3d(12%, -8%, 0) scale(1.2); }} }}
""",
    'ui-edgeglow': """
/* ---- Border pulse ------------------------------------------------------------------------------------------------------------ */
.{cls}[data-live="true"] {{ animation: {p}-pulse 2.6s var(--ui-ease-in-out) infinite; }}
@keyframes {p}-pulse {{ 50% {{ box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.5), 0 0 24px oklch(1 0 0 / 0.16); }} }}
""",
    'ui-tiltwall': """
/* ---- Independent thumbs --------------------------------------------------------------------------------------------------------- */
.{cls} .thumb {{ transform: perspective(900px) rotateX(calc(var(--ty, 0) * 6deg)) rotateY(calc(var(--tx, 0) * 6deg)); transition: transform 0.3s; }}
""",
    'ui-portalload': """
/* ---- Portal spin ----------------------------------------------------------------------------------------------------------------------- */
.{cls} .ring {{ border: 2px solid oklch(1 0 0 / 0.2); border-top-color: oklch(1 0 0 / 0.9); border-radius: 50%; transform: rotateX(62deg); animation: {p}-spin 1.1s linear infinite; }}
@keyframes {p}-spin {{ to {{ transform: rotateX(62deg) rotateZ(360deg); }} }}
""",
    'ui-pinscene': """
/* ---- Scrub variables ------------------------------------------------------------------------------------------------------------------------- */
.{cls} {{ view-timeline-name: --{p}; }}
.{cls} .scrub {{ animation: {p}-travel linear both; animation-timeline: --{p}; animation-range: entry 20% exit 80%; }}
@keyframes {p}-travel {{
  from {{ transform: translate3d(0, 60px, -80px) rotateX(14deg); opacity: 0; }}
  40%  {{ opacity: 1; }}
  to   {{ transform: translate3d(0, -60px, 40px); opacity: 0; }}
}}
""",
    'ui-wheel': """
/* ---- Cylinder slots -------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .slot {{ transform: rotateX(calc(var(--i, 0) * 30deg)) translateZ(120px); backface-visibility: hidden; }}
.{cls} .reel {{ transform-style: preserve-3d; transition: transform 0.6s var(--{p}-spring); }}
""",
    'ui-ctxmenu': """
/* ---- Item cascade ------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .item {{ opacity: 0; transform: translate3d(-8px, 0, -20px); animation: {p}-in 0.3s var(--{p}-ease) forwards; animation-delay: calc(var(--i, 0) * 30ms); }}
@keyframes {p}-in {{ to {{ opacity: 1; transform: none; }} }}
""",
    'ui-cmdk': """
/* ---- Keycaps ----------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} kbd {{ box-shadow: 0 2px 0 oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.25); transition: transform 0.15s var(--{p}-spring); }}
.{cls} .opt:active kbd {{ transform: translateY(2px); }}
""",
    'ui-bubbletip': """
/* ---- Spring bubble ------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .tip {{ transform-origin: bottom center; animation: {p}-pop 0.32s var(--{p}-spring) both; }}
@keyframes {p}-pop {{ from {{ transform: scale(0.6) translateY(8px); opacity: 0; }} }}
""",
    'ui-conicprog': """
/* ---- Conic sweep -------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .disc {{ background: conic-gradient(oklch(1 0 0 / 0.9) calc(var(--pct, 0) * 1%), oklch(1 0 0 / 0.1) 0); mask: radial-gradient(closest-side, transparent 72%, #000 73%); transition: background 0.3s linear; }}
""",
    'ui-dropzone': """
/* ---- Gravity well ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
.{cls}[data-dragging="true"] {{ transform: scale(1.02); border-color: oklch(1 0 0 / 0.6); }}
.{cls}[data-dragging="true"] .well {{ animation: {p}-pull 1.4s var(--ui-ease-in-out) infinite; }}
@keyframes {p}-pull {{ 50% {{ transform: translateZ(30px) scale(1.08); }} }}
""",
    'ui-tagsoup': """
/* ---- Sphere projection --------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .tag {{ transform: translate3d(calc(var(--x, 0) * 1px), calc(var(--y, 0) * 1px), calc(var(--z, 0) * 1px)); opacity: calc(0.35 + var(--zn, 0.5) * 0.65); }}
""",
    'ui-quote': """
/* ---- Rule draw ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
.{cls} .rule {{ transform: scaleX(0); transform-origin: left; transition: transform 1s var(--{p}-ease) 0.3s; }}
.{cls}[data-entered="true"] .rule {{ transform: scaleX(1); }}
""",
    'ui-tablelux': """
/* ---- Row lift --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} tbody tr:hover {{ transform: translateZ(24px) scale(1.004); background: oklch(1 0 0 / 0.05); box-shadow: 0 12px 30px -18px oklch(0 0 0 / 0.9); }}
.{cls} thead th {{ backdrop-filter: blur(14px); background: oklch(0.1 0 0 / 0.7); }}
""",
    'ui-avatarfan': """
/* ---- Fan out ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .av {{ transition: transform 0.4s var(--{p}-spring); margin-left: -10px; }}
.{cls}:hover .av:nth-child(2) {{ transform: translate3d(10px, -4px, 20px) rotate(6deg); }}
.{cls}:hover .av:nth-child(3) {{ transform: translate3d(20px, 0, 30px) rotate(-4deg); }}
""",
    'ui-banner': """
/* ---- Collapse exit ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls}[data-dismissing="true"] {{ animation: {p}-collapse 0.5s var(--{p}-ease) forwards; }}
@keyframes {p}-collapse {{ to {{ transform: translate3d(0, -120%, 0); opacity: 0; }} }}
""",
    'ui-drawer': """
/* ---- Layered walls ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
.{cls} .wall-back {{ transform: translateX(calc(var(--open, 0) * -40%)); opacity: 0.5; }}
.{cls} .wall-front {{ transform: translateX(calc((var(--open, 0) - 1) * 100%)); }}
""",
    'ui-pagination': """
/* ---- Arc dots ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .dot {{ transform: rotate(calc((var(--i, 0) - var(--mid, 2)) * 8deg)); transition: transform 0.4s var(--{p}-spring); }}
.{cls} .dot[aria-current="true"] {{ scale: 1.5; box-shadow: 0 0 14px oklch(1 0 0 / 0.5); }}
""",
    'ui-breadcrumb': """
/* ---- Traveling highlight --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .crumb {{ position: relative; overflow: hidden; }}
.{cls} .crumb::after {{ content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.5), transparent); animation: {p}-travel 2.4s linear infinite; }}
@keyframes {p}-travel {{ from {{ transform: translateX(-100%); }} to {{ transform: translateX(200%); }} }}
""",
    'ui-ctabeam': """
/* ---- Radar beams ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .beam {{ border: 1px solid oklch(1 0 0 / 0.25); border-radius: 50%; animation: {p}-emit 3s var(--{p}-ease) infinite; }}
@keyframes {p}-emit {{ from {{ inset: 0; opacity: 0.8; }} to {{ inset: -140%; opacity: 0; }} }}
""",
    'ui-statusdot': """
/* ---- Breath cycle --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls}::after {{ content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid currentColor; animation: {p}-breathe 2.8s var(--ui-ease-in-out) infinite; }}
@keyframes {p}-breathe {{ 0%, 100% {{ transform: scale(0.6); opacity: 0; }} 40% {{ opacity: 0.7; }} 60% {{ transform: scale(1.4); opacity: 0; }} }}
""",
    'ui-outro': """
/* ---- Curtain wipe ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
.{cls} .curtain {{ transform: scaleY(var(--scrub, 0)); transform-origin: top; transition: transform 0.8s var(--{p}-ease); }}
.{cls}[data-entered="true"] .settle {{ animation: {p}-settle 1.2s var(--{p}-ease) both; }}
@keyframes {p}-settle {{ from {{ transform: translate3d(0, 20px, -40px); opacity: 0; }} }}
""",
}


def main() -> None:
    for n, slug, title, blurb, cls, children in LAYERS:
        css = full_layer(
            str(n), title, blurb, cls,
            children=children,
            extra=EXTRAS.get(cls, ""),
        )
        path = os.path.join(DIR, f"{n:02d}-{slug}.css")
        with open(path, "w") as f:
            f.write(css)
        print(f"{path}  ({css.count(chr(10))} lines)")


if __name__ == "__main__":
    main()

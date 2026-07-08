# Design System & Motion Playbook

A distilled, reusable reference of the design concepts, animation techniques, and
engineering rules that make this project look and feel the way it does. Built to
be pasted (whole or in part) into future project prompts so Claude reproduces the
same quality bar.

The house style in one line: **a near-monochrome warm-dark editorial system, one
gold accent, compositor-only motion, everything degrades gracefully.**

---

## 1. Non-negotiable rules (paste these first)

These are the constraints that keep every effect fast and accessible. State them
up front in any prompt.

1. **Compositor-only motion.** Animate only `transform` / `opacity` / `scale` /
   `translate` / `rotate` / `filter`(static). Never animate `width`, `height`,
   `top`/`left`, `box-shadow`, `background-position`, or `backdrop-filter` on the
   hot path. Shadows/glows are **static layers that are cross-faded or ride
   along**, never animated directly.
2. **Lighthouse 100 across all four categories, every build.** No effect ships
   that costs frame rate, causes layout, or forces per-frame rasterization.
3. **`prefers-reduced-motion: reduce` in every component.** Drop the movement but
   **keep the state feedback** (color, border, focus ring). Hidden pre-animation
   states live *only* inside `@media (prefers-reduced-motion: no-preference)` so a
   reduced-motion or no-JS visitor is never stranded with invisible content.
4. **No inline styles.** JS writes CSS custom properties only (e.g. `--btn-mx`);
   all transform/easing math lives in the stylesheet.
5. **IDs are never CSS/JS hooks.** Style with classes; hook JS with classes +
   `data-*` attributes.
6. **`will-change` is a last resort**, scoped to the interaction and released
   after (applied only during `:hover` or an `.is-open` state, never blanket).
7. **Semantic HTML + ARIA foundations.** Real `<button>`/`<a>`/`<dialog>`,
   `<dl>/<dt>/<dd>` for stat pairs, decorative layers `aria-hidden`/`focusable="false"`,
   focus states that mirror hover (`:focus-visible` paired on every hover rule).
8. **SPA-lifecycle-safe JS** (if using Astro View Transitions / a client router):
   init on `astro:page-load`, one `AbortController` per component with all
   listeners registered `{ signal }`, tear down (abort + disconnect observers) on
   `astro:before-swap`. Re-query the live DOM each swap.

---

## 2. The token system (the backbone)

Everything keys off a tiny set of tokens. One accent, two easing curves.

```css
/* One accent color threads the entire site */
--clr-primary-gold: hsl(42, 47%, 56%);   /* ≈ #c4a45a / rgb(225,189,104) */

/* Two easing curves, chosen for different jobs */
--ease:        cubic-bezier(0.16, 1, 0.3, 1);      /* expo ease-out — INTERACTION
                                                       (hover, sweeps). Snaps most
                                                       of the way, then settles.
                                                       Feels premium/snappy. */
--ease-reveal: cubic-bezier(0.215, 0.61, 0.355, 1); /* easeOutCubic — SCROLL-IN
                                                        reveals. Glides in instead
                                                        of flashing. */
```

**Translucency from one token.** Build every faint fill, hover tint, glow, and
hairline from the single gold token via `color-mix(in srgb, var(--clr-primary-gold) N%, transparent)`
(or `hsl(from … h s l / a)`). One source of truth, graded strengths.

**Type is fluid.** Sizes use `clamp(min, computed-vw-slope, max)` with tight
negative tracking on display type (`-0.02` to `-0.06em`) and sub-1 `line-height`
(0.82–1.0) for poster-like figures. Micro-labels/eyebrows share
`text-transform: uppercase; letter-spacing: 0.12–0.22em; font-weight: 700`.

**Fluid spacing + a shared grid.** A `--spacing-*` scale (0.5rem unit) and a named
`grid-main` column system (3-col → 8-col → 12-col at 40rem/62.5rem breakpoints)
with `1fr` bleed margins; content lands at `grid-column: 2 / -2`. Sections opt
specific elements into wider/narrower spans. **Sections use `.grid-main` on the
root — never hand-rolled max-width/margin-auto centering.**

**Font-swap CLS killed with a metric-matched fallback.** A `@font-face` fallback
(local Arial family) scaled via `size-adjust` + `ascent/descent-override` (values
generated with Capsize) so the brand font swaps in with **zero reflow**.

---

## 3. Signature techniques (the reusable catalog)

### Motion & reveal
- **Global scroll-reveal system.** `.fade-in` (`scale 0.985→1` + opacity, 700ms)
  gains `.is-visible` from a shared IntersectionObserver. Mobile trips off the top
  edge (`threshold:0`, `rootMargin:"0px 0px -12%"`); wider screens wait for 20% in
  view — height-independent so tall and short sections reveal at the same moment.
  One-shot (`unobserve` after firing).
- **Staggered cascades** via `:nth-child` `transition-delay` / `animation-delay`
  (hand-listed, e.g. `0.12s / 0.2s / 0.28s…`). Layout-aware: reveal per-row on
  mobile, per-block on desktop so compact tables don't show blank cells beside
  filled ones.
- **Word-mask headline reveal.** Each word wrapped in an `overflow:hidden` mask;
  inner span rises `translateY(120%)→0` (120% not 100% so no glyph edge peeks),
  staggered per word. Negative margins on the mask give descenders/underline/italic
  room without shifting line spacing.
- **Draw-on underline as the last beat.** A `::after` bar, `transform-origin:left`,
  `scaleX(0)→scaleX(1)` — sequenced *after* the words settle (delay ~1.2s) as the
  closing flourish. Also used standalone for italic accent words that "draw" their
  underline when scrolled into view (`ItalicTitle`).
- **`hold-entrance` hand-off.** During a page transition, entrance animations are
  `animation-play-state: paused` behind the closing curtain, then released a beat
  after it opens — so the staggered reveal doesn't burn down while hidden.

### Hover / interaction
- **Gold vertical accent bar (the signature idiom).** A 2px `::before` on an
  element's left edge, `scaleY(0)→scaleY(1)` from the top on hover/focus (0.5–0.6s
  `--ease`). Reused across cards, nav rows, FAQ open-state, ledger rows. Hold it at
  `scaleY(1)` permanently to mark a "featured/current" item without extra markup.
- **Magnetic buttons.** Primary button drifts toward the cursor. JS writes only
  `--btn-mx`/`--btn-my` (one `requestAnimationFrame` write per frame, `rect`
  measured once per hover to avoid layout feedback); transform composes magnetic +
  lift channels. Pointer- and motion-gated. `translate` triggers neither layout nor
  paint. Secondary buttons deliberately **omit** the pull to preserve hierarchy.
- **`@property` typed custom props** so `transform` can interpolate JS-driven and
  CSS-driven offsets in one declaration
  (`translate(var(--btn-mx), calc(var(--btn-my) + var(--btn-lift)))`). Identity at
  rest → no idle GPU layer.
- **Character-roll links (`RollLink`).** Text split into per-char spans **at build
  time**; two stacked copies in an `overflow:hidden` box roll vertically, staggered
  left-to-right (split-flap board). Fully tokenized (`--roll-link-stagger/duration/ease`).
  Under reduced motion the roll drops but the color shift stays.
- **Lift + elevation shadow the right way.** Card does `translateY(-6px)`; the
  deeper shadow lives on a **separate `::after` layer** that just cross-fades
  `opacity 0→1` — never animate `box-shadow` directly. Inner image `scale(1.03)`
  inside `overflow:hidden`.
- **Diagonal shimmer sweep.** A single `::after` gradient layer
  (`linear-gradient(105deg, transparent, gold 6%, transparent)`) translated
  `-100%→100%` on hover. `pointer-events:none`.
- **Underline sweep links.** Pseudo-element underline `scaleX(0)→scaleX(1)` from
  left + arrow icon nudged `translateX(3px)`.

### Scroll-driven choreography
- **Pinned hero, scroll-over reveal.** Hero is `position:sticky; z-index:-1`; the
  next opaque section scrolls up over it (parallax/depth with **zero scroll
  listeners**). A 1px sentinel after the hero drives JS pause logic.
- **Sticky card-deck stack.** Cards `position:sticky` with staggered `top` (`calc(base + N*peek)`)
  and ascending `z-index`, so each pins lower and slides over the last, leaving a
  peek strip. A rAF-throttled handler batch-reads rects before writes to freeze the
  pile cleanly when the last card lands.
- **Scroll-morphing pinned figure.** A pinned stat column cross-fades its
  number/caption as each scrolling panel crosses center. IO with
  `rootMargin:"-50% 0px -50% 0px"` (collapsed to a centerline) picks the active
  panel; the value swaps at the invisible "trough" of a fade so text never visibly
  mutates.
- **Scroll-progress timeline rail, progressively enhanced.** Baseline: JS IO sets
  `--process-progress`, rail fill `scaleY(var(...))`. Enhanced inside
  `@supports (animation-timeline: view())`: `view-timeline` + `animation-range`
  ties the fill continuously to scroll **on the compositor, no scroll listener**.
- **Sticky pinned column** wrapped in a *plain non-grid* wrapper so its containing
  block is the two-column region only (a sticky grid item would be bounded by the
  whole grid).

### Native platform components
- **Native `<dialog>` modals** opened with `showModal()` (top layer, real backdrop,
  free focus trap + Esc). Animated open **and close** with the modern recipe:
  `@starting-style` for entry + `transition: overlay …allow-discrete, display …allow-discrete`
  so the exit animation plays before `display:none`. Pin `position:fixed; inset:0;
  margin:auto` so it can't "drop" mid-exit. Backdrop `blur()` + close-on-backdrop-click.
  Scroll-lock class on `<html>` (not `<body>`, which the router replaces).
- **Accordion via CSS Grid rows.** Panel `grid-template-rows: 0fr → 1fr` animates
  to intrinsic height with **no JS measurement**. `aria-expanded` is the single
  source of truth; CSS reacts via `:has(...[aria-expanded="true"])`. Plus→cross
  icon rotates `135deg`; answer text fades+rises a hair faster than the clip.
- **WAI-ARIA tabs** with roving `tabindex`, arrow/Home/End keys, a sliding 1px
  indicator positioned by `translateX() scaleX()` (compositor-only), and a
  cross-fade-guarded panel swap with smooth height morph.

### Atmosphere & texture
- **Film grain overlay.** `body::after` fixed, `pointer-events:none`, an inline
  `data:image/svg+xml` `feTurbulence` fractal-noise tile at `opacity:0.088`,
  `background-size:160px` — a **static raster painted once**, zero per-frame cost.
  Re-painted inside top-layer dialogs (which the global one can't reach).
- **Canvas particle field (performance masterclass).** Faint gold dots drifting.
  (1) Count scales to viewport via `matchMedia` breakpoints; resize re-seeds.
  (2) **Throttled to ~30fps** even on 144Hz (`FRAME_MS = 1000/30`) — sub-pixel
  drift doesn't need native refresh; cuts full-canvas repaints ~5×. (3) Motion is
  **time-based** (`step = elapsed/BASE_MS`) so speed is refresh-rate-independent,
  clamped to 4 frames so a backgrounded tab can't teleport the field. (4) Runs
  **only when visible** (IntersectionObserver + `visibilitychange`). (5) Fully
  skipped under reduced motion (early return, no context created).
- **Layered SVG hero flair.** Concentric rings (graded `stroke-opacity` 0.07→0.12
  for depth), orbiting dots on `<g>` groups spun by `@keyframes … rotate:1turn` at
  desynced speeds (22s / 14s reverse / 9s), a radial-gradient glow pulsed 4s, and
  conic-gradient "light-sweep" arcs. `contain: layout style paint` isolates it.
- **Page-transition shutter.** Two fixed gold-edged panels seal over the viewport
  (transform-only on persisted layers), the DOM swaps hidden beneath, then they
  open — covering the near-black cross-fade flash a dark site is prone to.
- **Viewfinder corner brackets.** Four `aria-hidden` spans, each an L drawn from a
  1px `::before` (vertical) + 1px `::after` (horizontal) in gold. Frames heroes,
  forms, portraits, ledgers. No images.
- **Sticky header snap-blur.** Transparent at top; past 24px scroll it pops to a
  translucent dark tint + hairline border + shadow + `backdrop-filter: blur(20px)
  saturate(1.4)`. **The blur snaps on — only bg/border/shadow are transitioned**
  (animating backdrop-filter re-samples every frame). rAF-throttled `{passive:true}`
  scroll listener toggles one class.

### The subpixel-AA guard (a subtle but repeated trick)
Several settled states use `transform: translateZ(0)` instead of `none`,
deliberately **holding a compositor layer** so text keeps grayscale AA rather than
snapping back to subpixel AA (which nudges glyphs a fraction of a pixel — the
visible "settle stutter"). Same reason marquees use `translate3d(-50%,0,0)` not
`translateX` at sub-1px/frame speeds. A layer that always exists has nothing to
tear down.

### Editorial / ledger layout
- **Ledger frame:** bordered panel + corner brackets + a top-anchored gold tint
  wash (`linear-gradient(180deg, gold-faint, transparent 220px)` — warms the header
  only). Accounting-row grids (`index gutter / stat / promise / remedy`) with a
  continuous gold "thread" gradient linking nodes down the gutter.
- **Hairline rules as pseudo-elements, not borders** — `N` rows yield `N+1` clean
  rules with independently tunable width/inset; full-bleed bands escape the content
  column via negative `inset-inline`.
- **`display: contents` for responsive restructuring** — an element folds out of /
  into a layout across breakpoints without extra wrappers.
- **Stat treatments:** fluid `clamp()` numerals, `font-variant-numeric: tabular-nums`
  on every measured/animated figure, unit-splitting (`"1.2s"` → big value + small
  muted unit), faux browser-chrome frame (traffic-light dots + URL pill) so a flat
  screenshot reads as a live site.
- **Build-time over runtime** — e.g. a sparkline emitted as static SVG `<rect>`
  geometry at build, no per-frame JS.

---

## 4. Ready-to-paste prompt block

> Build this with a near-monochrome warm-dark editorial aesthetic and a single
> gold accent color, all derived from CSS custom properties (one accent token,
> graded via `color-mix`). Use two easing curves: an expo ease-out
> `cubic-bezier(0.16,1,0.3,1)` for hover/interaction, and easeOutCubic
> `cubic-bezier(0.215,0.61,0.355,1)` for scroll-in reveals.
>
> Every animation must be compositor-only (transform/opacity/scale only — never
> width, height, box-shadow, or backdrop-filter on the hot path; cross-fade static
> shadow layers instead of animating them). Target Lighthouse 100 in all four
> categories. No inline styles (JS writes CSS custom properties only). No IDs as
> style/JS hooks. `will-change` only scoped to an active interaction.
>
> Include `@media (prefers-reduced-motion: reduce)` in every component that drops
> motion but keeps color/border/focus feedback; put hidden pre-animation states
> only inside `prefers-reduced-motion: no-preference` so reduced-motion and no-JS
> users are never stranded with invisible content. Use semantic HTML, native
> `<dialog>`/`<details>` where they fit, `:focus-visible` paired on every hover
> rule, and decorative layers marked `aria-hidden`.
>
> Fluid typography via `clamp()` with tight negative tracking on display type;
> uppercase tracked micro-labels for eyebrows. Scroll reveals via a shared
> IntersectionObserver adding an `.is-visible` class, staggered with `:nth-child`
> delays. Favor the signature moves from this system where they fit: the gold
> `scaleY(0→1)` left-edge accent bar on hover, word-mask headline reveals, a
> draw-on underline as the closing beat, magnetic primary buttons (JS writes only
> custom props), a static SVG film-grain overlay, and a throttled/visibility-gated
> canvas particle field if an ambient background is wanted.
>
> If using a client-side router, make all JS lifecycle-safe: init per page, one
> AbortController per component, tear down observers/listeners on navigation.

---

*Generated from an audit of this project's `src/` — components, styles, and
scripts. Treat it as a menu, not a mandate: pull the pieces that fit each new
project's brief.*

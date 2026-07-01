import { initScrollReveal } from "@/components/helpers/scrollReveal";

/**
 * Magnetic primary buttons: the button drifts toward the cursor while hovered.
 *
 * JS writes only two custom properties (--btn-mx / --btn-my); the transform,
 * easing and hover lift all live in the stylesheet, so there are no
 * presentational inline styles. Pointer- and motion-gated, and compositor-only:
 * a `translate` triggers neither layout nor paint, so there is no CLS and no
 * Lighthouse impact.
 */
function initMagneticButtons() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (reduceMotion.matches || !finePointer.matches) return;

  const STRENGTH = 20; // total px of travel; the offset is bounded to ±STRENGTH/2

  document.querySelectorAll("[data-magnetic]").forEach((btn) => {
    let rect = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    function apply() {
      frame = 0;
      const x = ((pointerX - rect.left) / rect.width - 0.5) * STRENGTH;
      const y = ((pointerY - rect.top) / rect.height - 0.5) * STRENGTH;
      btn.style.setProperty("--btn-mx", `${x}px`);
      btn.style.setProperty("--btn-my", `${y}px`);
    }

    function onEnter(e) {
      // Measured once per hover, at rest, so the maths never feed back on the
      // transform just applied. Reused each frame: no per-move layout read.
      rect = btn.getBoundingClientRect();
      pointerX = e.clientX;
      pointerY = e.clientY;
    }

    function onMove(e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!rect) rect = btn.getBoundingClientRect();
      if (!frame) frame = requestAnimationFrame(apply); // one write per frame
    }

    function reset() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      rect = null;
      btn.style.setProperty("--btn-mx", "0px");
      btn.style.setProperty("--btn-my", "0px");
    }

    btn.addEventListener("pointerenter", onEnter);
    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerleave", reset);
    btn.addEventListener("pointercancel", reset);
  });
}

/**
 * Page-transition shutter (ClientRouter). On navigation, two gold-edged panels
 * seal over the viewport, the page swaps hidden beneath them, then they open
 * onto the new page. Markup lives in PrimaryLayout, styling in global.css; here
 * we only drive the seal/open around the swap.
 *
 * Transform-only on two fixed, persisted panels: no layout, no per-frame
 * raster. The panel is `transition:persist`-ed, so it keeps its sealed state
 * across the DOM swap and we simply open it afterwards. Reduced-motion users
 * skip the shutter entirely and get Astro's instant swap.
 */
const SHUTTER_SAFETY_MS = 1200; // resolve even if transitionend is missed (> 0.9s seal)
const SHUTTER_HOLD_MS = 160; // beat held fully sealed so the gold seam registers
const ENTRANCE_HOLD_CLASS = "hold-entrance"; // pauses hero entrance anims behind the shutter
const ENTRANCE_RELEASE_MS = 650; // beat after the curtain starts opening before the hero rises in

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function driveShutter(sealed) {
  const shutter = document.querySelector(".page-shutter");
  if (!shutter) return Promise.resolve();
  const panel = shutter.querySelector(".page-shutter__panel--bottom");

  return new Promise((resolve) => {
    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      panel.removeEventListener("transitionend", onEnd);
      resolve();
    }
    function onEnd(e) {
      if (e.target === panel && e.propertyName === "transform") finish();
    }
    panel.addEventListener("transitionend", onEnd);
    // Flip on the next frame so the panels animate from their current state.
    requestAnimationFrame(() => shutter.classList.toggle("is-sealed", sealed));
    setTimeout(finish, SHUTTER_SAFETY_MS);
  });
}

function initShutter() {
  // Seal the shutter while the next page loads, in parallel, so the swap is
  // covered the moment both finish. Wrapping the loader holds the swap until
  // the panels are shut.
  document.addEventListener("astro:before-preparation", (event) => {
    if (prefersReducedMotion()) return;
    const load = event.loader;
    event.loader = async () => {
      await Promise.all([driveShutter(true), load()]);
    };
  });

  // Hold the incoming page's hero entrance animations at their first frame so
  // the staggered reveal doesn't burn down behind the sealed shutter. We tag the
  // *incoming* document's <html> (not the live one) so the class is in place the
  // instant the DOM swaps in and the animations mount already paused. Only this
  // client code ever adds the class, so a no-JS or reduced-motion visit animates
  // normally on load.
  document.addEventListener("astro:before-swap", (event) => {
    if (prefersReducedMotion()) return;
    event.newDocument.documentElement.classList.add(ENTRANCE_HOLD_CLASS);
  });

  // New DOM is in place beneath the sealed panels. Hold the sealed frame for a
  // beat (so the gold seam reads as deliberate), then wait one painted frame
  // and open onto the new page.
  document.addEventListener("astro:after-swap", () => {
    if (prefersReducedMotion()) return;
    setTimeout(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // Open the curtain, then release the entrance a beat later so the hero
          // rises in once the curtain has visibly parted, not the instant it moves.
          driveShutter(false);
          setTimeout(
            () => document.documentElement.classList.remove(ENTRANCE_HOLD_CLASS),
            ENTRANCE_RELEASE_MS,
          );
        }),
      );
    }, SHUTTER_HOLD_MS);
  });
}

/**
 * Per-page initialisation. Runs on the initial load and after every
 * View Transitions swap, because `astro:page-load` fires on both. Each
 * call re-queries the live DOM, so the freshly swapped-in page gets its
 * own observers and listeners. Re-running is cheap: the script is already
 * downloaded and parsed once per session; this only re-executes functions.
 *
 * Magnetic buttons bind to the new DOM nodes each swap (the old nodes are
 * discarded, so no listeners stack). Scroll reveal builds a fresh observer
 * for the new `.fade-in` elements; the previous one is dropped with its
 * now-detached targets.
 */
function initPage() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initScrollReveal, { timeout: 1000 });
  } else {
    initScrollReveal();
  }

  initMagneticButtons();
}

if (typeof window !== "undefined") {
  document.addEventListener("astro:page-load", initPage);

  // Registered once: these ClientRouter lifecycle listeners live on `document`,
  // which survives swaps, so binding them per page would stack duplicates.
  initShutter();

  // Bound once. `document` survives View Transitions swaps, so this delegated
  // handler must live outside `initPage` — re-binding it per swap would stack
  // duplicate listeners and double-fire the GTM event.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-track='cta']");
    if (!btn) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cta_click",
      cta_text: btn.textContent.trim(),
      cta_destination: btn.href || "form_submit",
    });
  });
}
